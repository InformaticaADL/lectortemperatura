import React from 'react';
import {
    Document,
    Page,
    Text,
    View,
    StyleSheet,
    Image,
    Font
} from '@react-pdf/renderer';

// Registrar fuentes (opcional si se requiere Arial/Roboto)
// Font.register({ family: 'Roboto', src: 'https://fonts.gstatic.com/s/roboto/v20/KFOmCnqEu92Fr1Mu4mxK.woff2' });

const styles = StyleSheet.create({
    page: {
        padding: 30,
        backgroundColor: '#ffffff',
        fontFamily: 'Helvetica',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        borderBottom: '1pt solid #e5e7eb',
        paddingBottom: 10,
    },
    logo: {
        width: 120, // Ajusta según el logo de ADL
    },
    headerTextContainer: {
        textAlign: 'right',
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1e3a8a',
    },
    subtitle: {
        fontSize: 10,
        color: '#6b7280',
        marginTop: 4,
    },
    section: {
        marginBottom: 20,
    },
    chartImage: {
        width: '100%',
        height: 'auto',
        borderRadius: 4,
        marginBottom: 10,
    },
    table: {
        display: 'table',
        width: '100%',
        borderStyle: 'solid',
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    tableRow: {
        flexDirection: 'row',
    },
    tableHeaderRow: {
        flexDirection: 'row',
        backgroundColor: '#f9fafb',
        borderBottomWidth: 1,
        borderColor: '#e5e7eb',
    },
    tableCol1: { width: '12%', borderRightWidth: 1, borderColor: '#e5e7eb', padding: 4 },
    tableCol2: { width: '10%', borderRightWidth: 1, borderColor: '#e5e7eb', padding: 4 },
    tableCol3: { width: '8%', borderRightWidth: 1, borderColor: '#e5e7eb', padding: 4 },
    tableCol4: { width: '8%', borderRightWidth: 1, borderColor: '#e5e7eb', padding: 4 },
    tableCol5: { width: '8%', borderRightWidth: 1, borderColor: '#e5e7eb', padding: 4 },
    tableCol6: { width: '8%', borderRightWidth: 1, borderColor: '#e5e7eb', padding: 4 },
    tableColTime: { width: '11.5%', borderRightWidth: 1, borderColor: '#e5e7eb', padding: 4 },

    tableCellHeader: {
        fontSize: 8,
        fontWeight: 'bold',
        color: '#374151',
        textAlign: 'center',
    },
    tableCell: {
        fontSize: 8,
        color: '#4b5563',
        textAlign: 'center',
    },
    footerContainer: {
        position: 'absolute',
        bottom: 20,
        left: 30,
        right: 30,
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderTop: '1pt solid #e5e7eb',
        paddingTop: 8,
    },
    footerText: {
        fontSize: 8,
        color: '#9ca3af',
    }
});

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

// path al logo puede ser relativo (ej. /images/logo_adl.png) si funciona desde cliente web, 
// pero en ReactPDF web, se necesita la URL absoluta o relativa completa. 
// Para un SVG/PNG en public, usamos el path absoluto del dominio o la ruta relativa desde la carpeta public montada.
const LOGO_SRC = "/images/logo_adl.png";

const IncubadoraPDFReport = ({ data, chartImageBase64, incubadoraName, startDate, endDate }) => {
    const today = new Date().toLocaleDateString('es-CL');

    let dateRangeText = "Historial Completo";
    if (startDate && endDate) {
        dateRangeText = `Desde ${startDate} hasta ${endDate}`;
    } else if (startDate) {
        dateRangeText = `Desde ${startDate}`;
    } else if (endDate) {
        dateRangeText = `Hasta ${endDate}`;
    }

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* ENCABEZADO */}
                <View style={styles.header}>
                    {/* Logo */}
                    <Image style={styles.logo} src={LOGO_SRC} />

                    <View style={styles.headerTextContainer}>
                        <Text style={styles.title}>Reporte de Temperatura</Text>
                        <Text style={styles.subtitle}>Incubadora: {incubadoraName || "N/A"}</Text>
                        <Text style={styles.subtitle}>Período: {dateRangeText}</Text>
                        <Text style={styles.subtitle}>Generado: {today}</Text>
                    </View>
                </View>

                {/* GRÁFICO (IMAGEN) */}
                {chartImageBase64 && (
                    <View style={styles.section}>
                        <Text style={[styles.title, { fontSize: 14, marginBottom: 8 }]}>Gráfico de Tendencia</Text>
                        <Image style={styles.chartImage} src={chartImageBase64} />
                    </View>
                )}

                {/* TABLA DE DATOS */}
                <View style={[styles.section, { marginTop: 10 }]}>
                    <Text style={[styles.title, { fontSize: 14, marginBottom: 8 }]}>Registro de Temperaturas</Text>

                    <View style={styles.table}>
                        {/* Cabecera de la tabla */}
                        <View style={styles.tableHeaderRow}>
                            <View style={styles.tableCol1}><Text style={styles.tableCellHeader}>Fecha</Text></View>
                            <View style={styles.tableCol2}><Text style={styles.tableCellHeader}>Hora</Text></View>
                            <View style={styles.tableCol3}><Text style={styles.tableCellHeader}>Min 1</Text></View>
                            <View style={styles.tableCol4}><Text style={styles.tableCellHeader}>Max 1</Text></View>
                            <View style={styles.tableCol5}><Text style={styles.tableCellHeader}>Min 2</Text></View>
                            <View style={styles.tableCol6}><Text style={styles.tableCellHeader}>Max 2</Text></View>
                            <View style={styles.tableColTime}><Text style={styles.tableCellHeader}>T. Puerta</Text></View>
                            <View style={styles.tableColTime}><Text style={styles.tableCellHeader}>T. Motor</Text></View>
                            <View style={[styles.tableColTime, { borderRightWidth: 0 }]}><Text style={styles.tableCellHeader}>T. Alarma</Text></View>
                        </View>

                        {/* Filas de la tabla */}
                        {data.map((row, i) => (
                            <View key={row.id_registro || i} style={[styles.tableRow, { borderBottomWidth: i === data.length - 1 ? 0 : 1, borderColor: '#e5e7eb', backgroundColor: i % 2 === 0 ? '#ffffff' : '#f9fafb' }]}>
                                <View style={styles.tableCol1}><Text style={styles.tableCell}>{row.fecha}</Text></View>
                                <View style={styles.tableCol2}><Text style={styles.tableCell}>{formatTime(row.hora_intervalo)}</Text></View>
                                <View style={styles.tableCol3}><Text style={[styles.tableCell, { color: '#3b82f6' }]}>{row.temp_minima}</Text></View>
                                <View style={styles.tableCol4}><Text style={[styles.tableCell, { color: '#1d4ed8' }]}>{row.temp_maxima}</Text></View>
                                <View style={styles.tableCol5}><Text style={[styles.tableCell, { color: '#34d399' }]}>{row.temp_minima_2}</Text></View>
                                <View style={styles.tableCol6}><Text style={[styles.tableCell, { color: '#047857' }]}>{row.temp_maxima_2}</Text></View>
                                <View style={styles.tableColTime}><Text style={styles.tableCell}>{row.tiempo_puerta}</Text></View>
                                <View style={styles.tableColTime}><Text style={styles.tableCell}>{row.tiempo_motor}</Text></View>
                                <View style={[styles.tableColTime, { borderRightWidth: 0 }]}><Text style={styles.tableCell}>{row.tiempo_alarma}</Text></View>
                            </View>
                        ))}
                    </View>
                </View>

                {/* PIE DE PÁGINA */}
                <Text render={({ pageNumber, totalPages }) => (
                    `Página ${pageNumber} de ${totalPages}`
                )} fixed style={{ position: 'absolute', bottom: 20, right: 30, fontSize: 8, color: '#9ca3af' }} />

                <Text fixed style={{ position: 'absolute', bottom: 20, left: 30, fontSize: 8, color: '#9ca3af' }}>
                    Sistema de Lector de Temperatura ADL
                </Text>

            </Page>
        </Document>
    );
};

export default IncubadoraPDFReport;
