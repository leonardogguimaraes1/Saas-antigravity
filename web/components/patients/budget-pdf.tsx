"use client"

import { Document, Page, Text, View, StyleSheet, pdf } from "@react-pdf/renderer"

// Estilos do PDF - Baseado na imagem fornecida
const styles = StyleSheet.create({
    page: {
        padding: 40,
        fontFamily: "Helvetica",
        fontSize: 10,
        color: "#334155", // Slate-700
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 30,
        borderBottomWidth: 1,
        borderBottomColor: "#e2e8f0",
        paddingBottom: 20,
    },
    clinicName: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#1e40af", // Blue-800
    },
    docTypeContainer: {
        alignItems: "flex-end",
    },
    docTitle: {
        fontSize: 16,
        fontWeight: "bold",
        textTransform: "uppercase",
        color: "#0f172a", // Slate-900
    },
    docMeta: {
        fontSize: 9,
        color: "#64748b",
        marginTop: 4,
    },
    section: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 10,
        fontWeight: "bold",
        color: "#64748b",
        textTransform: "uppercase",
        marginBottom: 10,
        letterSpacing: 0.5,
    },
    patientGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
    },
    patientRow: {
        flexDirection: "row",
        width: "100%",
        marginBottom: 6,
    },
    patientCol: {
        width: "50%",
    },
    fieldLabel: {
        fontWeight: "bold",
        fontSize: 10,
        color: "#0f172a",
        marginRight: 4,
    },
    fieldValue: {
        fontSize: 10,
        color: "#334155",
    },
    table: {
        marginTop: 10,
        marginBottom: 20,
    },
    tableHeader: {
        flexDirection: "row",
        borderBottomWidth: 1,
        borderBottomColor: "#cbd5e1",
        paddingBottom: 6,
        marginBottom: 6,
    },
    tableRow: {
        flexDirection: "row",
        paddingVertical: 6,
        borderBottomWidth: 1,
        borderBottomColor: "#f1f5f9",
    },
    colProc: { width: "40%", fontWeight: "bold", color: "#334155" },
    colTooth: { width: "15%", textAlign: "center", color: "#475569" },
    colValue: { width: "15%", textAlign: "right", color: "#475569" },
    colDesc: { width: "15%", textAlign: "right", color: "#475569" },
    colTotal: { width: "15%", textAlign: "right", fontWeight: "bold", color: "#0f172a" },

    totalRow: {
        flexDirection: "row",
        justifyContent: "flex-end",
        marginTop: 10,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: "#e2e8f0",
    },
    totalLabel: {
        fontSize: 11,
        fontWeight: "bold",
        color: "#64748b",
        marginRight: 20,
    },
    totalValue: {
        fontSize: 12,
        fontWeight: "bold",
        color: "#0f172a",
    },
    conditionsBox: {
        marginTop: 10,
    },
    conditionItem: {
        flexDirection: "row",
        marginBottom: 4,
    },
    bullet: {
        width: 10,
        fontSize: 10,
        color: "#64748b",
    },
    conditionText: {
        flex: 1,
        fontSize: 10,
        lineHeight: 1.4,
        color: "#475569",
    },
    footerSection: {
        position: "absolute",
        bottom: 40,
        left: 40,
        right: 40,
    },
    signatures: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 20,
    },
    signatureBlock: {
        width: "40%",
        alignItems: "center",
        borderTopWidth: 1,
        borderTopColor: "#000",
        paddingTop: 8,
    },
    signerName: {
        fontSize: 10,
        fontWeight: "bold",
        color: "#0f172a",
    },
    signerRole: {
        fontSize: 8,
        color: "#64748b",
        marginTop: 2,
    },
    disclaimer: {
        textAlign: "center",
        fontSize: 8,
        color: "#94a3b8",
        marginTop: 10,
    },
})

export interface BudgetItem {
    procedimento: string
    dente: string
    valor: number
    desconto: number // percentual (0-100)
}

export interface BudgetData {
    number: string
    date: string
    patient: {
        name: string
        email?: string
        phone?: string
        cpf?: string
    }
    items: BudgetItem[]
    conditions: string // Texto livre para condições
    professional: {
        name: string
        registry: string
    }
}

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)
}

const calculateTotal = (items: BudgetItem[]) => {
    return items.reduce((acc, item) => {
        const itemTotal = item.valor * (1 - item.desconto / 100)
        return acc + itemTotal
    }, 0)
}

