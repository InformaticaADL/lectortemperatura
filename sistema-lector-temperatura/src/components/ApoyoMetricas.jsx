import React, { useState, useEffect } from 'react';
import api from "@/api/apiConfig";
import { FaChartBar, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

const ApoyoMetricas = ({ backButton }) => {
    const [equipos, setEquipos] = useState([]);
    const [selectedEquipo, setSelectedEquipo] = useState("");
    const [availableMonths, setAvailableMonths] = useState([]);
    const [selectedMonth, setSelectedMonth] = useState("");
    const [metrics, setMetrics] = useState(null);
    const [loadingMetrics, setLoadingMetrics] = useState(false);
    const [showCycles, setShowCycles] = useState(false);
    const [viewMode, setViewMode] = useState("month"); // 'month' o 'maintenance'
    const [selectedMaintenancePeriod, setSelectedMaintenancePeriod] = useState("0");

    const periodosMantencion = [
        // Index 0: Desde Abril 2025 hasta un año después (o hasta el último registro)
        { 
            id: '0',
            label: 'Ciclo 2025 - Actualidad (Desde 09 Abr 2025)', 
            startDate: '2025-04-09', 
            endDate: '2026-04-09',
            displayStartDate: '09 Abr 2025',
            displayEndDate: 'Actualidad'
        },
        // Index 1: Desde Feb 2024 hasta el día anterior a la calibración de 2025
        { 
            id: '1',
            label: 'Ciclo 2024 - 2025 (08 Feb 2024 al 08 Abr 2025)', 
            startDate: '2024-02-08', 
            endDate: '2025-04-08',
            displayStartDate: '08 Feb 2024',
            displayEndDate: '08 Abr 2025'
        },
        // Index 2: Desde Ene 2023 hasta el día anterior a la calibración de 2024
        { 
            id: '2',
            label: 'Ciclo 2023 - 2024 (26 Ene 2023 al 07 Feb 2024)', 
            startDate: '2023-01-26', 
            endDate: '2024-02-07',
            displayStartDate: '26 Ene 2023',
            displayEndDate: '07 Feb 2024'
        },
        // Index 3: Desde Nov 2022 hasta el día anterior a la calibración de 2023
        { 
            id: '3',
            label: 'Ciclo 2022 - 2023 (18 Nov 2022 al 25 Ene 2023)', 
            startDate: '2022-11-18', 
            endDate: '2023-01-25',
            displayStartDate: '18 Nov 2022',
            displayEndDate: '25 Ene 2023'
        }
    ];

    // Cargar equipos
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

    // Cargar fechas disponibles para calcular meses
    useEffect(() => {
        const fetchDates = async () => {
            if (!selectedEquipo) return;
            try {
                const encodedId = encodeURIComponent(selectedEquipo);
                const res = await api.get(`/apoyo/dates/${encodedId}`);
                const fechas = res.data || [];
                const months = [...new Set(fechas.map(f => f.substring(0, 7)))].sort((a, b) => b.localeCompare(a));
                setAvailableMonths(months);
                // Auto-seleccionar el mes más reciente
                if (months.length > 0) {
                    setSelectedMonth(months[0]);
                } else {
                    setSelectedMonth("");
                }
                setMetrics(null);
                setShowCycles(false);
            } catch (err) {
                console.error("Error cargando fechas", err);
            }
        };
        fetchDates();
    }, [selectedEquipo]);

    // Cargar métricas cuando cambia el contexto
    useEffect(() => {
        const fetchMetrics = async () => {
            if (!selectedEquipo) {
                setMetrics(null);
                return;
            }
            if (viewMode === 'month' && !selectedMonth) {
                setMetrics(null);
                return;
            }
            if (viewMode === 'maintenance' && !selectedMaintenancePeriod) {
                setMetrics(null);
                return;
            }

            setLoadingMetrics(true);
            setShowCycles(false);
            try {
                const encodedId = encodeURIComponent(selectedEquipo);
                let url = '';
                
                if (viewMode === 'month') {
                    url = `/apoyo/metrics/${encodedId}?month=${selectedMonth}`;
                } else {
                    const period = periodosMantencion.find(p => p.id === selectedMaintenancePeriod);
                    if (period) {
                        url = `/apoyo/metrics/${encodedId}?startDate=${period.startDate}&endDate=${period.endDate}`;
                    }
                }

                if (url) {
                    const res = await api.get(url);
                    setMetrics(res.data);
                }
            } catch (err) {
                console.error("Error cargando métricas", err);
                setMetrics(null);
            } finally {
                setLoadingMetrics(false);
            }
        };
        fetchMetrics();
    }, [selectedEquipo, selectedMonth, selectedMaintenancePeriod, viewMode]);

    const getMonthName = (monthStr) => {
        if (!monthStr) return "";
        const [year, month] = monthStr.split('-');
        const names = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        return `${names[parseInt(month) - 1]} ${year}`;
    };

    const getBarColor = () => {
        if (!metrics || metrics.totalCiclos === 0) return 'linear-gradient(90deg, #d1d5db, #9ca3af)';
        const pct = (metrics.validos / metrics.totalCiclos) * 100;
        if (pct === 100) return 'linear-gradient(90deg, #10b981, #059669)';
        if (pct >= 80) return 'linear-gradient(90deg, #10b981, #34d399)';
        if (pct >= 50) return 'linear-gradient(90deg, #f59e0b, #d97706)';
        if (pct > 0) return 'linear-gradient(90deg, #f97316, #ea580c)';
        return 'linear-gradient(90deg, #ef4444, #dc2626)';
    };

    return (
        <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-md w-full max-w-7xl xl:max-w-[95%] mx-auto">
            {backButton && <div className="mb-2">{backButton}</div>}
            <h3 className="text-lg font-bold mb-5 text-teal-900 border-b pb-2 flex items-center gap-2">
                <FaChartBar className="text-teal-600" /> Métricas de Ciclos Mensuales
            </h3>

            {/* Selectores */}
            <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-100 shadow-sm space-y-4">
                {/* View Mode Toggle */}
                <div className="flex bg-gray-200/50 p-1 rounded-lg w-fit">
                    <button
                        onClick={() => setViewMode("month")}
                        className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${viewMode === "month" ? "bg-white text-teal-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                    >
                        Ver por Mes
                    </button>
                    <button
                        onClick={() => setViewMode("maintenance")}
                        className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${viewMode === "maintenance" ? "bg-white text-teal-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                    >
                        Ver por Mantención Anual
                    </button>
                </div>

                <div className="flex flex-col sm:flex-row items-end gap-4">
                    <div className="flex-1 min-w-[200px] w-full">
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
                    <div className="flex-1 min-w-[180px] w-full">
                        <label className="block text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-1.5">
                            {viewMode === 'month' ? "Mes" : "Periodo de Calibración"}
                        </label>
                        <div className="relative">
                            {viewMode === 'month' ? (
                                <select
                                    value={selectedMonth}
                                    onChange={(e) => setSelectedMonth(e.target.value)}
                                    className="w-full appearance-none bg-white hover:bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 pr-8 text-sm font-semibold text-gray-700 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-200 transition-all outline-none cursor-pointer"
                                >
                                    <option value="">Seleccionar mes</option>
                                    {availableMonths.map((m) => (
                                        <option key={m} value={m}>{getMonthName(m)}</option>
                                    ))}
                                </select>
                            ) : (
                                <select
                                    value={selectedMaintenancePeriod}
                                    onChange={(e) => setSelectedMaintenancePeriod(e.target.value)}
                                    className="w-full appearance-none bg-white hover:bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 pr-8 text-sm font-semibold text-gray-700 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-200 transition-all outline-none cursor-pointer"
                                >
                                    {periodosMantencion.map((p) => (
                                        <option key={p.id} value={p.id}>{p.label}</option>
                                    ))}
                                </select>
                            )}
                            <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-gray-400">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Loading */}
            {loadingMetrics && (
                <div className="flex items-center justify-center py-16 text-teal-600 gap-2">
                    <svg className="animate-spin h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="font-semibold text-sm">Calculando métricas del mes...</span>
                </div>
            )}

            {/* Sin datos */}
            {!loadingMetrics && selectedMonth && !metrics && (
                <div className="text-center text-gray-400 py-16">
                    <FaChartBar className="text-5xl opacity-20 mx-auto mb-4" />
                    <p className="text-sm">No hay datos para este mes.</p>
                </div>
            )}

            {/* Sin selección */}
            {!loadingMetrics && ((viewMode === 'month' && !selectedMonth) || (viewMode === 'maintenance' && !selectedMaintenancePeriod)) && (
                <div className="text-center text-gray-400 py-16">
                    <FaChartBar className="text-5xl opacity-20 mx-auto mb-4" />
                    <p className="text-sm">Seleccione un {viewMode === 'month' ? 'mes' : 'periodo'} para ver las métricas.</p>
                </div>
            )}

            {/* Métricas */}
            {!loadingMetrics && metrics && (
                <div className="space-y-6">
                    {/* Título del mes o periodo */}
                    <div className="text-center">
                        <h4 className="text-lg font-bold text-gray-800">
                            {viewMode === 'month' 
                                ? getMonthName(selectedMonth) 
                                : `Periodo Exacto: ${periodosMantencion.find(p => p.id === selectedMaintenancePeriod)?.displayStartDate} a ${periodosMantencion.find(p => p.id === selectedMaintenancePeriod)?.displayEndDate}`
                            }
                        </h4>
                        <p className="text-xs text-gray-400 mt-0.5">Factor de corrección: -0.2°C | Umbral mínimo: 120.3°C real (120.5°C lectura)</p>
                        {viewMode === 'maintenance' && (
                            <p className="text-xs font-semibold text-teal-600 mt-1 bg-teal-50 inline-block px-3 py-1 rounded-full border border-teal-100">
                                Total de ciclos contabilizados durante el marco de fechas exacto de calibración técnica.
                            </p>
                        )}
                    </div>

                    {/* Cards de resumen */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-gradient-to-br from-slate-50 to-gray-50 rounded-xl border border-gray-200 p-5 flex items-center gap-4 shadow-sm">
                            <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                <FaChartBar className="text-teal-600 text-xl" />
                            </div>
                            <div>
                                <div className="text-3xl font-bold text-gray-800">{metrics.totalCiclos}</div>
                                <div className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Total Ciclos</div>
                            </div>
                        </div>
                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200 p-5 flex items-center gap-4 shadow-sm">
                            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                <FaCheckCircle className="text-green-600 text-xl" />
                            </div>
                            <div>
                                <div className="text-3xl font-bold text-green-700">{metrics.validos}</div>
                                <div className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Válidos</div>
                            </div>
                        </div>
                        <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-xl border border-red-200 p-5 flex items-center gap-4 shadow-sm">
                            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                <FaTimesCircle className="text-red-600 text-xl" />
                            </div>
                            <div>
                                <div className="text-3xl font-bold text-red-700">{metrics.invalidos}</div>
                                <div className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Inválidos</div>
                            </div>
                        </div>
                    </div>

                    {/* Barra de progreso */}
                    {metrics.totalCiclos > 0 && (
                        <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
                            <div className="flex justify-between text-xs text-gray-500 mb-2 font-medium">
                                <span>Tasa de validación</span>
                                <span className="font-bold text-gray-700 text-sm">
                                    {Math.round((metrics.validos / metrics.totalCiclos) * 100)}%
                                </span>
                            </div>
                            <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
                                <div 
                                    className="h-full rounded-full transition-all duration-1000 ease-out"
                                    style={{ 
                                        width: `${(metrics.validos / metrics.totalCiclos) * 100}%`,
                                        background: getBarColor()
                                    }}
                                />
                            </div>
                            <div className="flex justify-between text-[10px] text-gray-400 mt-1.5">
                                <span>{metrics.validos} válido{metrics.validos !== 1 ? 's' : ''}</span>
                                <span>{metrics.invalidos} inválido{metrics.invalidos !== 1 ? 's' : ''}</span>
                            </div>
                        </div>
                    )}

                    {/* Detalle por ciclo */}
                    {metrics.ciclos && metrics.ciclos.length > 0 && (
                        <div>
                            <button
                                onClick={() => setShowCycles(!showCycles)}
                                className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-teal-700 bg-gray-50 hover:bg-teal-50 border border-gray-200 hover:border-teal-200 px-4 py-2 rounded-lg transition-all"
                            >
                                <svg className={`w-4 h-4 transition-transform ${showCycles ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                {showCycles ? 'Ocultar detalle por ciclo' : `Ver detalle por ciclo (${metrics.ciclos.length})`}
                            </button>

                            {showCycles && (
                                <div className="border rounded-xl overflow-hidden mt-3 shadow-sm">
                                    <div className="max-h-80 overflow-y-auto">
                                        <table className="min-w-full divide-y divide-gray-200 text-sm text-left text-gray-600">
                                            <thead className="bg-gray-50 text-[10px] text-gray-700 uppercase sticky top-0">
                                                <tr>
                                                    <th className="px-4 py-2.5">Fecha</th>
                                                    <th className="px-4 py-2.5 text-center">Estado</th>
                                                    <th className="px-4 py-2.5 text-center">Intervalo Válido</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200 bg-white">
                                                {metrics.ciclos.map((ciclo) => (
                                                    <tr key={ciclo.fecha} className="hover:bg-gray-50">
                                                        <td className="px-4 py-2.5 font-medium text-gray-800">{ciclo.fecha}</td>
                                                        <td className="px-4 py-2.5 text-center">
                                                            {ciclo.isValid ? (
                                                                <span className="inline-flex items-center gap-1 text-green-700 bg-green-50 px-2.5 py-1 rounded-full text-xs font-semibold">
                                                                    <FaCheckCircle className="text-[10px]" /> Válido
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center gap-1 text-red-700 bg-red-50 px-2.5 py-1 rounded-full text-xs font-semibold">
                                                                    <FaTimesCircle className="text-[10px]" /> Inválido
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-2.5 text-center text-xs text-gray-500">
                                                            {ciclo.isValid ? `${ciclo.startTime} - ${ciclo.endTime}` : '—'}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ApoyoMetricas;
