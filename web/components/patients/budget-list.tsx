"use client"

import { useState, useEffect } from "react"
import { createTenantClient } from "@/lib/supabase/tenant-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FileText, Plus, Download, Loader2, Calendar } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { useRouter } from "next/navigation"
import { BudgetForm } from "./budget-form"
import { downloadBudgetPDF } from "./budget-pdf"

interface Patient {
    id: string
    full_name: string
    contact_email?: string
    contact_phone?: string
    document_id?: string
}

interface BudgetListProps {
    patient: Patient
}

interface Budget {
    id: string
    created_at: string
    total_value: number
    status: string
    items: any[]
    valid_until: string
    conditions?: string
}

export function BudgetList({ patient }: BudgetListProps) {
    const router = useRouter()
    const [budgets, setBudgets] = useState<Budget[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [downloadingId, setDownloadingId] = useState<string | null>(null)

    const supabase = createTenantClient()

    const fetchBudgets = async () => {
        setIsLoading(true)
        const { data, error } = await supabase
            .from("budgets")
            .select("*")
            .eq("patient_id", patient.id)
            .order("created_at", { ascending: false })

        if (!error && data) {
            setBudgets(data)
        }
        setIsLoading(false)
    }

    useEffect(() => {
        fetchBudgets()
    }, [patient.id])

    const handleSuccess = () => {
        fetchBudgets()
    }

    const handleDownload = async (budget: Budget) => {
        setDownloadingId(budget.id)
        try {
            // Preparar dados para o PDF
            // Mock de dados profissionais por enquanto (no futuro pegar do usuário logado)
            const pdfData = {
                number: budget.id.slice(0, 8).toUpperCase(),
                date: budget.created_at,
                patient: {
                    name: patient.full_name,
                    email: patient.contact_email,
                    phone: patient.contact_phone,
                    cpf: patient.document_id,
                },
                items: budget.items,
                conditions: budget.conditions || "",
                professional: {
                    name: "Dr. Carlos Silva", // TODO: Pegar do profile do usuário
                    registry: "CRO: 12345-SP"
                }
            }

            await downloadBudgetPDF(pdfData)
        } catch (error) {
            console.error("Erro ao gerar PDF:", error)
            alert("Erro ao gerar PDF do orçamento.")
        } finally {
            setDownloadingId(null)
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'approved': return <Badge className="bg-green-500">Aprovado</Badge>
            case 'rejected': return <Badge variant="destructive">Rejeitado</Badge>
            case 'presented': return <Badge className="bg-blue-500">Apresentado</Badge>
            default: return <Badge variant="secondary">Rascunho</Badge>
        }
    }

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val)
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Orçamentos</h3>
                <Button
                    onClick={() => router.push(`/patients/${patient.id}/budgets/new`)}
                    className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
                >
                    <Plus className="mr-2 h-4 w-4" />
                    Novo Orçamento
                </Button>
            </div>

            {isLoading ? (
                <div className="text-center py-10">Carregando...</div>
            ) : budgets.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground border rounded-2xl border-dashed bg-emerald-50/20">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 mb-4">
                        <FileText className="h-8 w-8" />
                    </div>
                    <p className="text-lg font-medium text-slate-600">Nenhum orçamento criado</p>
                    <p className="text-sm text-slate-500 mt-1">Clique no botão acima para criar o primeiro</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {budgets.map((budget) => (
                        <Card key={budget.id} className="hover:shadow-md transition-shadow">
                            <CardHeader className="flex flex-row items-center justify-between py-4">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 rounded-xl bg-emerald-100 text-emerald-600">
                                        <FileText className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-base flex items-center gap-2">
                                            Orçamento #{budget.id.slice(0, 8).toUpperCase()}
                                            {getStatusBadge(budget.status)}
                                        </CardTitle>
                                        <div className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
                                            <Calendar className="h-3 w-3" />
                                            {format(new Date(budget.created_at), "dd 'de' MMMM, yyyy", { locale: ptBR })}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-right mr-4">
                                        <p className="text-xs text-muted-foreground">Valor Total</p>
                                        <p className="font-bold text-lg text-emerald-700">{formatCurrency(budget.total_value)}</p>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleDownload(budget)}
                                        disabled={downloadingId === budget.id}
                                    >
                                        {downloadingId === budget.id ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <>
                                                <Download className="h-4 w-4 mr-2" />
                                                PDF
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="py-2 border-t bg-muted/20 text-xs text-muted-foreground">
                                {budget.items?.length || 0} procedimentos • Válido até {budget.valid_until ? new Date(budget.valid_until).toLocaleDateString("pt-BR") : "-"}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}


        </div>
    )
}
