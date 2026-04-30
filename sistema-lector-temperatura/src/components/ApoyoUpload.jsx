import React, { useState } from 'react';
import api from "@/api/apiConfig";
import { toast } from 'react-toastify';

const ApoyoUpload = ({ backButton }) => {
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);
  // Único equipo de Apoyo
  const equipoId = "AUT.08/LAB.APO.PM";

  const readFileAsText = (file) => {
      return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target.result);
          reader.onerror = (err) => reject(err);
          reader.readAsText(file);
      });
  };

  const handleFiles = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setLoading(true);
    let currentLogs = [`Iniciando procesamiento de ${files.length} archivo(s)...`];
    setLogs(currentLogs);

    let archivosConExito = 0;

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        currentLogs = [...currentLogs, `\n📄 Procesando: ${file.name}...`];
        setLogs(currentLogs);

        try {
            const text = await readFileAsText(file);
            const data = await parseCSVData(text, file.name);

            if (data && data.length > 0) {
                const resMsg = await uploadData(data, file.name);
                currentLogs = [...currentLogs, `↳ ${resMsg}`];
                if (resMsg.includes("✅") || resMsg.includes("⚠️ Carga Parcial") || resMsg.includes("Sin cambios")) {
                    archivosConExito++;
                }
            } else {
                currentLogs = [...currentLogs, `↳ ⚠️ Archivo vacío o sin formato válido.`];
            }
        } catch (err) {
            console.error(err);
            currentLogs = [...currentLogs, `↳ ❌ Error fatal al procesar.`];
        }
        
        setLogs(currentLogs);
    }

    currentLogs = [...currentLogs, `\n✅ Proceso finalizado. (${archivosConExito}/${files.length} completados)`];
    setLogs(currentLogs);
    
    if (archivosConExito > 0) {
        toast.success(`Se procesaron ${archivosConExito} archivos correctamente.`);
    }

    setLoading(false);
    e.target.value = null; // Reset del input file
  };

  const parseCSVData = async (text, fileName) => {
    const lines = text.split(/\r?\n/);
    if (lines.length === 0) return [];

    const parsed = [];
    let startParsing = false;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        // Headers esperados: 2, Time, Celsius(°C), Serial Number
        if (line.includes('Time') && line.includes('Celsius')) {
             startParsing = true;
             continue;
        }

        if (startParsing) {
             const parts = line.split(',');
             if (parts.length >= 3) {
                let timeStr = "";
                let celsiusStr = "";
                let serialStr = "";

                // Heurística para buscar columna de hora
                let timeIndex = -1;
                for (let j=0; j<parts.length; j++) {
                     if (parts[j].includes('-') || parts[j].includes('/') || parts[j].includes(':')) {
                         timeIndex = j;
                         break;
                     }
                }

                if (timeIndex !== -1) {
                    timeStr = parts[timeIndex].trim();
                    if (timeIndex + 1 < parts.length) celsiusStr = parts[timeIndex + 1].trim();
                    if (timeIndex + 2 < parts.length) serialStr = parts[timeIndex + 2].trim();
                } else {
                    timeStr = parts[1] || "";
                    celsiusStr = parts[2] || "";
                    serialStr = parts[3] || "";
                }

                timeStr = timeStr.replace(/"/g, '');
                const timeParts = timeStr.split(' ');
                let fechaPart = timeParts[0] || "";
                let horaPart = timeParts[1] || "";

                if (fechaPart && celsiusStr) {
                    const tempFloat = parseFloat(celsiusStr.replace(/"/g, ''));
                    if (!isNaN(tempFloat)) {
                        parsed.push({
                            fecha: fechaPart,
                            hora: horaPart,
                            temperatura: tempFloat,
                            serial_number: serialStr.replace(/"/g, '') || fileName
                        });
                    }
                }
             }
        }
    }
    return parsed;
  };

  const uploadData = async (data, fileName) => {
    try {
      const res = await api.post('/apoyo/consolidar', {
        data,
        nombreArchivo: fileName,
        equipoId: equipoId
      });

      const { nuevosInsertados, omitidosDuplicados } = res.data;

      if (nuevosInsertados > 0 && omitidosDuplicados === 0) {
        return `✅ ${nuevosInsertados} nuevos registros.`;
      } else if (nuevosInsertados > 0 && omitidosDuplicados > 0) {
        return `⚠️ Carga Parcial: ${nuevosInsertados} guardados (${omitidosDuplicados} repetidos).`;
      } else if (nuevosInsertados === 0 && omitidosDuplicados > 0) {
        return `Sin cambios: Todos (${omitidosDuplicados}) ya existían.`;
      } else {
        return "⚠️ Sin datos para insertar.";
      }
    } catch (error) {
      console.error(error);
      const errMsg = error.response?.data?.message || "Error de servidor.";
      return `❌ ${errMsg}`;
    }
  };

  return (
    <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-md max-w-2xl w-full">
      {backButton && <div className="mb-2">{backButton}</div>}
      <h3 className="text-lg font-bold mb-4 text-teal-900 border-b pb-2">
        Subir Lote de Archivos (Unidad de Apoyo)
      </h3>

      <div className="flex flex-col gap-4">

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Equipo
          </label>
          <input
            type="text"
            value={equipoId}
            disabled
            className="block w-full border-gray-300 rounded-md shadow-sm sm:text-sm p-2 border bg-gray-100 text-gray-500 font-bold"
          />
          <p className="text-xs text-gray-500 mt-1">
            Puedes seleccionar uno o múltiples archivos (.txt, .csv) mantienendo presionada la tecla Ctrl o arrastrándolos.
          </p>
        </div>

        <label className="block">
          <span className="sr-only">Elegir archivos</span>
          <input
            type="file"
            accept=".txt, .csv"
            multiple
            onChange={handleFiles}
            disabled={loading}
            className="block w-full text-sm text-slate-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-full file:border-0
                  file:text-sm file:font-semibold
                  file:bg-teal-50 file:text-teal-700
                  hover:file:bg-teal-100 cursor-pointer"
          />
        </label>
      </div>

      {logs.length > 0 && (
        <div className="mt-6 bg-slate-900 text-green-400 p-4 rounded-md text-xs font-mono whitespace-pre-wrap overflow-y-auto max-h-64 shadow-inner">
          {logs.join('\n')}
        </div>
      )}
    </div>
  );
};

export default ApoyoUpload;
