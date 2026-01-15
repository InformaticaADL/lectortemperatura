const { Sequelize, Op } = require("sequelize"); // Agregamos Op para operadores
const sequelize = require("../db/SequelizeConfig");
const defineIncubadoraModel = require("../models/IncubadoraData");
const IncubadoraData = defineIncubadoraModel(sequelize);

const consolidar = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { data, nombreArchivo, incubadoraId } = req.body;

    console.log(`📥 Recibiendo archivo: ${nombreArchivo}`);

    if (!data || (Array.isArray(data) && data.length === 0)) {
      await t.rollback();
      return res.status(400).json({
        message: "No se recibieron datos válidos."
      });
    }

    if (data.length > 0) {
      // console.log(" DEBUG PRE-FORMAT: First item received:", JSON.stringify(data[0]));
    }

    // 1. Preparar los datos (Mapeo id_unico -> id_registro)
    const datosBrutos = data.map(item => {
      // Formatear Fecha (YYYY-MM-DD)
      const fechaFormatted = formatDate(item.fecha);
      // Formatear Hora (HH:mm:ss -> HH:mm)
      const horaFormatted = formatTime(item.hora_intervalo);

      // Generar ID único: NOMBRE_INCUBADORA_FECHA_HORA
      const generatedId = `${incubadoraId}_${fechaFormatted}_${horaFormatted}`;

      return {
        ...item,
        id_registro: generatedId,
        incubadora_id: incubadoraId,
        // CORRECCIÓN CRÍTICA:
        // Pasar la fecha como STRING ("YYYY-MM-DD") directamente a Sequelize.
        // Al pasar new Date(...), JS/Sequelize aplicaban conversiones de zona horaria que restaban un día.
        fecha: fechaFormatted,
        hora_intervalo: horaFormatted
      };
    });

    // 1.5. Deduplicar internamente (Si el excel tiene la misma hora/fecha repetida)
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
    const registrosExistentes = await IncubadoraData.findAll({
      where: {
        id_registro: {
          [Op.in]: idsEntrantes // WHERE id_registro IN (...)
        }
      },
      attributes: ['id_registro'], // Solo necesitamos el ID para comparar
      transaction: t,
      raw: true
    });

    // Creamos un Set para búsqueda rápida
    const setIdsExistentes = new Set(registrosExistentes.map(r => r.id_registro));

    // 4. Filtrar: Nos quedamos SOLO con los que NO están en el Set
    const registrosNuevos = datosFormateados.filter(item => !setIdsExistentes.has(item.id_registro));

    console.log(`📊 Análisis: ${datosBrutos.length} recibidos (${datosBrutos.length - datosFormateados.length} dups internos). ${setIdsExistentes.size} ya existían en BD. ${registrosNuevos.length} nuevos a insertar.`);

    // 5. Insertar solo si hay nuevos
    if (registrosNuevos.length > 0) {
      await IncubadoraData.bulkCreate(registrosNuevos, { transaction: t });
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
    // Return detailed error for debugging
    return res.status(500).json({
      message: "Error interno al guardar los datos.",
      error: error.message,
      originalError: error.original ? error.original.message : null
    });
  }
};

const formatDate = (dateStr) => {
  // Si viene como DD-MM-YYYY, convertir a YYYY-MM-DD
  if (dateStr.includes('-')) {
    const parts = dateStr.split('-');
    if (parts[0].length === 2 && parts[2].length === 4) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`; // DD-MM-YYYY -> YYYY-MM-DD
    }
  }
  return dateStr;
};

const formatTime = (timeStr) => {
  // Si viene como HH:mm:ss, retornar HH:mm
  if (timeStr && timeStr.length > 5) {
    return timeStr.substring(0, 5);
  }
  return timeStr;
};

const getIncubadoras = async (req, res) => {
  try {
    const incubadoras = await IncubadoraData.findAll({
      attributes: [
        [Sequelize.fn('DISTINCT', Sequelize.col('incubadora_id')), 'incubadora_id']
      ],
      order: [['incubadora_id', 'ASC']]
    });

    // Extraer solo los IDs en un array simple
    const incubadoraIds = incubadoras.map(i => i.incubadora_id);

    return res.status(200).json(incubadoraIds);
  } catch (error) {
    console.error("Error al obtener incubadoras:", error);
    return res.status(500).json({ message: "Error al obtener lista de incubadoras" });
  }
};

const getIncubadoraHistory = async (req, res) => {
  try {
    const { incubadora_id } = req.params;
    const { startDate, endDate } = req.query;

    const whereClause = { incubadora_id };

    if (startDate && endDate) {
      whereClause.fecha = {
        [Op.between]: [startDate, endDate]
      };
    } else if (startDate) {
      whereClause.fecha = {
        [Op.gte]: startDate
      };
    } else if (endDate) {
      whereClause.fecha = {
        [Op.lte]: endDate
      };
    }

    const history = await IncubadoraData.findAll({
      where: whereClause,
      attributes: [
        'id_registro',
        'incubadora_id',
        // Forzamos conversión a string en SQL para evitar problemas de zona horaria en Node/Sequelize
        // 23 = formato YYYY-MM-DD en SQL Server
        [Sequelize.literal("CONVERT(VARCHAR, fecha, 23)"), 'fecha'],
        'hora_intervalo',
        'temp_minima',
        'temp_maxima',
        'temp_minima_2',
        'temp_maxima_2',
        'tiempo_puerta',
        'tiempo_motor',
        'tiempo_red',
        'tiempo_alarma',
        'observaciones'
      ],
      order: [
        ['fecha', 'DESC'],
        ['hora_intervalo', 'DESC']
      ],
      raw: true
    });

    // Al usar raw: true y conversión SQL, 'history' ya es el array de objetos limpio
    // y 'fecha' ya es un string "2025-12-01", así que no necesitamos formateo extra.
    return res.status(200).json(history);
  } catch (error) {
    console.error("Error al obtener historial:", error);
    return res.status(500).json({ message: "Error al obtener el historial" });
  }
};

const getAvailableYears = async (req, res) => {
  try {
    const { incubadora_id } = req.params;

    // Sequelize query for distinct years
    // SQL Server syntax: DATEPART(year, fecha)
    const years = await IncubadoraData.findAll({
      where: { incubadora_id },
      attributes: [
        [sequelize.literal('DATEPART(year, fecha)'), 'year']
      ],
      group: [sequelize.literal('DATEPART(year, fecha)')],
      order: [[sequelize.literal('year'), 'DESC']],
      raw: true
    });

    // years will be like [{ year: 2025 }, { year: 2024 }]
    const result = years.map(y => y.year);
    return res.status(200).json(result);

  } catch (error) {
    console.error("Error al obtener años disponibles:", error);
    return res.status(500).json({ message: "Error al obtener años" });
  }
};

const getIncubadoraDateRange = async (req, res) => {
  try {
    const { incubadora_id } = req.params;

    const range = await IncubadoraData.findOne({
      where: { incubadora_id },
      attributes: [
        [sequelize.fn('MIN', sequelize.col('fecha')), 'minDate'],
        [sequelize.fn('MAX', sequelize.col('fecha')), 'maxDate']
      ],
      raw: true
    });

    // range será algo como { minDate: "2024-01-01", maxDate: "2026-12-31" }
    return res.status(200).json(range);

  } catch (error) {
    console.error("Error al obtener rango de fechas:", error);
    return res.status(500).json({ message: "Error al obtener rango de fechas", error: error.message });
  }
};

module.exports = {
  consolidar,
  getIncubadoras,
  getIncubadoraHistory,
  getAvailableYears,
  getIncubadoraDateRange
};
