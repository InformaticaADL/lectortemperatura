import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import api from "@/api/apiConfig";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { toast } from 'react-toastify';

dayjs.extend(utc);

const IncubadoraUpload = () => {
  const [loading, setLoading] = useState(false);
  const [log, setLog] = useState("");
  const [incubadoraId, setIncubadoraId] = useState("INC.12 LAB.BAM.PM");

  // Mapeo: IncubadoraID -> { id: InternalExcelID, keyword: FilenameKeyword }
  const INCUBATOR_MAPPING = {
    "INC.12 LAB.BAM.PM": { id: "PM.VIR-inc-01 ch1", keyword: "INC.12" },
    "INC.07_06.LAB.CCE.PM": { id: "INC.06/LAB. CCE.PM", keyword: "INC.07_06" }, 
    "INC.04.LAB.CCE.PM": { id: "PM.VIR-inc-01 ch1", keyword: "INC.04" }
  };

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // 1. VALIDACIÓN POR NOMBRE DE ARCHIVO (Seguridad Primaria)
    const mapping = INCUBATOR_MAPPING[incubadoraId];
    if (mapping && mapping.keyword) {
      if (!file.name.includes(mapping.keyword)) {
        toast.error(`❌ Archivo Incorrecto. Para ${incubadoraId} el archivo debe contener "${mapping.keyword}" en su nombre.`);
        e.target.value = null; // Reset input
        return;
      }
    }

    setLoading(true);
    setLog(`Procesando archivo para ${incubadoraId}...`);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = await parseExcelData(event.target.result);
        if (data && data.length > 0) {
          await uploadData(data, file.name);
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error(err);
        toast.error("Error al leer el archivo Excel.");
        setLog("❌ Error al leer el archivo Excel.");
        setLoading(false);
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = null; // Reset del input file
  };

  const parseExcelData = async (buffer) => {
    const workbook = XLSX.read(buffer, { type: 'array' });

    if (workbook.SheetNames.length === 0) {
      toast.error("El archivo Excel no tiene hojas.");
      return [];
    }

    // Buscamos explícitamente la hoja "Datos"
    let sheetName = workbook.SheetNames.find(name => name === "Datos");

    if (!sheetName) {
      console.warn("⚠️ Sheet 'Datos' not found. Falling back to first sheet.");
      sheetName = workbook.SheetNames[0];
    }

    const sheet = workbook.Sheets[sheetName];
    // Convertir a array de arrays
    const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1, cellDates: false });

    // --- VALIDACIÓN DE IDENTIDAD (Seguridad Secundaria) ---
    if (jsonData.length > 0) {
      const row0 = jsonData[0];
      const fileIdentifier = row0 && row0[2] ? String(row0[2]).trim() : "DESCONOCIDO";

      const mapping = INCUBATOR_MAPPING[incubadoraId];
      const expectedIdentifier = mapping ? mapping.id : null;

      if (expectedIdentifier && fileIdentifier !== expectedIdentifier) {
        toast.error(`❌ Error de Contenido: El archivo dice ser "${fileIdentifier}" pero se espera "${expectedIdentifier}".`);
        setLog(`❌ Error interno: ID Excel "${fileIdentifier}" no coincide con "${expectedIdentifier}".`);
        return [];
      }
    }
    // --------------------------------

    // ... Resto del parsing (omitido en el reemplazo si no cambia, pero necesito asegurar que jsonData está en scope)
    // El código original sigue aquí...

    // RECONSTRUYENDO EL LOOP DE PARSEO PARA NO ROMPER EL ARCHIVO
    const parsed = [];
    for (let i = 1; i < jsonData.length; i++) {
      const row = jsonData[i];
      if (!row || row.length === 0) continue;
      if (!row[0]) continue;

      let rawDate = row[0];
      let fechaPart = "";
      let horaPart = "";

      if (rawDate instanceof Date) {
        fechaPart = dayjs(rawDate).format("YYYY-MM-DD");
        horaPart = dayjs(rawDate).format("HH:mm");
      } else if (typeof rawDate === 'number') {
        const dateObj = new Date(Math.round((rawDate - 25569) * 86400 * 1000));
        fechaPart = dayjs.utc(dateObj).format("YYYY-MM-DD");
        horaPart = dayjs.utc(dateObj).format("HH:mm");
      } else {
        const d = dayjs(rawDate);
        if (d.isValid()) {
          fechaPart = d.format("YYYY-MM-DD");
          horaPart = d.format("HH:mm");
        } else {
          continue;
        }
      }

      parsed.push({
        fecha: fechaPart,
        hora_intervalo: horaPart,
        temp_minima: normalizeTemp(row[2]),
        temp_maxima: normalizeTemp(row[4]),
        temp_minima_2: normalizeTemp(row[6]),
        temp_maxima_2: normalizeTemp(row[8]),
        tiempo_puerta: Math.round(row[10] || 0),
        tiempo_motor: parseFloat((parseFloat(row[12] || 0)).toFixed(1)),
        tiempo_red: Math.round(row[14] || 0),
        tiempo_alarma: Math.round(row[16] || 0),
        observaciones: row[18] || ""
      });
    }

    return parsed;
  };

  const normalizeTemp = (val) => {
    if (!val) return 0;
    const num = parseFloat(val);
    if (num > 50) return num / 10;
    return num;
  };

  const uploadData = async (data, fileName) => {
    try {
      const res = await api.post('/incubadora/consolidar', {
        data,
        nombreArchivo: fileName,
        incubadoraId: incubadoraId
      });

      const { nuevosInsertados, omitidosDuplicados } = res.data;

      let msg = "";
      let type = "success";

      if (nuevosInsertados > 0 && omitidosDuplicados === 0) {
        // Caso Ideal
        msg = `✅ Éxito: Se guardaron ${nuevosInsertados} nuevos registros.`;
        toast.success(msg);
      } else if (nuevosInsertados > 0 && omitidosDuplicados > 0) {
        // Caso Mixto
        msg = `⚠️ Carga Parcial: ${nuevosInsertados} nuevos guardados. (Se omitieron ${omitidosDuplicados} repetidos).`;
        toast.info(msg);
      } else if (nuevosInsertados === 0 && omitidosDuplicados > 0) {
        // Caso Duplicados
        msg = `Sin cambios: Todos los datos (${omitidosDuplicados}) ya existían en la base de datos.`;
        toast.warning(msg);
      } else {
        // Caso Raro (0 y 0)
        msg = "⚠️ El archivo no contenía datos válidos para procesar.";
        toast.warning(msg);
      }

      setLog(msg);

    } catch (error) {
      console.error(error);
      const errMsg = error.response?.data?.message || "Error al guardar los datos.";
      setLog(`❌ ${errMsg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-md max-w-lg w-full">
      <h3 className="text-lg font-bold mb-4 text-sky-900 border-b pb-2">
        Importar Datos Incubadora (Excel)
      </h3>

      <div className="flex flex-col gap-4">

        {/* ✅ SELECTOR DE INCUBADORA */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Seleccionar Incubadora
          </label>
          <select
            value={incubadoraId}
            onChange={(e) => setIncubadoraId(e.target.value)}
            className="block w-full border-gray-300 rounded-md shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm p-2 border bg-gray-50"
          >
            <option value="INC.12 LAB.BAM.PM">INC.12 LAB.BAM.PM</option>
            <option value="INC.07_06.LAB.CCE.PM">INC.07_06.LAB.CCE.PM</option>
            <option value="INC.04.LAB.CCE.PM">INC.04.LAB.CCE.PM</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Revisar que el archivo Excel tenga las columnas esperadas (Fecha, Intervalo, Temps, Tiempos, Obs).
          </p>
        </div>

        <label className="block">
          <span className="sr-only">Elegir archivo</span>
          <input
            type="file"
            accept=".xlsx, .xls"
            onChange={handleFile}
            disabled={loading}
            className="block w-full text-sm text-slate-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-full file:border-0
                  file:text-sm file:font-semibold
                  file:bg-sky-50 file:text-sky-700
                  hover:file:bg-sky-100 cursor-pointer"
          />
        </label>

        {/* Área de Logs (Eliminada por solicitud del usuario, usamos Toasts) */}
        {/* <div className={`p-3 rounded text-sm font-medium ${log.includes('✅') ? 'bg-green-50 text-green-700' :
          log.includes('❌') ? 'bg-red-50 text-red-700' :
            log ? 'bg-blue-50 text-blue-700' : 'hidden'
          }`}>
          {log}
        </div> */}
      </div>
    </div>
  );
};

export default IncubadoraUpload;