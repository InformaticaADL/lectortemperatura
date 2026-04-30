const { Sequelize, Op } = require("sequelize");
const sequelize = require("../db/SequelizeConfig");
const defineApoyoModel = require("../models/ApoyoData");
const ApoyoData = defineApoyoModel(sequelize);

const consolidar = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { data, nombreArchivo, equipoId } = req.body;

    console.log(`📥 Recibiendo archivo de apoyo: ${nombreArchivo}`);

    if (!data || (Array.isArray(data) && data.length === 0)) {
      await t.rollback();
      return res.status(400).json({
        message: "No se recibieron datos válidos."
      });
    }

    // 1. Preparar los datos (Mapeo id_unico -> id_registro)
    const datosBrutos = data.map(item => {
      // Formatear Fecha (YYYY-MM-DD)
      const fechaFormatted = formatDate(item.fecha);
      // Formatear Hora (HH:mm)
      const horaFormatted = formatTime(item.hora);

      // Generar ID único: EQUIPO_ID_FECHA_HORA
      const generatedId = `${equipoId}_${fechaFormatted}_${horaFormatted}`;

      return {
        ...item,
        id_registro: generatedId,
        equipo_id: equipoId,
        fecha: fechaFormatted,
        hora: horaFormatted,
        temperatura: parseFloat(item.temperatura)
      };
    });

    // 1.5. Deduplicar internamente (Si el archivo tiene la misma hora/fecha repetida)
    const uniqueMap = new Map();
    datosBrutos.forEach(item => {
      if (!uniqueMap.has(item.id_registro)) {
        uniqueMap.set(item.id_registro, item);
      }
    });
    const datosFormateados = Array.from(uniqueMap.values());

    // 2. Extraer todos los IDs que intentamos subir
    const idsEntrantes = datosFormateados.map(d => d.id_registro);

    // 3. Consultar a la BD cuáles de esos IDs YA existen
    const registrosExistentes = await ApoyoData.findAll({
      where: {
        id_registro: {
          [Op.in]: idsEntrantes
        }
      },
      attributes: ['id_registro'],
      transaction: t,
      raw: true
    });

    const setIdsExistentes = new Set(registrosExistentes.map(r => r.id_registro));

    // 4. Filtrar: Nos quedamos SOLO con los que NO están en el Set
    const registrosNuevos = datosFormateados.filter(item => !setIdsExistentes.has(item.id_registro));

    console.log(`📊 Análisis: ${datosBrutos.length} recibidos (${datosBrutos.length - datosFormateados.length} dups internos). ${setIdsExistentes.size} ya existían. ${registrosNuevos.length} nuevos a insertar.`);

    // 5. Insertar solo si hay nuevos
    if (registrosNuevos.length > 0) {
      await ApoyoData.bulkCreate(registrosNuevos, { transaction: t });
    }

    await t.commit();
    console.log("💾 Carga finalizada correctamente.");

    return res.status(200).json({
      message: "Proceso completado.",
      totalRecibidos: datosBrutos.length,
      nuevosInsertados: registrosNuevos.length,
      omitidosDuplicados: setIdsExistentes.size + (datosBrutos.length - datosFormateados.length)
    });

  } catch (error) {
    if (t) await t.rollback();
    console.error("❌ Error al guardar:", error);
    return res.status(500).json({
      message: "Error interno al guardar los datos.",
      error: error.message
    });
  }
};

const formatDate = (dateStr) => {
  if (!dateStr) return "";
  if (dateStr.includes('-')) {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      // Check DD-MM-YYYY vs YYYY-MM-DD
      if (parts[0].length === 2 && parts[2].length === 4) {
        return `${parts[2]}-${parts[1]}-${parts[0]}`; 
      }
    }
  } else if (dateStr.includes('/')) {
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      if (parts[0].length === 2 && parts[2].length === 4) {
        return `${parts[2]}-${parts[1]}-${parts[0]}`; // DD/MM/YYYY
      } else if (parts[2].length === 2 && parts[0].length === 2) {
         // MM/DD/YY usually not handled here but could be
      }
    }
  }
  return dateStr;
};

const formatTime = (timeStr) => {
  if (timeStr && timeStr.length > 5) {
    return timeStr.substring(0, 5); // Take only HH:mm
  }
  return timeStr;
};

const getEquipos = async (req, res) => {
  try {
    const equipos = await ApoyoData.findAll({
      attributes: [
        [Sequelize.fn('DISTINCT', Sequelize.col('equipo_id')), 'equipo_id']
      ],
      order: [['equipo_id', 'ASC']]
    });

    const equiposIds = equipos.map(i => i.equipo_id);
    return res.status(200).json(equiposIds);
  } catch (error) {
    console.error("Error al obtener equipos de apoyo:", error);
    return res.status(500).json({ message: "Error al obtener lista de equipos" });
  }
};

