"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createTenantClient } from "@/lib/supabase/tenant-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Plus, Stethoscope, Award, Download, Eye, Loader2, Pencil } from "lucide-react"
import { downloadAnamesePDF } from "./anamnese-pdf"

interface ClinicalRecord {
    id: string
    type: 'anamnesis' | 'certificate' | 'exam_upload'
    title: string
    content: any
    created_at: string
}

interface ClinicalHistoryProps {
    patientId: string
    filterType?: 'anamnesis' | 'certificate'
    initialRecords?: ClinicalRecord[]
}

export function ClinicalHistory({ patientId, filterType, initialRecords = [] }: ClinicalHistoryProps) {
    const router = useRouter()
    const [records, setRecords] = useState<ClinicalRecord[]>(initialRecords)
    const [isOpen, setIsOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [isFetching, setIsFetching] = useState(true)
    const [downloadingId, setDownloadingId] = useState<string | null>(null)
    const [viewingRecord, setViewingRecord] = useState<ClinicalRecord | null>(null)

    // Form states for simple dialog (certificates)
    const [title, setTitle] = useState("")
    const [notes, setNotes] = useState("")

    const supabase = createTenantClient()

    // Labels based on type
    const labels = filterType === 'certificate'
        ? { title: 'Atestados', button: 'Novo Atestado', empty: 'Nenhum atestado encontrado.', dialogTitle: 'Novo Atestado' }
        : { title: 'Anamneses', button: 'Nova Anamnese', empty: 'Nenhuma anamnese encontrada.', dialogTitle: 'Nova Anamnese' }

    // Fetch records on mount
    useEffect(() => {
        fetchRecords()
    }, [patientId, filterType])

    const fetchRecords = async () => {
        setIsFetching(true)
        let query = supabase
            .from("clinical_records")
            .select("*")
            .eq("patient_id", patientId)
            .order("created_at", { ascending: false })

        if (filterType) {
            query = query.eq("type", filterType)
        }

        const { data } = await query
        if (data) setRecords(data)
        setIsFetching(false)
    }

    const handleSubmit = async () => {
        setIsLoading(true)
        try {
            const { data, error } = await supabase
                .from("clinical_records")
                .insert({
                    patient_id: patientId,
                    type: filterType || 'certificate',
                    title,
                    content: { notes },
                })
                .select()
                .single()

            if (error) throw error

            setRecords([data, ...records])
            setIsOpen(false)
            setTitle("")
            setNotes("")
        } catch (error) {
            console.error("Error saving record:", error)
            alert("Erro ao salvar registro.")
        } finally {
            setIsLoading(false)
        }
    }

    const handleDownloadPDF = async (record: ClinicalRecord) => {
        if (!record.content?.dadosPaciente) {
            alert("Este registro não possui dados completos para gerar PDF.")
            return
        }

        setDownloadingId(record.id)
        try {
            await downloadAnamesePDF(record.content, record.content.dadosPaciente.nome)
        } catch (error) {
            console.error("Error generating PDF:", error)
            alert("Erro ao gerar PDF.")
        } finally {
            setDownloadingId(null)
        }
    }

    const handleNewAnamnese = () => {
        // Navigate to full-page anamnese form
        router.push(`/patients/${patientId}/anamnese/new`)
    }

    const Icon = filterType === 'certificate' ? Award : Stethoscope
    const isAnamnesis = filterType === 'anamnesis'

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">{labels.title}</h3>

                {isAnamnesis ? (
                    // Navigate to full-page form for anamnesis
                    <Button onClick={handleNewAnamnese} className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700">
                        <Plus className="mr-2 h-4 w-4" />
                        {labels.button}
                    </Button>
                ) : (
                    // Use simple dialog for certificates
                    <Dialog open={isOpen} onOpenChange={setIsOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                {labels.button}
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>{labels.dialogTitle}</DialogTitle>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label>Título</Label>
                                    <Input
                                        placeholder="Ex: Atestado para trabalho..."
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Conteúdo do Atestado</Label>
                                    <Textarea
                                        placeholder="Descreva o conteúdo do atestado..."
                                        className="min-h-[100px]"
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                    />
                                </div>
                                <Button onClick={handleSubmit} disabled={isLoading}>
                                    {isLoading ? "Salvando..." : "Salvar"}
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                )}
            </div>

            <div className="space-y-4">
                {isFetching ? (
                    <div className="text-center py-10 text-muted-foreground">
                        Carregando...
                    </div>
                ) : records.length === 0 ? (
                    <div className="text-center py-16 text-muted-foreground border rounded-2xl border-dashed bg-slate-50/50">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 mb-4">
                            <Icon className="h-8 w-8" />
                        </div>
                        <p className="text-lg font-medium text-slate-600">{labels.empty}</p>
                        <p className="text-sm text-slate-500 mt-1">Clique no botão acima para adicionar</p>
                    </div>
                ) : (
                    records.map((record) => (
                        <Card key={record.id} className="hover:shadow-md transition-shadow group">
                            <CardHeader className="flex flex-row items-center gap-4 py-4">
                                <div className={`
                                    p-3 rounded-xl transition-colors
                                    ${isAnamnesis
                                        ? 'bg-blue-100 text-blue-600 group-hover:bg-blue-200'
                                        : 'bg-amber-100 text-amber-600 group-hover:bg-amber-200'
                                    }
                                `}>
                                    <Icon className="h-5 w-5" />
                                </div>
                                <div className="flex-1">
                                    <CardTitle className="text-base">{record.title}</CardTitle>
                                    <div className="text-xs text-muted-foreground">
                                        {format(new Date(record.created_at), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    {isAnamnesis && record.content?.dadosPaciente && (
                                        <>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => router.push(`/patients/${patientId}/anamnese/${record.id}/edit`)}
                                                className="rounded-lg"
                                            >
                                                <Pencil className="h-4 w-4 mr-1" />
                                                Editar
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleDownloadPDF(record)}
                                                disabled={downloadingId === record.id}
                                                className="rounded-lg"
                                            >
                                                {downloadingId === record.id ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <>
                                                        <Download className="h-4 w-4 mr-1" />
                                                        PDF
                                                    </>
                                                )}
                                            </Button>
                                        </>
                                    )}
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setViewingRecord(record)}
                                        className="rounded-lg"
                                    >
                                        <Eye className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="text-sm text-muted-foreground border-t pt-4">
                                {record.content?.notes || record.content?.tratamento?.observacoes || "Sem anotações detalhadas."}
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {/* View Record Dialog */}
            <Dialog open={!!viewingRecord} onOpenChange={() => setViewingRecord(null)}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{viewingRecord?.title}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        {viewingRecord?.content?.dadosPaciente ? (
                            // Full anamnese view
                            <div className="space-y-4">
                                <div className="p-4 bg-blue-50 rounded-xl">
                                    <h4 className="font-semibold text-blue-700 mb-2">Dados do Paciente</h4>
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        <p><strong>Nome:</strong> {viewingRecord.content.dadosPaciente.nome}</p>
                                        <p><strong>Telefone:</strong> {viewingRecord.content.dadosPaciente.telefone || "-"}</p>
                                        <p><strong>Email:</strong> {viewingRecord.content.dadosPaciente.email || "-"}</p>
                                        <p><strong>CPF:</strong> {viewingRecord.content.dadosPaciente.cpf || "-"}</p>
                                    </div>
                                </div>

                                <div className="p-4 bg-rose-50 rounded-xl">
                                    <h4 className="font-semibold text-rose-700 mb-2">Avaliação Médica</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {Object.entries(viewingRecord.content.avaliacaoMedica || {}).map(([key, value]) => {
                                            if (key === "tipoSanguineo") return null
                                            if (!value) return null
                                            return (
                                                <span
                                                    key={key}
                                                    className="px-2 py-1 bg-white rounded-full text-xs text-rose-700 border border-rose-200"
                                                >
                                                    ✓ {key.replace(/_/g, " ")}
                                                </span>
                                            )
                                        })}
                                    </div>
                                    {viewingRecord.content.avaliacaoMedica?.tipoSanguineo && (
                                        <p className="mt-2 text-sm">
                                            <strong>Tipo Sanguíneo:</strong> {viewingRecord.content.avaliacaoMedica.tipoSanguineo}
                                        </p>
                                    )}
                                </div>

                                {viewingRecord.content.tratamento && (
                                    <div className="p-4 bg-emerald-50 rounded-xl">
                                        <h4 className="font-semibold text-emerald-700 mb-2">Tratamento</h4>
                                        <p className="text-sm"><strong>Dentes:</strong> {viewingRecord.content.tratamento.dentesSelec || "-"}</p>
                                        {viewingRecord.content.tratamento.observacoes && (
                                            <p className="text-sm mt-1"><strong>Obs:</strong> {viewingRecord.content.tratamento.observacoes}</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        ) : (
                            // Simple note view
                            <p className="text-sm text-muted-foreground">
                                {viewingRecord?.content?.notes || "Sem anotações."}
                            </p>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
