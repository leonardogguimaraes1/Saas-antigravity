"use client"

import { useState } from "react"
import { createTenantClient } from "@/lib/supabase/tenant-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Plus, DollarSign, FileCheck, XCircle, Clock } from "lucide-react"

interface Budget {
    id: string
    status: 'draft' | 'presented' | 'approved' | 'rejected'
    total_value: number
    created_at: string
}

interface BudgetListProps {
    patientId: string
}

export function BudgetList({ patientId }: BudgetListProps) {
    const [budgets, setBudgets] = useState<Budget[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isOpen, setIsOpen] = useState(false)
    const [isSaving, setIsSaving] = useState(false)

    // Form
    const [value, setValue] = useState("")
    const [status, setStatus] = useState<string>("draft")

    const supabase = createTenantClient()

    // Load initial data
    useState(() => {
        const fetchBudgets = async () => {
            const { data } = await supabase
                .from("budgets")
                .select("*")
                .eq("patient_id", patientId)
                .order("created_at", { ascending: false })

            if (data) setBudgets(data)
            setIsLoading(false)
        }
        fetchBudgets()
    })

    const handleSubmit = async () => {
        setIsSaving(true)
        try {
            const { data, error } = await supabase
                .from("budgets")
                .insert({
                    patient_id: patientId,
                    total_value: parseFloat(value) || 0,
                    status,
                    items: [] // Future: Add items builder
                })
                .select()
                .single()

            if (error) throw error

            setBudgets([data, ...budgets])
            setIsOpen(false)
            setValue("")
        } catch (error) {
            console.error("Error saving budget:", error)
            alert("Erro ao criar orçamento.")
        } finally {
            setIsSaving(false)
        }
    }

    const getStatusParams = (status: string) => {
        switch (status) {
            case 'approved': return { label: 'Aprovado', color: 'text-green-600 bg-green-100', icon: FileCheck }
            case 'rejected': return { label: 'Rejeitado', color: 'text-red-600 bg-red-100', icon: XCircle }
            case 'presented': return { label: 'Apresentado', color: 'text-blue-600 bg-blue-100', icon: Clock }
            default: return { label: 'Rascunho', color: 'text-gray-600 bg-gray-100', icon: FileText } // FileText import needed if used
        }
    }

    // Helper for FileText since it wasn't in the initial imports for the switch default
    const StatusIcon = ({ status }: { status: string }) => {
        const { icon: Icon, color } = getStatusParams(status)
        return <div className={`p-2 rounded-full ${color}`}><Icon className="h-4 w-4" /></div>
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Orçamentos</h3>
                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Novo Orçamento
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Novo Orçamento</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label>Valor Total (R$)</Label>
                                <Input
                                    type="number"
                                    placeholder="0.00"
                                    value={value}
                                    onChange={(e) => setValue(e.target.value)}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Status Inicial</Label>
                                <Select value={status} onValueChange={setStatus}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="draft">Rascunho</SelectItem>
                                        <SelectItem value="presented">Apresentado</SelectItem>
                                        <SelectItem value="approved">Aprovado</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button onClick={handleSubmit} disabled={isSaving}>
                                {isSaving ? "Criando..." : "Criar Orçamento"}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {budgets.length === 0 && !isLoading ? (
                    <div className="col-span-full text-center py-10 text-muted-foreground border rounded-lg border-dashed">
                        Nenhum orçamento cadastrado para este paciente.
                    </div>
                ) : (
                    budgets.map((budget) => (
                        <Card key={budget.id} className="cursor-pointer hover:bg-zinc-50 transition-colors">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">
                                    {format(new Date(budget.created_at), "dd/MM/yyyy", { locale: ptBR })}
                                </CardTitle>
                                <StatusIcon status={budget.status} />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(budget.total_value)}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1 capitalize">
                                    {getStatusParams(budget.status).label}
                                </p>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    )
}

// Missing import fix for helper
import { FileText } from "lucide-react"
