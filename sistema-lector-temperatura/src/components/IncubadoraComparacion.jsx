import React, { useState, useEffect, useMemo } from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';
import api from "@/api/apiConfig";

const IncubadoraComparacion = ({ incubadoras }) => {
    const [incA, setIncA] = useState("");
    const [incB, setIncB] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [dataA, setDataA] = useState([]);
    const [dataB, setDataB] = useState([]);

    // Setear valores por defecto
    useEffect(() => {
        if (incubadoras && incubadoras.length > 1) {
            setIncA(incubadoras[0]);
            setIncB(incubadoras[1]);
        }

        // Default fechas: Último mes
        const today = new Date();
        const lastMonth = new Date();
        lastMonth.setMonth(today.getMonth() - 1);

        setEndDate(today.toISOString().split('T')[0]);
        setStartDate(lastMonth.toISOString().split('T')[0]);
    }, [incubadoras]);

    const handleCompare = async () => {
        if (!incA || !incB) {
            setError("Debe seleccionar dos incubadoras para comparar.");
            return;
        }
        if (!startDate || !endDate) {
            setError("Debe seleccionar un rango de fechas para la comparación.");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const params = `?startDate=${startDate}&endDate=${endDate}`;
            const [resA, resB] = await Promise.all([
                api.get(`/incubadora/history/${encodeURIComponent(incA)}${params}`),
                api.get(`/incubadora/history/${encodeURIComponent(incB)}${params}`)
            ]);

            // Revertir para que queden en orden cronológico ascendente (izquierda a derecha)
            setDataA(resA.data ? [...resA.data].reverse() : []);
            setDataB(resB.data ? [...resB.data].reverse() : []);
        } catch (err) {
            console.error("Error cargando datos de comparación", err);
            setError("Error al cargar los datos para la comparación.");
        } finally {
            setLoading(false);
        }
    };

    // Pre-procesar y Unir (Merge) datos
    const chartData = useMemo(() => {
        if (dataA.length === 0 && dataB.length === 0) return [];

        // Agrupar por fecha y hora (id_registro) para normalizar ambas colecciones
        const map = new Map();

        const processItem = (item, suffix) => {
            const datePart = item.fecha && item.fecha.length === 10
                ? `${item.fecha.substring(8, 10)}-${item.fecha.substring(5, 7)}`
                : item.fecha;

            let timePart = item.hora_intervalo || "";
            if (timePart.includes("T")) {
                timePart = timePart.split("T")[1].substring(0, 5);
            } else if (timePart.length >= 5) {
                timePart = timePart.substring(0, 5);
            }

            // Usamos un identificador unificado para cruzar (fecha-hora real)
            const fusionKey = `${datePart} ${timePart}`;

            if (!map.has(fusionKey)) {
                map.set(fusionKey, { label: fusionKey, rawTimestamp: new Date(`${item.fecha}T${item.hora_intervalo || '00:00'}`) });
            }

            const existing = map.get(fusionKey);

            // Calcular promedio de todos los sensores disponibles
            let sum = 0;
            let count = 0;
            [item.temp_minima, item.temp_maxima, item.temp_minima_2, item.temp_maxima_2].forEach(val => {
                if (val !== null && val !== undefined && val !== "") {
                    sum += parseFloat(val);
                    count++;
                }
            });

            existing[`temp_avg_${suffix}`] = count > 0 ? parseFloat((sum / count).toFixed(2)) : null;
            map.set(fusionKey, existing);
        };

        dataA.forEach(item => processItem(item, 'A'));
        dataB.forEach(item => processItem(item, 'B'));

        // Convertir a array y reordenar para asegurar la cronología ascendente (por si las fechas se desfasaron)
        return Array.from(map.values()).sort((a, b) => a.rawTimestamp - b.rawTimestamp);

    }, [dataA, dataB]);


    return (
        <div className="w-full bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <div className="mb-4">
                <h4 className="text-md font-semibold text-gray-700">Comparativa Global de Incubadoras</h4>
                <p className="text-xs text-gray-500 mt-1">Promedio térmico de todos los sensores por incubadora para un mismo periodo.</p>
            </div>

            {/* Controles de Comparación */}
            <div className="flex flex-wrap items-end gap-4 p-4 mb-6 bg-gray-50 rounded-xl border border-gray-200">

                <div className="flex-1 min-w-[150px]">
                    <label className="block text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-1.5">Incubadora Azul</label>
                    <select
                        value={incA}
                        onChange={(e) => setIncA(e.target.value)}
                        className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-sky-700 font-bold focus:ring-2 focus:ring-sky-500"
                    >
                        <option value="">-- Seleccionar --</option>
                        {incubadoras.map(inc => <option key={`A-${inc}`} value={inc}>{inc}</option>)}
                    </select>
                </div>

                <div className="flex items-center text-gray-400 font-bold px-2 pb-2">VS</div>

                <div className="flex-1 min-w-[150px]">
                    <label className="block text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-1.5">Incubadora Naranja</label>
                    <select
                        value={incB}
                        onChange={(e) => setIncB(e.target.value)}
                        className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-orange-600 font-bold focus:ring-2 focus:ring-orange-500"
                    >
                        <option value="">-- Seleccionar --</option>
                        {incubadoras.map(inc => <option key={`B-${inc}`} value={inc}>{inc}</option>)}
                    </select>
                </div>

                <div className="w-32">
                    <label className="block text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-1.5">Inicio Rango</label>
                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full bg-white border border-gray-300 rounded-lg px-2 py-2 text-sm" />
                </div>

                <div className="w-32">
                    <label className="block text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-1.5">Fin Rango</label>
                    <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full bg-white border border-gray-300 rounded-lg px-2 py-2 text-sm" />
                </div>

                <div className="ml-auto">
                    <button
                        onClick={handleCompare}
                        disabled={loading}
                        className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-6 py-2 text-sm font-semibold shadow-md transition-colors disabled:opacity-50"
                    >
                        {loading ? 'Cargando...' : 'Comparar'}
                    </button>
                </div>
            </div>

            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

            {(dataA.length > 0 || dataB.length > 0) && chartData.length > 0 ? (
                <div className="h-[450px] w-full mt-4">
                    <ResponsiveContainer width="100%" height="85%">
                        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis
                                dataKey="label"
                                tick={{ fontSize: 11, fill: '#6b7280' }}
                                interval="preserveStartEnd"
                                minTickGap={50}
                            />
                            <YAxis
                                domain={['auto', 'auto']}
                                tick={{ fontSize: 11, fill: '#6b7280' }}
                            />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                itemStyle={{ fontWeight: 'bold' }}
                            />
                            <Legend wrapperStyle={{ paddingTop: '20px' }} />

                            <Line
                                type="monotone"
                                dataKey="temp_avg_A"
                                name={`Prom. ${incA || 'Inc. A'}`}
                                stroke="#0284c7" // light-blue
                                strokeWidth={2.5}
                                dot={false}
                                activeDot={{ r: 6 }}
                                connectNulls
                            />
                            <Line
                                type="monotone"
                                dataKey="temp_avg_B"
                                name={`Prom. ${incB || 'Inc. B'}`}
                                stroke="#f97316" // orange
                                strokeWidth={2.5}
                                dot={false}
                                activeDot={{ r: 6 }}
                                connectNulls
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            ) : (
                !loading && <div className="text-center text-gray-400 py-20 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50">Seleccione parámetros y presione Comparar</div>
            )}
        </div>
    );
};

export default IncubadoraComparacion;
