"use client"

import { Document, Page, Text, View, StyleSheet, pdf } from "@react-pdf/renderer"

// Estilos do PDF
const styles = StyleSheet.create({
    page: {
        padding: 40,
        fontFamily: "Helvetica",
        fontSize: 10,
    },
    header: {
        textAlign: "center",
        marginBottom: 20,
    },
    title: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#1e40af",
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 11,
        color: "#64748b",
    },
    section: {
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: "bold",
        color: "#1e40af",
        marginBottom: 8,
        paddingBottom: 4,
        borderBottomWidth: 1,
        borderBottomColor: "#e2e8f0",
    },
    row: {
        flexDirection: "row",
        marginBottom: 4,
    },
    label: {
        width: 120,
        color: "#64748b",
    },
    value: {
        flex: 1,
        fontWeight: "bold",
    },
    checkboxGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
    },
    checkboxItem: {
        width: "50%",
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 6,
    },
    checkbox: {
        width: 12,
        height: 12,
        borderWidth: 1,
        borderColor: "#94a3b8",
        marginRight: 6,
        justifyContent: "center",
        alignItems: "center",
    },
    checkboxChecked: {
        backgroundColor: "#3b82f6",
        borderColor: "#3b82f6",
    },
    checkmark: {
        color: "#ffffff",
        fontSize: 8,
        fontWeight: "bold",
    },
    checkboxLabel: {
        flex: 1,
    },
    declaration: {
        marginTop: 10,
        padding: 12,
        backgroundColor: "#fef3c7",
        fontSize: 9,
        lineHeight: 1.5,
    },
    signatureSection: {
        marginTop: 30,
        flexDirection: "row",
        justifyContent: "space-between",
    },
    signatureBox: {
        width: "45%",
        textAlign: "center",
    },
    signatureLine: {
        borderTopWidth: 1,
        borderTopColor: "#000000",
        marginTop: 40,
        paddingTop: 4,
    },
    footer: {
        position: "absolute",
        bottom: 30,
        left: 40,
        right: 40,
        textAlign: "center",
        fontSize: 8,
        color: "#94a3b8",
    },
})

interface AnamneseData {
    dadosPaciente: {
        nome: string
        dataNascimento?: string
        idade?: number
        cpf?: string
        telefone?: string
        email?: string
        comoConheceu?: string
    }
    avaliacaoMedica: Record<string, boolean | string>
    tratamento: {
        dentesSelec?: string
        observacoes?: string
    }
    assinatura: {
        declaracaoAceita: boolean
        dataCriacao: string
    }
}

const conditionLabels: Record<string, string> = {
    tratamento_medico: "Tratamento médico?",
    cirurgia_recente: "Cirurgia recente?",
    problema_pele: "Problema de pele?",
    doenca_infectocontagiosa: "Doença infectocontagiosa?",
    cancer: "Câncer?",
    disturbio_circulatorio: "Distúrbio circulatório?",
    uso_drogas: "Uso de drogas?",
    efeito_alcool: "Sob efeito de álcool?",
    dormiu_ontem: "Dormiu ontem?",
    em_jejum: "Em jejum?",
    anemia: "Anemia?",
    queloide: "Quelóide?",
    vitiligo: "Vitiligo?",
    diabetes: "Diabetes?",
    alergia_medicamentos: "Alergia a medicamentos?",
    depressao_ansiedade: "Depressão/ansiedade?",
    convulsoes_epilepsia: "Convulsões/epilepsia?",
    cardiopatia: "Cardiopatia?",
    hipertensao: "Hipertensão?",
    hipotensao: "Hipotensão?",
    marcapasso: "Marcapasso?",
    hemofilia: "Hemofilia?",
    hepatite: "Hepatite?",
    gestante: "Gestante?",
    amamentando: "Amamentando?",
}

const CheckboxItem = ({ label, checked }: { label: string; checked: boolean }) => (
    <View style={styles.checkboxItem}>
        <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
            {checked && <Text style={styles.checkmark}>✓</Text>}
        </View>
        <Text style={styles.checkboxLabel}>{label}</Text>
    </View>
)