const BudgetDocument = ({ data, clinicName = "Clínica Odontológica" }: { data: BudgetData; clinicName?: string }) => {
    const totalValue = calculateTotal(data.items)

    // Processar condições (quebras de linha viram bullets)
    const conditionLines = data.conditions
        ? data.conditions.split("\n").filter(line => line.trim().length > 0)
        : []

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.clinicName}>{clinicName}</Text>
                    </View>
                    <View style={styles.docTypeContainer}>
                        <Text style={styles.docTitle}>ORÇAMENTO</Text>
                        <Text style={styles.docMeta}>Nº {data.number}</Text>
                        <Text style={styles.docMeta}>Data: {new Date(data.date).toLocaleDateString("pt-BR")}</Text>
                    </View>
                </View>

                {/* Dados do Paciente */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>DADOS DO PACIENTE</Text>
                    <View style={styles.patientGrid}>
                        <View style={styles.patientRow}>
                            <View style={styles.patientCol}>
                                <Text>
                                    <Text style={styles.fieldLabel}>Nome: </Text>
                                    <Text style={styles.fieldValue}>{data.patient.name}</Text>
                                </Text>
                            </View>
                            <View style={styles.patientCol}>
                                <Text>
                                    <Text style={styles.fieldLabel}>Telefone: </Text>
                                    <Text style={styles.fieldValue}>{data.patient.phone || "-"}</Text>
                                </Text>
                            </View>
                        </View>
                        <View style={styles.patientRow}>
                            <View style={styles.patientCol}>
                                <Text>
                                    <Text style={styles.fieldLabel}>Email: </Text>
                                    <Text style={styles.fieldValue}>{data.patient.email || "-"}</Text>
                                </Text>
                            </View>
                            <View style={styles.patientCol}>
                                <Text>
                                    <Text style={styles.fieldLabel}>CPF: </Text>
                                    <Text style={styles.fieldValue}>{data.patient.cpf || "-"}</Text>
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Procedimentos */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>PROCEDIMENTOS</Text>
                    <View style={styles.table}>
                        {/* Table Header */}
                        <View style={styles.tableHeader}>
                            <Text style={[styles.colProc]}>Procedimento</Text>
                            <Text style={[styles.colTooth]}>Dente(s)</Text>
                            <Text style={[styles.colValue]}>Valor</Text>
                            <Text style={[styles.colDesc]}>Desc.</Text>
                            <Text style={[styles.colTotal]}>Total</Text>
                        </View>

                        {/* Table Rows */}
                        {data.items.map((item, index) => {
                            const itemTotal = item.valor * (1 - item.desconto / 100)
                            return (
                                <View key={index} style={styles.tableRow}>
                                    <Text style={styles.colProc}>{item.procedimento}</Text>
                                    <Text style={styles.colTooth}>{item.dente}</Text>
                                    <Text style={styles.colValue}>{formatCurrency(item.valor)}</Text>
                                    <Text style={styles.colDesc}>{item.desconto > 0 ? `${item.desconto}%` : "-"}</Text>
                                    <Text style={styles.colTotal}>{formatCurrency(itemTotal)}</Text>
                                </View>
                            )
                        })}

                        {/* Total Row */}
                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>VALOR TOTAL</Text>
                            <Text style={styles.totalValue}>{formatCurrency(totalValue)}</Text>
                        </View>
                    </View>
                </View>

                {/* Condições */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>CONDIÇÕES</Text>
                    <View style={styles.conditionsBox}>
                        {conditionLines.length > 0 ? (
                            conditionLines.map((line, i) => (
                                <View key={i} style={styles.conditionItem}>
                                    <Text style={styles.bullet}>•</Text>
                                    <Text style={styles.conditionText}>{line}</Text>
                                </View>
                            ))
                        ) : (
                            <Text style={{ fontSize: 10, color: "#94a3b8", fontStyle: "italic" }}>Nenhuma condição específica definida.</Text>
                        )}
                    </View>
                </View>

                {/* Footer / Assinaturas */}
                <View style={styles.footerSection}>
                    <View style={styles.signatures}>
                        <View style={styles.signatureBlock}>
                            <Text style={styles.signerName}>{data.professional.name}</Text>
                            <Text style={styles.signerRole}>{data.professional.registry}</Text>
                        </View>
                        <View style={styles.signatureBlock}>
                            <Text style={styles.signerName}>{data.patient.name}</Text>
                            <Text style={styles.signerRole}>Paciente</Text>
                        </View>
                    </View>

                    <Text style={styles.disclaimer}>
                        Este documento é uma proposta de tratamento odontológico e não constitui diagnóstico definitivo.
                    </Text>
                    <Text style={styles.disclaimer}>
                        Gerado em {new Date().toLocaleDateString("pt-BR")} às {new Date().toLocaleTimeString("pt-BR")}
                    </Text>
                </View>

            </Page>
        </Document>
    )
}

export async function generateBudgetPDF(data: BudgetData, clinicName?: string): Promise<Blob> {
    const blob = await pdf(<BudgetDocument data={data} clinicName={clinicName} />).toBlob()
    return blob
}

export async function downloadBudgetPDF(data: BudgetData, clinicName?: string) {
    const blob = await generateBudgetPDF(data, clinicName)
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url

    // Sanitize filename: remove accents, special chars, keep only safe chars
    const safeName = data.patient.name
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Remove accrual marks
        .replace(/[^a-zA-Z0-9\s-_]/g, "") // Remove non-alphanumeric except space, hyphen, underscore
        .trim()
        .replace(/\s+/g, "_") // Replace spaces with underscores

    link.download = `orcamento_${data.number}_${safeName}.pdf`

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
}
