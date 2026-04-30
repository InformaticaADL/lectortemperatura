import React, { useMemo, useState, useEffect } from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    ReferenceArea
} from 'recharts';
import { FaUndo } from 'react-icons/fa';

const ApoyoChart = ({ data }) => {
    const [zoomedData, setZoomedData] = useState(null);
    const [refAreaLeft, setRefAreaLeft] = useState('');
    const [refAreaRight, setRefAreaRight] = useState('');

    // Pre-procesar datos para el gráfico
    const chartData = useMemo(() => {
        if (!data || data.length === 0) return [];
        
        const sortedData = [...data].sort((a, b) => {
            if (a.fecha === b.fecha) {
                return (a.hora || "").localeCompare(b.hora || "");
            }
            return (a.fecha || "").localeCompare(b.fecha || "");
        });

        return sortedData.map(item => {
            const datePart = item.fecha && item.fecha.length === 10
                ? `${item.fecha.substring(8, 10)}/${item.fecha.substring(5, 7)}/${item.fecha.substring(0, 4)}`
                : item.fecha;

            let timePart = item.hora || "";
            if (timePart.includes("T")) {
                timePart = timePart.split("T")[1].substring(0, 5);
            } else if (timePart.length >= 5) {
                timePart = timePart.substring(0, 5);
            }

            const label = `${datePart} ${timePart}`;

            return {
                ...item,
                label,
                temperatura: parseFloat(item.temperatura)
            };
        });
    }, [data]);

    // Resetea el zoom si cambia el conjunto de datos padre (ej: cambian de fechas)
    useEffect(() => {
        setZoomedData(null);
        setRefAreaLeft('');
        setRefAreaRight('');
    }, [chartData]);

    const displayData = zoomedData || chartData;

    if (!data || data.length === 0) {
        return <div className="text-center text-gray-500 py-10">No hay datos para graficar.</div>;
    }

    const zoom = () => {
        if (!refAreaLeft || !refAreaRight || refAreaLeft === refAreaRight) {
            setRefAreaLeft('');
            setRefAreaRight('');
            return;
        }

        const leftIndex = chartData.findIndex(d => d.label === refAreaLeft);
        const rightIndex = chartData.findIndex(d => d.label === refAreaRight);

        if (leftIndex === -1 || rightIndex === -1) {
            setRefAreaLeft('');
            setRefAreaRight('');
            return;
        }

        const minIndex = Math.min(leftIndex, rightIndex);
        const maxIndex = Math.max(leftIndex, rightIndex);

        setZoomedData(chartData.slice(minIndex, maxIndex + 1));
        setRefAreaLeft('');
        setRefAreaRight('');
    };

    const zoomOut = () => {
        setZoomedData(null);
        setRefAreaLeft('');
        setRefAreaRight('');
    };

    return (
        <div className="w-full h-auto bg-white p-4 rounded-lg shadow-sm border border-gray-100 mb-10 relative">
            <div className="mb-4 flex flex-wrap justify-between items-start gap-4">
                <div>
                    <h4 className="text-md font-semibold text-gray-700">Tendencia de Temperatura</h4>
                    <p className="text-xs text-gray-500 mt-1">
                        Dibuja un recuadro (clic sostenido y arrastra) sobre el gráfico para ampliar una zona específica.
                    </p>
                </div>
                {zoomedData && (
                    <button
                        onClick={zoomOut}
                        className="flex items-center gap-2 text-sm bg-teal-50 text-teal-700 hover:bg-teal-100 px-3 py-1.5 rounded-md transition-colors"
                    >
                        <FaUndo className="text-xs"/> Restablecer Zoom
                    </button>
                )}
            </div>

            <div className="h-80 w-full select-none cursor-crosshair">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                        data={displayData}
                        margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                        onMouseDown={(e) => {
                            if (e && e.activeLabel) setRefAreaLeft(e.activeLabel);
                        }}
                        onMouseMove={(e) => {
                            if (refAreaLeft && e && e.activeLabel) {
                                setRefAreaRight(e.activeLabel);
                            }
                        }}
                        onMouseUp={zoom}
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

                        <Line 
                            type="monotone" 
                            dataKey="temperatura" 
                            name="Temp. (°C)" 
                            stroke="#0d9488" 
                            strokeWidth={2} 
                            dot={false} 
                            activeDot={{ r: 5 }} 
                            isAnimationActive={!zoomedData} // Evitar animación al hacer zoom para no generar un efecto raro
                        />

                        {refAreaLeft && refAreaRight && (
                            <ReferenceArea 
                                x1={refAreaLeft} 
                                x2={refAreaRight} 
                                strokeOpacity={0.3} 
                                fill="#0d9488" 
                                fillOpacity={0.2} 
                            />
                        )}
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default ApoyoChart;
