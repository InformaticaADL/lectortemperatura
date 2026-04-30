import React from 'react';
import {
    Document,
    Page,
    Text,
    View,
    StyleSheet,
    Image,
} from '@react-pdf/renderer';

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
        color: '#134e4a', // teal-900 equivalente
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
        width: 535, // Ancho fijo ajustado a los márgenes de la página A4
        height: 250, // Alto fijo
        objectFit: 'contain', // Asegura que la imagen no se deforme
        alignSelf: 'center', // Centra la imagen horizontalmente
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
    // Ajuste de anchos para Apoyo: Fecha, Hora, Temp, S/N
    tableCol1: { width: '20%', borderRightWidth: 1, borderColor: '#e5e7eb', padding: 6 },
    tableCol2: { width: '15%', borderRightWidth: 1, borderColor: '#e5e7eb', padding: 6 },
    tableCol3: { width: '25%', borderRightWidth: 1, borderColor: '#e5e7eb', padding: 6 },
    tableCol4: { width: '40%', borderRightWidth: 0, padding: 6 },

    tableCellHeader: {
        fontSize: 9,
        fontWeight: 'bold',
        color: '#374151',
        textAlign: 'center',
    },
    tableCell: {
        fontSize: 9,
        color: '#4b5563',
        textAlign: 'center',
    },
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

// path al logo puede ser relativo
const LOGO_SRC = "/images/logo_adl.png";

const ApoyoPDFReport = ({ data, chartImageBase64, equipoName, startDate, endDate }) => {
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
                    <Image style={styles.logo} src={LOGO_SRC} />

                    <View style={styles.headerTextContainer}>
                        <Text style={styles.title}>Reporte de Temperatura</Text>
                        <Text style={styles.subtitle}>Unidad Apoyo: {equipoName || "N/A"}</Text>
                        <Text style={styles.subtitle}>Período: {dateRangeText}</Text>
                        <Text style={styles.subtitle}>Generado: {today}</Text>
                    </View>
                </View>

                {/* GRÁFICO (IMAGEN) */}
                {chartImageBase64 && (
                    <View style={styles.section}>
                        <Text style={[styles.title, { fontSize: 13, marginBottom: 8 }]}>Historial Gráfico de Temperaturas</Text>
                        <Image style={styles.chartImage} src={chartImageBase64} />
                    </View>
                )}

                {/* TABLA DE DATOS */}
                <View style={[styles.section, { marginTop: 10 }]}>
                    <Text style={[styles.title, { fontSize: 13, marginBottom: 8 }]}>Registro de Temperaturas</Text>

                    <View style={styles.table}>
                        {/* Cabecera */}
                        <View style={styles.tableHeaderRow}>
                            <View style={styles.tableCol1}><Text style={styles.tableCellHeader}>Fecha</Text></View>
                            <View style={styles.tableCol2}><Text style={styles.tableCellHeader}>Hora</Text></View>
                            <View style={styles.tableCol3}><Text style={styles.tableCellHeader}>Temp (°C)</Text></View>
                            <View style={styles.tableCol4}><Text style={styles.tableCellHeader}>Serial Number</Text></View>
                        </View>

                        {/* Filas */}
                        {data.map((row, i) => (
                            <View key={row.id_registro || i} style={[styles.tableRow, { borderBottomWidth: i === data.length - 1 ? 0 : 1, borderColor: '#e5e7eb', backgroundColor: i % 2 === 0 ? '#ffffff' : '#f9fafb' }]}>
                                <View style={styles.tableCol1}><Text style={styles.tableCell}>{row.fecha}</Text></View>
                                <View style={styles.tableCol2}><Text style={styles.tableCell}>{formatTime(row.hora)}</Text></View>
                                <View style={styles.tableCol3}><Text style={[styles.tableCell, { color: '#0f766e' }]}>{row.temperatura}</Text></View>
                                <View style={styles.tableCol4}><Text style={styles.tableCell}>{row.serial_number}</Text></View>
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

export default ApoyoPDFReport;
