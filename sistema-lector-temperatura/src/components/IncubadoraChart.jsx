import React, { useMemo } from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    Brush // Importar Brush para el zoom
} from 'recharts';

const emptyTickFormatter = () => '';

const IncubadoraChart = ({ data }) => {
    // Pre-procesar datos para el gráfico
    const chartData = useMemo(() => {
        // ... (resto del código igual)
        const reversed = [...data].reverse();

        return reversed.map(item => {
            const datePart = item.fecha && item.fecha.length >= 5
                ? item.fecha.substring(5)
                : item.fecha;

            let timePart = item.hora_intervalo || "";
            if (timePart.includes("T")) {
                timePart = timePart.split("T")[1].substring(0, 5);
            } else if (timePart.length >= 5) {
                timePart = timePart.substring(0, 5);
            }

            const label = `${datePart} ${timePart}`;

            return {
                ...item,
                label,
                temp_minima: parseFloat(item.temp_minima),
                temp_maxima: parseFloat(item.temp_maxima),
                temp_minima_2: parseFloat(item.temp_minima_2),
                temp_maxima_2: parseFloat(item.temp_maxima_2),
            };
        });
    }, [data]);

    if (!data || data.length === 0) {
        return <div className="text-center text-gray-500 py-10">No hay datos para graficar.</div>;
    }

    return (
        <div className="w-full h-96 bg-white p-4 rounded-lg shadow-sm border border-gray-100 mb-10">
            <h4 className="text-md font-semibold text-gray-700 mb-4">Tendencia de Temperaturas</h4>

            <ResponsiveContainer width="100%" height="100%">
                <LineChart
                    data={chartData}
                    margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
                >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                        dataKey="label"
                        tick={{ fontSize: 10, fill: '#6b7280' }}
                        interval="preserveStartEnd"
                        minTickGap={50}
                    />
                    <YAxis
                        tick={{ fontSize: 10, fill: '#6b7280' }}
                        domain={['auto', 'auto']}
                    />
                    <Tooltip
                        contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        labelStyle={{ fontWeight: 'bold', color: '#374151' }}
                        itemStyle={{ fontSize: '12px' }}
                    />
                    <Legend wrapperStyle={{ paddingTop: '10px' }} />

                    <Line type="monotone" dataKey="temp_maxima" name="S1 Max" stroke="#2563eb" strokeWidth={2} dot={false} activeDot={{ r: 5 }} />
                    <Line type="monotone" dataKey="temp_minima" name="S1 Min" stroke="#93c5fd" strokeWidth={2} dot={false} />

                    <Line type="monotone" dataKey="temp_maxima_2" name="S2 Max" stroke="#059669" strokeWidth={2} dot={false} strokeDasharray="3 3" />
                    <Line type="monotone" dataKey="temp_minima_2" name="S2 Min" stroke="#6ee7b7" strokeWidth={2} strokeDasharray="3 3" dot={false} />

                    {/* ZOOM SLIDER (Brush) - Desactivado por causar error de re-renderizado infinito en algunos navegadores
                    <Brush
                        dataKey="label"
                        height={30}
                        stroke="#cbd5e1"
                        fill="#f8fafc"
                        tickFormatter={emptyTickFormatter}
                    />
                    */}
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};

export default IncubadoraChart;
