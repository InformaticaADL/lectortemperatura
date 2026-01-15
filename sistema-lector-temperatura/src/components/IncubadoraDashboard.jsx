import React, { useMemo, useEffect } from 'react';
import {
    ResponsiveContainer,
    LineChart,
    Line,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ReferenceLine,
    Cell
} from 'recharts';

const IncubadoraDashboard = ({ data }) => {
    // 1. Preparar datos (orden ascending para gráficos de tiempo)
    const sortedData = useMemo(() => {
        return [...data].sort((a, b) => {
            const dateA = new Date(`${a.fecha}T${a.hora_intervalo || '00:00'}`);
            const dateB = new Date(`${b.fecha}T${b.hora_intervalo || '00:00'}`);
            return dateA - dateB;
        });
    }, [data]);

    // Helper para formatear hora
    const formatTimeOnly = (dateStr) => {
        if (!dateStr) return '';
        // INTENTO 1: Si es string ISO (ej: 1970-01-01T22:00:00.000Z), cortar a lo bruto
        if (typeof dateStr === 'string' && dateStr.includes('T')) {
            // Separar por T y tomar los primeros 5 caracteres de la parte de tiempo (HH:mm)
            return dateStr.split('T')[1].substring(0, 5);
        }
        // INTENTO 2: Fallback estándar
        try {
            const date = new Date(dateStr);
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
        } catch (e) {
            console.error("Error parseando hora:", dateStr);
            return '';
        }
    };

    // 2. Datos procesados para Estabilidad (Delta T)
    const stabilityData = useMemo(() => {
        return sortedData.map((item, index) => {
            const valMin1 = item.temp_minima;
            const valMax1 = item.temp_maxima;
            const valMin2 = item.temp_minima_2;
            const valMax2 = item.temp_maxima_2;

            // Calcular variaciones individuales (manejar nulls como 0)
            const delta1 = (valMax1 != null && valMin1 != null) ? parseFloat((valMax1 - valMin1).toFixed(1)) : 0;
            const delta2 = (valMax2 != null && valMin2 != null) ? parseFloat((valMax2 - valMin2).toFixed(1)) : 0;

            // Tomar la PEOR variación (la más alta) de los dos sensores
            const maxDelta = Math.max(delta1, delta2);

            return {
                ...item,
                var1: delta1,
                var2: delta2,
                maxVariation: parseFloat(maxDelta.toFixed(1)),
                deltaValues: [valMin1, valMax1]
            };
        });
    }, [sortedData]);


    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            const hora = formatTimeOnly(data.hora_intervalo); // Formatear hora

            return (
                <div className="bg-white p-3 border border-gray-200 shadow-md rounded-md text-sm">
                    <p className="font-bold text-gray-700 mb-2">
                        {data.fecha} <span className="text-gray-500 font-normal">| {hora} hs</span>
                    </p>
                    <p className="text-blue-600">Sensor 1: {data.var1} °C</p>
                    <p className="text-purple-600">Sensor 2: {data.var2} °C</p>
                    <div className="border-t mt-2 pt-2 font-bold text-gray-900 border-gray-100">
                        Max Variación: {data.maxVariation} °C
                    </div>
                </div>
            );
        }
        return null;
    };


    if (!data || data.length === 0) {
        return <div className="p-4 text-center text-gray-500">No hay datos para el Dashboard.</div>;
    }

    return (
        <div className="grid grid-cols-1 gap-8 mt-6">

            {/* GRÁFICO 3: ESTABILIDAD TÉRMICA (Variación Max - Min) */}
            <div className="bg-white p-4 rounded-lg shadow border border-gray-100">
                <h4 className="text-md font-bold text-gray-700 mb-4 border-b pb-2">
                    🌡️ Estabilidad Térmica (Variación Max - Min)
                </h4>
                <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stabilityData} barCategoryGap={1} barGap={0}>
                            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />

                            {/* 
                                TRUCO: Usamos 'id_registro' (único) en el eje X para que CADA BARRA sea individual
                                y tenga su propio Tooltip.
                                Luego formateamos el tick para que visualmente solo muestre la fecha.
                            */}
                            <XAxis
                                dataKey="id_registro"
                                tickFormatter={(val) => {
                                    // El ID es tipo: INC_DATE_TIME. Extraemos la fecha.
                                    // A veces el formato puede variar, pero intentamos extraer la fecha YYYY-MM-DD
                                    // Asumiendo formato: ALGO_YYYY-MM-DD_HH:MM
                                    const parts = val.split('_');
                                    // Buscamos la parte que parece una fecha (202X-XX-XX)
                                    const datePart = parts.find(p => p.includes('-') && p.length === 10);
                                    return datePart || val;
                                }}
                                tick={{ fontSize: 12 }}
                                minTickGap={50} // Aumentado para que no se amontonen las fechas
                            />

                            <YAxis unit="°C" domain={[0, 5]} />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />

                            <ReferenceLine y={2} stroke="red" strokeDasharray="3 3" label="Límite 2°C" />

                            <Bar dataKey="maxVariation" name="Variación (Max - Min)">
                                {stabilityData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.maxVariation > 2 ? '#ef4444' : '#10b981'} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

        </div>
    );
};

export default IncubadoraDashboard;
