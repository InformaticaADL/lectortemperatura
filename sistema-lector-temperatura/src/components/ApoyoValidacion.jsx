import React, { useState, useEffect } from 'react';
import api from "@/api/apiConfig";
import ApoyoChart from "./ApoyoChart";
import { FaCheckCircle, FaExclamationTriangle, FaCalendarAlt, FaSearch, FaLightbulb } from 'react-icons/fa';

const ApoyoValidacion = ({ backButton }) => {
    const [equipos, setEquipos] = useState([]);
    const [selectedEquipo, setSelectedEquipo] = useState("");
    const [fechas, setFechas] = useState([]);
    const [loadingFechas, setLoadingFechas] = useState(false);
    
    // Details states
    const [selectedFecha, setSelectedFecha] = useState(null);
    const [history, setHistory] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [validacionCiclo, setValidacionCiclo] = useState(null);
    const [error, setError] = useState(null);
    const [selectedMonth, setSelectedMonth] = useState(""); // Nuevo estado para filtro de mes
    const [showTable, setShowTable] = useState(false);
    const [showCriteria, setShowCriteria] = useState(false);

    useEffect(() => {
        const fetchEquipos = async () => {
            try {
                const res = await api.get('/apoyo/list');
                const list = res.data;
                setEquipos(list);
                if (list.length > 0) {
                    setSelectedEquipo(list[0]);
                }
            } catch (err) {
                console.error("Error cargando equipos", err);
            }
        };
        fetchEquipos();
    }, []);

    useEffect(() => {
        const fetchFechas = async () => {
            if (!selectedEquipo) return;
            setLoadingFechas(true);
            try {
                const encodedId = encodeURIComponent(selectedEquipo);
                const res = await api.get(`/apoyo/dates/${encodedId}`);
                setFechas(res.data || []);
                // Reset details and filters
                setSelectedFecha(null);
                setHistory([]);
                setValidacionCiclo(null);
                setSelectedMonth(""); 
            } catch (err) {
                console.error("Error cargando fechas", err);
                setError("Error al cargar las fechas.");
            } finally {
                setLoadingFechas(false);
            }
        };
        fetchFechas();
    }, [selectedEquipo]);


    // Calcular meses únicos disponibles para el filtro
    const availableMonths = [...new Set(fechas.map(f => f.substring(0, 7)))].sort((a, b) => b.localeCompare(a));

    const filteredFechas = selectedMonth 
        ? fechas.filter(f => f.startsWith(selectedMonth))
        : fechas;

    const formatTime = (timeStr) => {
        if (!timeStr) return "-";
        if (timeStr.includes("T")) {
            return timeStr.split("T")[1].substring(0, 5);
        }
        if (timeStr.length >= 5) {
            return timeStr.substring(0, 5);
        }
        return timeStr;
    };

    const fetchHistoryForDate = async (fecha) => {
        if (!selectedEquipo) return;
        setSelectedFecha(fecha);
        setLoadingHistory(true);
        setError(null);
        try {
            const encodedId = encodeURIComponent(selectedEquipo);
            let url = `/apoyo/history/${encodedId}?startDate=${fecha}&endDate=${fecha}`;
            
            const res = await api.get(url);
            const data = res.data;
            setHistory(data);
            
            if (data && data.length > 0) {
                setValidacionCiclo(validateCycle(data));
            } else {
                setValidacionCiclo(null);
            }
            
        } catch (err) {
            console.error("Error cargando historial de la fecha", err);
            setError("Error al cargar el historial del ciclo.");
        } finally {
            setLoadingHistory(false);
        }
    };

    const validateCycle = (dataList) => {
        if (!dataList || dataList.length === 0) return null;
        
        // Sort data chronologically for validation
        const sortedData = [...dataList].sort((a, b) => {
            if (a.fecha === b.fecha) {
                return (a.hora || "").localeCompare(b.hora || "");
            }
            return (a.fecha || "").localeCompare(b.fecha || "");
        });

        // --- Collect diagnostic info for failure reporting ---
        let globalMinTemp = Infinity;
        let globalMinTempTime = null;
        let longestStreakMinutes = 0;
        let longestStreakStart = null;
        let longestStreakEnd = null;
        let readingsBelow = []; // { hora, temperatura }
        const THRESHOLD = 120.5;

        // Gather overall stats
        for (const point of sortedData) {
            const temp = parseFloat(point.temperatura);
            const hora = formatTime(point.hora);
            if (temp < globalMinTemp) {
                globalMinTemp = temp;
                globalMinTempTime = hora;
            }
            if (temp < THRESHOLD) {
                readingsBelow.push({ hora, temperatura: temp });
            }
        }

        // --- Main validation: find 15-minute continuous window ---
        for (let i = 0; i < sortedData.length; i++) {
            let conditionMet = true;
            const startPoint = sortedData[i];
            const cleanStartHora = formatTime(startPoint.hora);
            const startDate = new Date(`${startPoint.fecha}T${cleanStartHora}`);
            
            // Si startDate es inválida, omitir
            if (isNaN(startDate.getTime())) continue;

            const endTime = new Date(startDate.getTime() + 15 * 60000); // 15 minutos en ms
            
            let maxTimeFound = startDate;

            for (let j = i; j < sortedData.length; j++) {
                const currentPoint = sortedData[j];
                const cleanCurrentHora = formatTime(currentPoint.hora);
                const currentDate = new Date(`${currentPoint.fecha}T${cleanCurrentHora}`);
                const temp = parseFloat(currentPoint.temperatura);
                
                if (temp < THRESHOLD) {
                    conditionMet = false;
                    // Track longest streak before this break
                    const streakMs = maxTimeFound.getTime() - startDate.getTime();
                    const streakMin = streakMs / 60000;
                    if (streakMin > longestStreakMinutes) {
                        longestStreakMinutes = streakMin;
                        longestStreakStart = cleanStartHora;
                        longestStreakEnd = formatTime(`${maxTimeFound.getHours().toString().padStart(2, '0')}:${maxTimeFound.getMinutes().toString().padStart(2, '0')}`);
                    }
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
                    endTime: formatTime(`${maxTimeFound.getHours().toString().padStart(2, '0')}:${maxTimeFound.getMinutes().toString().padStart(2, '0')}`)
                };
            }

            // Also track the streak for the last iteration if it didn't break by temp
            if (conditionMet) {
                const streakMs = maxTimeFound.getTime() - startDate.getTime();
                const streakMin = streakMs / 60000;
                if (streakMin > longestStreakMinutes) {
                    longestStreakMinutes = streakMin;
                    longestStreakStart = cleanStartHora;
                    longestStreakEnd = formatTime(`${maxTimeFound.getHours().toString().padStart(2, '0')}:${maxTimeFound.getMinutes().toString().padStart(2, '0')}`);
                }
            }
        }

        // --- Build failure details ---
        const failureReasons = [];

        if (longestStreakMinutes < 15) {
            failureReasons.push({
                type: 'insufficient_duration',
                message: `El intervalo continuo más largo sobre ${THRESHOLD}°C fue de ${longestStreakMinutes.toFixed(1)} minutos (se requieren 15).`,
                detail: longestStreakStart 
                    ? `Mejor intervalo: ${longestStreakStart} → ${longestStreakEnd} (${longestStreakMinutes.toFixed(1)} min)` 
                    : 'No se encontró ningún intervalo válido.'
            });
        }

        if (readingsBelow.length === 0 && longestStreakMinutes < 15) {
            failureReasons.push({
                type: 'insufficient_data',
                message: 'Los datos disponibles son insuficientes para cubrir un intervalo de 15 minutos continuos.',
                detail: `Total de registros: ${sortedData.length}.`
            });
        }
        
        return { 
            isValid: false, 
            failureReasons,
            stats: {
                totalReadings: sortedData.length,
                readingsAbove: sortedData.length - readingsBelow.length,
                readingsBelow: readingsBelow.length,
                minTemp: globalMinTemp === Infinity ? null : globalMinTemp,
                minTempTime: globalMinTempTime,
                longestStreakMinutes,
                longestStreakStart,
                longestStreakEnd
            }
        };
    };

    return (
        <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-md w-full max-w-7xl xl:max-w-[95%] mx-auto">
            {backButton && <div className="mb-2">{backButton}</div>}
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-3 mb-5 gap-3">
                <h3 className="text-lg font-bold text-teal-900 flex items-center gap-2">
                    <FaCheckCircle className="text-teal-600" /> Validación de Ciclos
                </h3>
                <button
                    onClick={() => setShowCriteria(!showCriteria)}
                    className="flex items-center gap-2 text-xs font-bold text-teal-800 bg-amber-50 hover:bg-amber-100 border border-amber-200/60 px-3 py-2 rounded-lg transition-all shadow-sm"
                    title="Ver criterios de validación"
                >
                    <FaLightbulb className={`text-amber-500 text-base transition-opacity ${showCriteria ? 'opacity-100' : 'opacity-80 animate-pulse'}`} /> 
                    {showCriteria ? "Ocultar Criterios" : "¿Cómo se valida un ciclo?"}
                </button>
            </div>

            {showCriteria && (
                <div className="mb-6 p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl text-sm text-gray-800 shadow-sm animate-in fade-in duration-200 slide-in-from-top-2">
                    <h5 className="font-bold flex items-center gap-2 mb-2 text-amber-900">
                        <FaLightbulb className="text-amber-500" />
                        Reglas de Validación del Sistema
                    </h5>
                    <ul className="list-disc pl-5 space-y-1.5 opacity-90 text-[13px]">
                        <li><strong>Umbral de Temperatura:</strong> La temperatura debe mantenerse en <strong>120.5°C o más</strong> en todo momento de la validación (120.3°C reales dada la corrección de -0.2°C).</li>
                        <li><strong>Duración Continua:</strong> Este umbral térmico debe sostenerse ininterrumpidamente por un bloque de <strong>al menos 15 minutos continuos</strong>.</li>
                        <li><strong>Ruptura:</strong> Si en el transcurso de esos 15 minutos hay tan solo una caída por debajo de 120.5°C, el registro se evalúa como Inválido.</li>
                    </ul>
                </div>
            )}

            <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-100 flex items-end gap-4 shadow-sm">
                <div className="flex-1 min-w-[200px]">
                    <label className="block text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-1.5">
                        Equipo de Apoyo
                    </label>
                    <div className="relative">
                        <select
                            value={selectedEquipo}
                            onChange={(e) => setSelectedEquipo(e.target.value)}
                            className="w-full appearance-none bg-white hover:bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 pr-8 text-sm font-semibold text-gray-700 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-200 transition-all outline-none cursor-pointer"
                        >
                            {equipos.map((eq) => (
                                <option key={eq} value={eq}>{eq}</option>
                            ))}
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-gray-400">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        </div>
                    </div>
                </div>
            </div>



            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

            <div className="flex flex-col lg:flex-row gap-6">
                
                {/* Lista de Fechas */}
                <div className="w-full lg:w-1/3 flex flex-col border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm h-[500px]">
                    <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 font-semibold text-gray-700">
                        <div className="flex items-center justify-between gap-2">
                            <span className="flex items-center gap-2"><FaCalendarAlt className="text-gray-400" /> Fechas de Ciclos</span>
                            <div className="relative">
                                <select
                                    value={selectedMonth}
                                    onChange={(e) => setSelectedMonth(e.target.value)}
                                    className="appearance-none bg-white border border-gray-200 rounded-lg px-3 py-1.5 pr-7 text-xs font-semibold text-gray-600 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-200 transition-all outline-none cursor-pointer"
                                >
                                    <option value="">Todos</option>
                                    {availableMonths.map((m) => (
                                        <option key={m} value={m}>{m}</option>
                                    ))}
                                </select>
                                <div className="absolute inset-y-0 right-0 flex items-center px-1.5 pointer-events-none text-gray-400">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="overflow-y-auto flex-1 p-2">
                        {loadingFechas ? (
                            <div className="p-4 text-center text-sm text-gray-500">Cargando fechas...</div>
                        ) : filteredFechas.length === 0 ? (
                            <div className="p-4 text-center text-sm text-gray-500">No hay registros para este filtro.</div>
                        ) : (
                            <ul className="space-y-1">
                                {filteredFechas.map(f => (
                                    <li key={f}>
                                        <button
                                            onClick={() => fetchHistoryForDate(f)}
                                            className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-all flex justify-between items-center ${
                                                selectedFecha === f 
                                                ? 'bg-teal-50 text-teal-800 border border-teal-200 shadow-sm' 
                                                : 'text-gray-700 hover:bg-gray-100 border border-transparent'
                                            }`}
                                        >
                                            <span>{f}</span>
                                            <FaSearch className={`transition-opacity ${selectedFecha === f ? 'opacity-100 text-teal-600' : 'opacity-0'}`} />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>

                {/* Detalles de Validación */}
                <div className="w-full lg:w-2/3 flex flex-col border border-gray-200 rounded-xl bg-white shadow-sm h-[500px] overflow-hidden">
                    <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 font-semibold text-gray-700">
                        {selectedFecha ? `Detalle del Ciclo: ${selectedFecha}` : 'Seleccione una fecha para validar'}
                    </div>

                    <div className="overflow-y-auto flex-1 p-4 relative">
                        {loadingHistory ? (
                            <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10 text-teal-600 font-semibold gap-2">
                                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Evaluando Ciclo...
                            </div>
                        ) : null}

                        {!selectedFecha && !loadingHistory && (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4">
                                <FaSearch className="text-5xl opacity-20" />
                                <p>Haga clic en una fecha de la lista para ver su validación</p>
                            </div>
                        )}

                        {selectedFecha && history.length === 0 && !loadingHistory && (
                            <div className="p-4 text-center text-gray-500">No hay datos en esta fecha.</div>
                        )}

                        {selectedFecha && history.length > 0 && !loadingHistory && (
                            <div className="space-y-6">
                                {/* Estado de la Validación */}
                                {validacionCiclo !== null && (
                                    <div className={`rounded-xl border shadow-sm overflow-hidden ${validacionCiclo.isValid ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                                        <div className="p-4 flex items-start gap-4">
                                            <div className="mt-0.5">
                                                {validacionCiclo.isValid ? (
                                                    <FaCheckCircle className="text-xl text-green-600" />
                                                ) : (
                                                    <FaExclamationTriangle className="text-xl text-red-600" />
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-bold text-base mb-1">
                                                    {validacionCiclo.isValid ? "Ciclo Correcto (Válido)" : "Ciclo Inválido (Requiere Revisión)"}
                                                </h4>
                                                {validacionCiclo.isValid ? (
                                                    <p className="text-sm opacity-90">
                                                        {`La temperatura se mantuvo sobre los 120.3°C por al menos 15 minutos continuos (Detectado entre las ${validacionCiclo.startTime} y las ${validacionCiclo.endTime}). Factor de corrección: -0.2°C aplicado.`}
                                                    </p>
                                                ) : (
                                                    <div className="space-y-3 mt-2">
                                                        {/* Razones de fallo */}
                                                        {validacionCiclo.failureReasons && validacionCiclo.failureReasons.map((reason, idx) => (
                                                            <div key={idx} className="bg-red-100/60 rounded-lg px-3 py-2 border border-red-200/50">
                                                                <p className="text-sm font-semibold flex items-center gap-1.5">
                                                                    {reason.type === 'below_threshold' && '🌡️'}
                                                                    {reason.type === 'insufficient_duration' && '⏱️'}
                                                                    {reason.type === 'insufficient_data' && '📊'}
                                                                    {reason.message}
                                                                </p>
                                                                <p className="text-xs opacity-80 mt-0.5">{reason.detail}</p>
                                                                
                                                                {/* Mostrar lecturas problemáticas */}
                                                                {reason.readings && reason.readings.length > 0 && (
                                                                    <div className="mt-2 flex flex-wrap gap-1.5">
                                                                        {reason.readings.map((r, rIdx) => (
                                                                            <span key={rIdx} className="inline-flex items-center gap-1 bg-red-200/50 text-red-900 text-xs font-mono px-2 py-0.5 rounded-md">
                                                                                {r.hora}: {r.temperatura.toFixed(1)}°C
                                                                            </span>
                                                                        ))}
                                                                        {reason.readings.length < (validacionCiclo.stats?.readingsBelow || 0) && (
                                                                            <span className="text-xs opacity-60 self-center">
                                                                                +{(validacionCiclo.stats?.readingsBelow || 0) - reason.readings.length} más
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}

                                                        {/* Stats resumen */}
                                                        {validacionCiclo.stats && (
                                                            <div className="flex flex-wrap gap-3 text-xs mt-1">
                                                                <span className="bg-white/60 border border-red-200/40 rounded-md px-2.5 py-1 font-medium">
                                                                    ✅ Sobre umbral: <strong>{validacionCiclo.stats.readingsAbove}</strong>
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Gráfico */}
                                <div>
                                    <ApoyoChart data={history} />
                                </div>
                                
                                {/* Botón Toggle para Tabla */}
                                <div className="mt-2">
                                    <button
                                        onClick={() => setShowTable(!showTable)}
                                        className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-teal-700 bg-gray-50 hover:bg-teal-50 border border-gray-200 hover:border-teal-200 px-4 py-2 rounded-lg transition-all"
                                    >
                                        <svg className={`w-4 h-4 transition-transform ${showTable ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                        {showTable ? 'Ocultar Detalle de Registros' : `Ver Detalle de Registros (${history.length})`}
                                    </button>
                                    
                                    {showTable && (
                                        <div className="border rounded-xl overflow-hidden mt-3 animate-in">
                                            <div className="max-h-52 overflow-y-auto">
                                                <table className="min-w-full divide-y divide-gray-200 text-sm text-left text-gray-500">
                                                    <thead className="bg-gray-50 text-xs text-gray-700 uppercase sticky top-0">
                                                        <tr>
                                                            <th scope="col" className="px-4 py-2">Hora</th>
                                                            <th scope="col" className="px-4 py-2 text-right">Temp (°C)</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-200 bg-white">
                                                        {history.map((row) => (
                                                            <tr key={row.id_registro} className="hover:bg-gray-50">
                                                                <td className="px-4 py-1.5 font-medium">{formatTime(row.hora)}</td>
                                                                <td className={`px-4 py-1.5 text-right font-medium ${parseFloat(row.temperatura) >= 120.5 ? 'text-green-600' : 'text-gray-600'}`}>
                                                                    {row.temperatura}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default ApoyoValidacion;