const getApoyoHistory = async (req, res) => {
  try {
    const { equipo_id } = req.params;
    const { startDate, endDate } = req.query;

    const whereClause = { equipo_id };

    if (startDate && endDate) {
      whereClause.fecha = { [Op.between]: [startDate, endDate] };
    } else if (startDate) {
      whereClause.fecha = { [Op.gte]: startDate };
    } else if (endDate) {
      whereClause.fecha = { [Op.lte]: endDate };
    }

    const history = await ApoyoData.findAll({
      where: whereClause,
      attributes: [
        'id_registro',
        'equipo_id',
        [Sequelize.literal("CONVERT(VARCHAR, fecha, 23)"), 'fecha'],
        'hora',
        'temperatura',
        'serial_number'
      ],
      order: [
        ['fecha', 'DESC'],
        ['hora', 'DESC']
      ],
      raw: true
    });

    return res.status(200).json(history);
  } catch (error) {
    console.error("Error al obtener historial de apoyo:", error);
    return res.status(500).json({ message: "Error al obtener el historial" });
  }
};

const getAvailableYears = async (req, res) => {
  try {
    const { equipo_id } = req.params;

    const years = await ApoyoData.findAll({
      where: { equipo_id },
      attributes: [
        [sequelize.literal('DATEPART(year, fecha)'), 'year']
      ],
      group: [sequelize.literal('DATEPART(year, fecha)')],
      order: [[sequelize.literal('year'), 'DESC']],
      raw: true
    });

    const result = years.map(y => y.year);
    return res.status(200).json(result);
  } catch (error) {
    console.error("Error al obtener años disponibles:", error);
    return res.status(500).json({ message: "Error al obtener años" });
  }
};

const getApoyoDateRange = async (req, res) => {
  try {
    const { equipo_id } = req.params;

    const range = await ApoyoData.findOne({
      where: { equipo_id },
      attributes: [
        [sequelize.fn('MIN', sequelize.col('fecha')), 'minDate'],
        [sequelize.fn('MAX', sequelize.col('fecha')), 'maxDate']
      ],
      raw: true
    });

    return res.status(200).json(range);
  } catch (error) {
    console.error("Error al obtener rango de fechas:", error);
    return res.status(500).json({ message: "Error al obtener rango de fechas", error: error.message });
  }
};

const getApoyoDates = async (req, res) => {
  try {
    const { equipo_id } = req.params;

    const dates = await ApoyoData.findAll({
      where: { equipo_id },
      attributes: [
        [sequelize.fn('DISTINCT', sequelize.col('fecha')), 'fecha']
      ],
      order: [['fecha', 'DESC']],
      raw: true
    });

    const result = dates.map(d => d.fecha);
    return res.status(200).json(result);
  } catch (error) {
    console.error("Error al obtener fechas disponibles:", error);
    return res.status(500).json({ message: "Error al obtener fechas disponibles" });
  }
};

