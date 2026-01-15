import React, { useState, useEffect } from 'react';
import api from "@/api/apiConfig";
import IncubadoraChart from "./IncubadoraChart";
import IncubadoraDashboard from "./IncubadoraDashboard";



const IncubadoraHistorial = () => {
    const [incubadoras, setIncubadoras] = useState([]);
    const [selectedIncubadora, setSelectedIncubadora] = useState("");
    const [selectedYear, setSelectedYear] = useState("2026");
    const [availableYears, setAvailableYears] = useState([]);
    const [history, setHistory] = useState([]);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [globalRange, setGlobalRange] = useState({ min: null, max: null }); // Rango absoluto de datos
    const [viewMode, setViewMode] = useState("table"); // 'table', 'dashboard'
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);


    const handleYearChange = (year) => {
        setSelectedYear(year);
        if (year) {
            let start = `${year}-01-01`;
            let end = `${year}-12-31`;

            console.log("DEBUG Year Change:", { year, start, end, globalRange });

            // CLAMP: Ajustar al rango real de datos si existe
            if (globalRange.min && start < globalRange.min) {
                console.log(`Clamping Start: ${start} -> ${globalRange.min}`);
                start = globalRange.min;
            }
            // Removed strict clamping to globalRange.max to allow viewing current/future years full range
            // if (globalRange.max && end > globalRange.max) {
            //    console.log(`Clamping End: ${end} -> ${globalRange.max}`);
            //    if (end > globalRange.max) {
            //        end = globalRange.max;
            //    }
            // }

            // Si es el año actual (2026), ajustar el fin a la fecha actual
            const today = new Date();
            const currentYearStr = String(today.getFullYear());
            const todayStr = today.toISOString().split('T')[0];

            if (year === currentYearStr) {
                end = todayStr;
            }

            // Caso borde: Si por alguna razón el año seleccionado está fuera del rango global (aunque el filtro availableYears lo previene),
            // asegurar que start <= end
            setStartDate(start);
            setEndDate(end);
        } else {
            setStartDate("");
            setEndDate("");
        }
    };

    // Cargar lista de incubadoras al montar
    useEffect(() => {
        const fetchIncubadoras = async () => {
            try {
                const res = await api.get('/incubadora/list');
                setIncubadoras(res.data);
                if (res.data.length > 0) {
                    setSelectedIncubadora(res.data[0]);
                }
            } catch (err) {
                console.error("Error cargando incubadoras", err);
                setError("Error al cargar la lista de incubadoras.");
            }
        };
        fetchIncubadoras();
    }, []);

    // Cargar AÑOS disponibles y RANGO DE FECHAS cuando cambia la incubadora
    useEffect(() => {
        const fetchMetadata = async () => {
            if (!selectedIncubadora) return;
            try {
                const encodedId = encodeURIComponent(selectedIncubadora);

                // 1. Cargar Años Disponibles y asegurar 2026
                const resYears = await api.get(`/incubadora/years/${encodedId}`);
                const fetchedYears = resYears.data || [];
                const currentYearStr = "2026";
                if (!fetchedYears.includes(currentYearStr) && !fetchedYears.includes(Number(currentYearStr))) {
                    fetchedYears.push(currentYearStr);
                }
                // Ordenar descendente
                fetchedYears.sort((a, b) => b - a);
                setAvailableYears(fetchedYears);

                // 2. Cargar Rango de Fechas (Min/Max)
                const resRange = await api.get(`/incubadora/range/${encodedId}`);
                console.log("DEBUG Metadata Range:", resRange.data);
                if (resRange.data && resRange.data.minDate && resRange.data.maxDate) {
                    // Asegurar formato YYYY-MM-DD (primeros 10 chars)
                    const minStr = String(resRange.data.minDate).substring(0, 10);
                    const maxStr = String(resRange.data.maxDate).substring(0, 10);

                    // Guardamos el rango global para usarlo en el filtro
                    setGlobalRange({ min: minStr, max: maxStr });

                    // Opcional: Si queremos setear el rango inicial COMPLETO al cargar:
                    // setStartDate(minStr);
                    // setEndDate(maxStr);
                    // setSelectedYear(""); 

                    // NOTA: El usuario pidió que al cargar se seteen las fechas,
                    // pero si luego elije año, se usa handleYearChange.
                    // Mantengamos el comportamiento de setear fecha inicial.

                    // Solo si no hay fechas ya seleccionadas (o si queremos forzar reset al cambiar incubadora)
                    // Default: Año 2026 (o actual)
                    const today = new Date();
                    const currentYear = String(today.getFullYear()); // "2026"
                    const todayStr = today.toISOString().split('T')[0];

                    setSelectedYear(currentYear);
                    setStartDate(`${currentYear}-01-01`);
                    setEndDate(todayStr);

                } else {
                    setGlobalRange({ min: null, max: null });
                    setStartDate("");
                    setEndDate("");
                }

            } catch (err) {
                console.error("Error cargando metadatos (años/rango)", err);
            }
        };
        fetchMetadata();
    }, [selectedIncubadora]);

    // Format helpers...
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

    // Cargar historial
    const fetchHistory = async () => {
        if (!selectedIncubadora) return;

        setLoading(true);
        setError(null);
        try {
            const encodedId = encodeURIComponent(selectedIncubadora);
            let url = `/incubadora/history/${encodedId}`;

            const params = [];
            if (startDate) params.push(`startDate=${startDate}`);
            if (endDate) params.push(`endDate=${endDate}`);

            if (params.length > 0) {
                url += `?${params.join('&')}`;
            }

            const res = await api.get(url);
            setHistory(res.data);
        } catch (err) {
            console.error("Error cargando historial", err);
            setError("Error al cargar el historial.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, [selectedIncubadora, startDate, endDate]);

    const handleSearch = () => {
        fetchHistory();
    };


    return (
        <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-md w-full">
            <h3 className="text-lg font-bold mb-4 text-sky-900 border-b pb-2">
                Historial de Temperaturas
            </h3>

            {/* Filtros */}
            {/* Filtros Minimalistas */}
            <div className="mb-8 p-1">
                <div className="flex flex-wrap items-end gap-x-6 gap-y-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">

                    {/* Incubadora */}
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-1.5">
                            Incubadora
                        </label>
                        <div className="relative">
                            <select
                                value={selectedIncubadora}
                                onChange={(e) => setSelectedIncubadora(e.target.value)}
                                className="w-full appearance-none bg-gray-50 hover:bg-gray-100 border border-transparent rounded-xl px-4 py-2.5 pr-8 text-sm font-semibold text-gray-700 focus:ring-2 focus:ring-sky-500/20 focus:bg-white focus:border-sky-200 transition-all outline-none cursor-pointer"
                            >
                                {incubadoras.map((inc) => (
                                    <option key={inc} value={inc}>
                                        {inc}
                                    </option>
                                ))}
                            </select>
                            <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-gray-400">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                            </div>
                        </div>
                    </div>

                    {/* Año */}
                    <div className="w-32">
                        <label className="block text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-1.5">
                            Año
                        </label>
                        <div className="relative">
                            <select
                                value={selectedYear}
                                onChange={(e) => handleYearChange(e.target.value)}
                                className="w-full appearance-none bg-gray-50 hover:bg-gray-100 border border-transparent rounded-xl px-4 py-2.5 pr-8 text-sm font-medium text-gray-700 focus:ring-2 focus:ring-sky-500/20 focus:bg-white focus:border-sky-200 transition-all outline-none cursor-pointer"
                            >
                                {availableYears.map((year) => (
                                    <option key={year} value={year}>
                                        {year}
                                    </option>
                                ))}
                            </select>
                            <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-gray-400">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                            </div>
                        </div>
                    </div>

                    {/* Fechas */}
                    <div className="flex items-center gap-2">
                        <div className="w-36">
                            <label className="block text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-1.5">
                                Inicio
                            </label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => {
                                    setStartDate(e.target.value);
                                    setSelectedYear("");
                                }}
                                className="w-full bg-gray-50 hover:bg-gray-100 border border-transparent rounded-xl px-3 py-2.5 text-sm text-gray-700 font-medium focus:ring-2 focus:ring-sky-500/20 focus:bg-white focus:border-sky-200 transition-all outline-none"
                            />
                        </div>
                        <span className="text-gray-300 mb-3">–</span>
                        <div className="w-36">
                            <label className="block text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-1.5">
                                Fin
                            </label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => {
                                    setEndDate(e.target.value);
                                    setSelectedYear("");
                                }}
                                className="w-full bg-gray-50 hover:bg-gray-100 border border-transparent rounded-xl px-3 py-2.5 text-sm text-gray-700 font-medium focus:ring-2 focus:ring-sky-500/20 focus:bg-white focus:border-sky-200 transition-all outline-none"
                            />
                        </div>
                    </div>

                    {/* Botones */}
                    <div className="flex items-center gap-3 ml-auto pb-0.5">
                        {(startDate || endDate) && (
                            <button
                                onClick={() => {
                                    setStartDate("");
                                    setEndDate("");
                                    setSelectedYear("");
                                    setTimeout(fetchHistory, 0);
                                }}
                                className="text-xs font-semibold text-gray-400 hover:text-gray-600 px-3 py-2 transition-colors uppercase tracking-wide"
                            >
                                Limpiar
                            </button>
                        )}
                        <button
                            onClick={handleSearch}
                            className="bg-gray-900 hover:bg-black text-white rounded-xl px-6 py-2.5 text-sm font-semibold shadow-md hover:shadow-lg transform active:scale-95 transition-all"
                        >
                            Aplicar Filtros
                        </button>
                    </div>
                </div>
            </div>

            {/* SELECTOR DE VISTA */}
            <div className="flex space-x-2 mb-4 border-b border-gray-200">
                <button
                    onClick={() => setViewMode("table")}
                    className={`pb-2 px-4 text-sm font-medium transition-colors ${viewMode === "table"
                        ? "text-sky-600 border-b-2 border-sky-600"
                        : "text-gray-500 hover:text-gray-700"
                        }`}
                >
                    📅 Tabla & Gráfico
                </button>
                <button
                    onClick={() => setViewMode("dashboard")}
                    className={`pb-2 px-4 text-sm font-medium transition-colors ${viewMode === "dashboard"
                        ? "text-sky-600 border-b-2 border-sky-600"
                        : "text-gray-500 hover:text-gray-700"
                        }`}
                >
                    📊 Dashboard Avanzado
                </button>
            </div>

            {/* Mensajes de Estado */}
            {loading && <p className="text-blue-500 text-sm">Cargando datos...</p>}
            {error && <p className="text-red-500 text-sm">{error}</p>}

            {/* Tabla y Gráfico */}
            {!loading && history.length === 0 && (
                <p className="text-gray-500 text-sm">No hay datos para mostrar.</p>
            )}

            {!loading && history.length > 0 && viewMode === 'table' && (
                <>
                    <IncubadoraChart data={history} />

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 text-sm text-left text-gray-500">
                            <thead className="bg-gray-50 text-xs text-gray-700 uppercase">
                                <tr>
                                    <th scope="col" className="px-4 py-3">Fecha</th>
                                    <th scope="col" className="px-4 py-3">Hora</th>
                                    <th scope="col" className="px-4 py-3 text-right">T. Min</th>
                                    <th scope="col" className="px-4 py-3 text-right">T. Max</th>
                                    <th scope="col" className="px-4 py-3 text-right">T. Min 2</th>
                                    <th scope="col" className="px-4 py-3 text-right">T. Max 2</th>
                                    <th scope="col" className="px-4 py-3 text-right">Puerta (s)</th>
                                    <th scope="col" className="px-4 py-3 text-right">Motor</th>
                                    <th scope="col" className="px-4 py-3 text-right">Red (s)</th>
                                    <th scope="col" className="px-4 py-3 text-right">Alarma (s)</th>

                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {history.map((row) => (
                                    <tr key={row.id_registro || `${row.fecha}-${row.hora_intervalo}`} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">
                                            {row.fecha}
                                        </td>
                                        <td className="px-4 py-3">{formatTime(row.hora_intervalo)}</td>
                                        <td className="px-4 py-3 text-right font-medium text-blue-400">{row.temp_minima}</td>
                                        <td className="px-4 py-3 text-right font-medium text-blue-700">{row.temp_maxima}</td>
                                        <td className="px-4 py-3 text-right font-medium text-emerald-400">{row.temp_minima_2}</td>
                                        <td className="px-4 py-3 text-right font-medium text-emerald-700">{row.temp_maxima_2}</td>
                                        <td className="px-4 py-3 text-right">{row.tiempo_puerta}</td>
                                        <td className="px-4 py-3 text-right">{row.tiempo_motor}</td>
                                        <td className="px-4 py-3 text-right">{row.tiempo_red}</td>
                                        <td className="px-4 py-3 text-right">{row.tiempo_alarma}</td>

                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            {!loading && history.length > 0 && viewMode === 'dashboard' && (
                <IncubadoraDashboard data={history} />
            )}
        </div>
    );
};

export default IncubadoraHistorial;