const AnamneseDocument = ({ data, clinicName = "Clínica Odontológica" }: { data: AnamneseData; clinicName?: string }) => (
    <Document>
        <Page size="A4" style={styles.page}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>🦷 Anamnese Odontológica</Text>
                <Text style={styles.subtitle}>{clinicName}</Text>
            </View>

            {/* Dados do Paciente */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>👤 Dados do Paciente</Text>
                <View style={styles.row}>
                    <Text style={styles.label}>NOME:</Text>
                    <Text style={styles.value}>{data.dadosPaciente.nome}</Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.label}>DATA NASCIMENTO:</Text>
                    <Text style={styles.value}>
                        {data.dadosPaciente.dataNascimento
                            ? `${new Date(data.dadosPaciente.dataNascimento).toLocaleDateString("pt-BR")} (${data.dadosPaciente.idade} anos)`
                            : "-"
                        }
                    </Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.label}>CPF:</Text>
                    <Text style={styles.value}>{data.dadosPaciente.cpf || "-"}</Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.label}>TELEFONE:</Text>
                    <Text style={styles.value}>{data.dadosPaciente.telefone || "-"}</Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.label}>EMAIL:</Text>
                    <Text style={styles.value}>{data.dadosPaciente.email || "-"}</Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.label}>COMO NOS CONHECEU:</Text>
                    <Text style={styles.value}>{data.dadosPaciente.comoConheceu || "-"}</Text>
                </View>
            </View>

            {/* Avaliação Médica */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>❤️ Avaliação Médica</Text>
                <View style={styles.checkboxGrid}>
                    {Object.entries(conditionLabels).map(([key, label]) => (
                        <CheckboxItem
                            key={key}
                            label={label}
                            checked={!!data.avaliacaoMedica[key]}
                        />
                    ))}
                </View>
                <View style={[styles.row, { marginTop: 8 }]}>
                    <Text style={styles.label}>Tipo Sanguíneo:</Text>
                    <Text style={styles.value}>{data.avaliacaoMedica.tipoSanguineo || "-"}</Text>
                </View>
            </View>

            {/* Tratamento */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>🩺 Tratamento</Text>
                <View style={styles.row}>
                    <Text style={styles.label}>Dentes selecionados:</Text>
                    <Text style={styles.value}>{data.tratamento.dentesSelec || "-"}</Text>
                </View>
                {data.tratamento.observacoes && (
                    <View style={{ marginTop: 8 }}>
                        <Text style={styles.label}>Observações:</Text>
                        <Text style={{ marginTop: 4 }}>{data.tratamento.observacoes}</Text>
                    </View>
                )}
            </View>

            {/* Declaração */}
            <View style={styles.declaration}>
                <Text>
                    Declaro que as informações acima prestadas são verdadeiras e assumo total
                    responsabilidade pelas mesmas, estando ciente de que a omissão de qualquer
                    informação pode comprometer o meu tratamento.
                </Text>
            </View>

            {/* Assinaturas */}
            <View style={styles.signatureSection}>
                <View style={styles.signatureBox}>
                    <Text style={styles.signatureLine}>Assinatura do Paciente</Text>
                </View>
                <View style={styles.signatureBox}>
                    <Text style={styles.signatureLine}>
                        Data: {new Date(data.assinatura.dataCriacao).toLocaleDateString("pt-BR")}
                    </Text>
                </View>
            </View>

            {/* Footer */}
            <Text style={styles.footer}>
                Documento gerado em {new Date().toLocaleDateString("pt-BR")} às {new Date().toLocaleTimeString("pt-BR")}
            </Text>
        </Page>
    </Document>
)

export async function generateAnamesePDF(data: AnamneseData, clinicName?: string): Promise<Blob> {
    const blob = await pdf(<AnamneseDocument data={data} clinicName={clinicName} />).toBlob()
    return blob
}

export async function downloadAnamesePDF(data: AnamneseData, patientName: string, clinicName?: string) {
    const blob = await generateAnamesePDF(data, clinicName)
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `anamnese_${patientName.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
}