// Validar un ciclo (15 minutos continuos con temp >= 120.5)
const validateCycleData = (dataList) => {
  if (!dataList || dataList.length === 0) return { isValid: false };

  // Sort chronologically
  const sortedData = [...dataList].sort((a, b) => {
    const fechaA = String(a.fecha || "");
    const fechaB = String(b.fecha || "");
    const horaA = String(a.hora || "");
    const horaB = String(b.hora || "");
    if (fechaA === fechaB) {
      return horaA.localeCompare(horaB);
    }
    return fechaA.localeCompare(fechaB);
  });

  const formatTimeStr = (timeStr) => {
    if (!timeStr) return "-";
    // If it's a Date object, extract HH:mm
    if (timeStr instanceof Date) {
      return `${String(timeStr.getUTCHours()).padStart(2, '0')}:${String(timeStr.getUTCMinutes()).padStart(2, '0')}`;
    }
    const str = String(timeStr);
    // If it looks like an ISO date (e.g. "1899-12-30T10:16:44.000Z")
    if (str.includes("T") && str.includes("Z")) {
      const d = new Date(str);
      if (!isNaN(d.getTime())) {
        return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
      }
    }
    if (str.includes("T")) return str.split("T")[1].substring(0, 5);
    if (str.length >= 5) return str.substring(0, 5);
    return str;
  };

  const formatFechaStr = (fecha) => {
    if (!fecha) return "";
    if (fecha instanceof Date) {
      return fecha.toISOString().split("T")[0];
    }
    const str = String(fecha);
    if (str.includes("T")) return str.split("T")[0];
    return str;
  };

  // Debug: log first item to verify data types
  if (sortedData.length > 0) {
    const sample = sortedData[0];
    console.log(`[Metrics Debug] Sample - fecha: ${sample.fecha} (${typeof sample.fecha}), hora: ${sample.hora} (${typeof sample.hora}), temp: ${sample.temperatura}`);
  }

  for (let i = 0; i < sortedData.length; i++) {
    let conditionMet = true;
    const startPoint = sortedData[i];
    const cleanStartHora = formatTimeStr(startPoint.hora);
    const cleanStartFecha = formatFechaStr(startPoint.fecha);
    const startDate = new Date(`${cleanStartFecha}T${cleanStartHora}`);

    if (isNaN(startDate.getTime())) continue;

    const endTime = new Date(startDate.getTime() + 15 * 60000);
    let maxTimeFound = startDate;

    for (let j = i; j < sortedData.length; j++) {
      const currentPoint = sortedData[j];
      const cleanCurrentHora = formatTimeStr(currentPoint.hora);
      const cleanCurrentFecha = formatFechaStr(currentPoint.fecha);
      const currentDate = new Date(`${cleanCurrentFecha}T${cleanCurrentHora}`);
      const temp = parseFloat(currentPoint.temperatura);

      if (temp < 120.5) {
        conditionMet = false;
        break;
      }

      maxTimeFound = currentDate;

      if (currentDate >= endTime) {
        break;
      }
    }

    if (conditionMet && maxTimeFound >= endTime) {
      return {
        isValid: true,
        startTime: cleanStartHora,
        endTime: formatTimeStr(`${maxTimeFound.getHours().toString().padStart(2, '0')}:${maxTimeFound.getMinutes().toString().padStart(2, '0')}`)
      };
    }
  }

  return { isValid: false };
};

const getCycleMetrics = async (req, res) => {
  try {
    const { equipo_id } = req.params;
    const { month, startDate, endDate } = req.query; // formato YYYY-MM o rangos de fecha

    let queryStartDate, queryEndDate;

    if (month) {
      // Calcular rango de fechas del mes
      const [year, mon] = month.split('-').map(Number);
      queryStartDate = `${month}-01`;
      const lastDay = new Date(year, mon, 0).getDate();
      queryEndDate = `${month}-${String(lastDay).padStart(2, '0')}`;
    } else if (startDate && endDate) {
      queryStartDate = startDate;
      queryEndDate = endDate;
    } else {
      return res.status(400).json({ message: "Se requiere el parámetro 'month' (YYYY-MM) o 'startDate' y 'endDate'" });
    }

    // Obtener fechas únicas del rango
    const dates = await ApoyoData.findAll({
      where: {
        equipo_id,
        fecha: { [Op.between]: [queryStartDate, queryEndDate] }
      },
      attributes: [
        [sequelize.fn('DISTINCT', sequelize.col('fecha')), 'fecha']
      ],
      order: [['fecha', 'ASC']],
      raw: true
    });

    const fechasUnicas = dates.map(d => d.fecha);

    // Para cada fecha, obtener datos y validar
    const results = [];
    for (const fecha of fechasUnicas) {
      const data = await ApoyoData.findAll({
        where: { equipo_id, fecha },
        attributes: ['id_registro', 'equipo_id', 
          [Sequelize.literal("CONVERT(VARCHAR, fecha, 23)"), 'fecha'],
          'hora', 'temperatura'],
        order: [['hora', 'ASC']],
        raw: true
      });

      const validation = validateCycleData(data);
      results.push({
        fecha,
        isValid: validation.isValid,
        startTime: validation.startTime || null,
        endTime: validation.endTime || null,
        totalRegistros: data.length
      });
    }

    const validos = results.filter(r => r.isValid).length;
    const invalidos = results.filter(r => !r.isValid).length;

    return res.status(200).json({
      month: month || `${startDate} a ${endDate}`,
      queryStartDate,
      queryEndDate,
      equipo_id,
      totalCiclos: results.length,
      validos,
      invalidos,
      ciclos: results
    });

  } catch (error) {
    console.error("Error al obtener métricas de ciclos:", error);
    return res.status(500).json({ message: "Error al obtener métricas", error: error.message });
  }
};

module.exports = {
  consolidar,
  getEquipos,
  getApoyoHistory,
  getAvailableYears,
  getApoyoDateRange,
  getApoyoDates,
  getCycleMetrics
};
