import React, { useState, useEffect } from 'react';
import api from "@/api/apiConfig";
import ApoyoChart from "./ApoyoChart";
import html2canvas from 'html2canvas';
import { pdf } from '@react-pdf/renderer';
import ApoyoPDFReport from './ApoyoPDFReport';
import { saveAs } from 'file-saver';
import { FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';

const ApoyoHistorial = ({ backButton }) => {
    const [equipos, setEquipos] = useState([]);
    const [selectedEquipo, setSelectedEquipo] = useState("AUT.08/LAB.APO.PM");
    
    // Inicializar fechas con el año actual sincronamente para evitar cargar todo al inicio
    const today = new Date();
    const currentYearStr = String(today.getFullYear());
    const todayStr = today.toISOString().split('T')[0];

    const [selectedYear, setSelectedYear] = useState(currentYearStr);
    const [availableYears, setAvailableYears] = useState([]);
    const [history, setHistory] = useState([]);
    const [startDate, setStartDate] = useState(`${currentYearStr}-01-01`);
    const [endDate, setEndDate] = useState(todayStr);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [expandedMonths, setExpandedMonths] = useState({});

    const handleYearChange = (year) => {
        setSelectedYear(year);
        if (year) {
            let start = `${year}-01-01`;
            let end = `${year}-12-31`;

            const today = new Date();
            const currentYearStr = String(today.getFullYear());
            const todayStr = today.toISOString().split('T')[0];

            if (year === currentYearStr) {
                end = todayStr;
            }

            setStartDate(start);
            setEndDate(end);
        } else {
            setStartDate("");
            setEndDate("");
        }
    };

    useEffect(() => {
        const fetchEquipos = async () => {
            try {
                const res = await api.get('/apoyo/list');
                const list = res.data;
                if (!list.includes("AUT.08/LAB.APO.PM") && list.length === 0) {
                     setEquipos(["AUT.08/LAB.APO.PM"]); // default
                } else {
                    setEquipos(list);
                }
            } catch (err) {
                console.error("Error cargando equipos", err);
                // Fallback default
                setEquipos(["AUT.08/LAB.APO.PM"]);
            }
        };
        fetchEquipos();
    }, []);

    useEffect(() => {
        const fetchMetadata = async () => {
            if (!selectedEquipo) return;
            try {
                const encodedId = encodeURIComponent(selectedEquipo);
                const resYears = await api.get(`/apoyo/years/${encodedId}`);
                const fetchedYears = resYears.data || [];
                const currentYearStr = "2026";
                if (!fetchedYears.includes(currentYearStr) && !fetchedYears.includes(Number(currentYearStr))) {
                    fetchedYears.push(currentYearStr);
                }
                fetchedYears.sort((a, b) => b - a);
                setAvailableYears(fetchedYears);

                const today = new Date();
                const currentYear = String(today.getFullYear()); 
                const todayStr = today.toISOString().split('T')[0];

                setSelectedYear(currentYear);
                setStartDate(`${currentYear}-01-01`);
                setEndDate(todayStr);

            } catch (err) {
                console.error("Error cargando metadatos", err);
            }
        };
        fetchMetadata();
    }, [selectedEquipo]);

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

    const fetchHistory = async () => {
        if (!selectedEquipo) return;
        setLoading(true);
        setError(null);
        try {
            const encodedId = encodeURIComponent(selectedEquipo);
            let url = `/apoyo/history/${encodedId}`;
            const params = [];
            if (startDate) params.push(`startDate=${startDate}`);
            if (endDate) params.push(`endDate=${endDate}`);
            if (params.length > 0) {
                url += `?${params.join('&')}`;
            }

            const res = await api.get(url);
            setHistory(res.data);
            
            // Expand latest month by default if any
            if (res.data && res.data.length > 0) {
                const latest = res.data[0].fecha.substring(0, 7);
                setExpandedMonths({ [latest]: true });
            } else {
                setExpandedMonths({});
            }
        } catch (err) {
            console.error("Error cargando historial", err);
            setError("Error al cargar el historial.");
        } finally {
            setLoading(false);
        }
    };


    useEffect(() => {
        fetchHistory();
    }, [selectedEquipo, startDate, endDate]);


    const [isExporting, setIsExporting] = useState(false);

    const toggleMonth = (monthKey) => {
        setExpandedMonths(prev => ({
            ...prev,
            [monthKey]: !prev[monthKey]
        }));
    };

    const getMonthKey = (fechaStr) => {
        if (!fechaStr) return "Desconocido";
        return fechaStr.substring(0, 7); 
    };

    const groupedHistory = history.reduce((acc, row) => {
        const mKey = getMonthKey(row.fecha);
        if (!acc[mKey]) acc[mKey] = [];
        acc[mKey].push(row);
        return acc;
    }, {});
    
    // Sort array in descending order based on string locale comparison
    const sortedMonthKeys = Object.keys(groupedHistory).sort((a,b) => b.localeCompare(a));

    const exportToPDF = async () => {
        if (!history || history.length === 0) {
            alert("No hay datos para exportar.");
            return;
        }

        setIsExporting(true);
        try {
            let chartImageBase64 = null;
            const chartElement = document.getElementById('chart-container-for-pdf');

            if (chartElement) {
                const canvas = await html2canvas(chartElement, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
                chartImageBase64 = canvas.toDataURL('image/png');
            }

            const doc = <ApoyoPDFReport
                data={history}
                chartImageBase64={chartImageBase64}
                equipoName={selectedEquipo}
                startDate={startDate}
                endDate={endDate}
            />;

            const asPdf = pdf([]);
            asPdf.updateContainer(doc);
            const blob = await asPdf.toBlob();

            const dateStr = new Date().toISOString().split('T')[0];
            const sanitizeName = selectedEquipo.replace(/[^a-zA-Z0-9_\-]/g, '_');
            const fileName = `Reporte_${sanitizeName}_${dateStr}.pdf`;
            saveAs(blob, fileName);

        } catch (error) {
            console.error('Error al exportar el PDF:', error);
            alert("Hubo un error al generar el PDF.");
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-md w-full">
            {backButton && <div className="mb-2">{backButton}</div>}
            <h3 className="text-lg font-bold mb-4 text-teal-900 border-b pb-2">
                Historial de Unidad de Apoyo
            </h3>

            <div className="mb-8 p-1">
                <div className="flex flex-wrap items-end gap-x-6 gap-y-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                    {/* Equipo */}
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-1.5">
                            Equipo
                        </label>
                        <div className="relative">
                            <select
                                value={selectedEquipo}
                                onChange={(e) => setSelectedEquipo(e.target.value)}
                                className="w-full appearance-none bg-gray-50 hover:bg-gray-100 border border-transparent rounded-xl px-4 py-2.5 pr-8 text-sm font-semibold text-gray-700 focus:ring-2 focus:ring-teal-500/20 focus:bg-white focus:border-teal-200 transition-all outline-none cursor-pointer"
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

                    {/* Año */}
                    <div className="w-32">
                        <label className="block text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-1.5">
                            Año
                        </label>
                        <div className="relative">
                            <select
                                value={selectedYear}
                                onChange={(e) => handleYearChange(e.target.value)}
                                className="w-full appearance-none bg-gray-50 hover:bg-gray-100 border border-transparent rounded-xl px-4 py-2.5 pr-8 text-sm font-medium text-gray-700 focus:ring-2 focus:ring-teal-500/20 focus:bg-white focus:border-teal-200 transition-all outline-none cursor-pointer"
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

                    {/* Filtros Fechas idénticos... */}
                    <div className="flex items-center gap-2">
                        <div className="w-36">
                            <label className="block text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-1.5">Inicio</label>
                            <input
                                type="date" value={startDate}
                                onChange={(e) => { setStartDate(e.target.value); setSelectedYear(""); }}
                                className="w-full bg-gray-50 hover:bg-gray-100 border border-transparent rounded-xl px-3 py-2.5 text-sm text-gray-700 font-medium focus:ring-2 focus:ring-teal-500/20 focus:bg-white focus:border-teal-200 transition-all outline-none"
                            />
                        </div>
                        <span className="text-gray-300 mb-3">–</span>
                        <div className="w-36">
                            <label className="block text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-1.5">Fin</label>
                            <input
                                type="date" value={endDate}
                                onChange={(e) => { setEndDate(e.target.value); setSelectedYear(""); }}
                                className="w-full bg-gray-50 hover:bg-gray-100 border border-transparent rounded-xl px-3 py-2.5 text-sm text-gray-700 font-medium focus:ring-2 focus:ring-teal-500/20 focus:bg-white focus:border-teal-200 transition-all outline-none"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-3 ml-auto pb-0.5">
                        <button
                            onClick={() => fetchHistory()}
                            className="bg-gray-900 hover:bg-black text-white rounded-xl px-6 py-2.5 text-sm font-semibold shadow-md hover:shadow-lg transform active:scale-95 transition-all"
                        >
                            Aplicar Filtros
                        </button>
                    </div>
                </div>
            </div>

            {loading && <p className="text-teal-500 text-sm">Cargando datos...</p>}
            {error && <p className="text-red-500 text-sm">{error}</p>}

            <div className="bg-white p-2 sm:p-4 rounded-lg">
                
                {!loading && history.length > 0 && (
                    <div className="flex justify-end mb-4 border-b border-gray-100 pb-2">
                        <button
                            onClick={exportToPDF}
                            disabled={isExporting}
                            className={`flex items-center gap-2 ${isExporting ? 'bg-gray-400' : 'bg-red-600 hover:bg-red-700'} text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors shadow-sm`}
                            title="Exportar Reporte Completo a PDF con Logo"
                        >
                            {isExporting ? (
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            ) : (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                            )}
                            {isExporting ? 'Generando PDF...' : 'Exportar PDF'}
                        </button>
                    </div>
                )}

                {!loading && history.length === 0 && (
                    <p className="text-gray-500 text-sm">No hay datos para mostrar.</p>
                )}

                {!loading && history.length > 0 && (
                    <>


                        {/* CHART Component */}
                        <div id="chart-container-for-pdf" className="mb-8">
                            <ApoyoChart data={history} />
                        </div>

                        {/* TABLA */}
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 text-sm text-left text-gray-500">
                                <thead className="bg-gray-50 text-xs text-gray-700 uppercase">
                                    <tr>
                                        <th scope="col" className="px-4 py-3">Fecha</th>
                                        <th scope="col" className="px-4 py-3">Hora</th>
                                        <th scope="col" className="px-4 py-3 text-right">Temperatura (°C)</th>
                                        <th scope="col" className="px-4 py-3">S/N</th>
                                    </tr>
                                </thead>
                                {sortedMonthKeys.map(mKey => {
                                    const isExpanded = !!expandedMonths[mKey];
                                    const rows = groupedHistory[mKey];
                                    return (
                                        <tbody key={mKey} className="divide-y divide-gray-200">
                                            <tr className="bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer" onClick={() => toggleMonth(mKey)}>
                                                <td colSpan="4" className="px-4 py-3 font-bold text-slate-700">
                                                    <div className="flex items-center justify-between">
                                                        <span>Mes: {mKey} <span className="font-normal text-slate-500 ml-2">({rows.length} registros)</span></span>
                                                        <span>
                                                            {isExpanded ? (
                                                                <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7"></path></svg>
                                                            ) : (
                                                                <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                                            )}
                                                        </span>
                                                    </div>
                                                </td>
                                            </tr>
                                            {isExpanded && rows.map((row) => (
                                                <tr key={row.id_registro} className="hover:bg-gray-50 text-xs text-gray-500">
                                                    <td className="px-4 py-2 font-medium text-gray-900 whitespace-nowrap">
                                                        {row.fecha}
                                                    </td>
                                                    <td className="px-4 py-2">{formatTime(row.hora)}</td>
                                                    <td className="px-4 py-2 text-right font-medium text-teal-600">{row.temperatura}</td>
                                                    <td className="px-4 py-2 font-mono text-gray-400">{row.serial_number}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    );
                                })}
                            </table>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default ApoyoHistorial;
