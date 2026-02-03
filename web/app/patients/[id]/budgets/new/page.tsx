"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { createTenantClient } from "@/lib/supabase/tenant-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
    ArrowLeft,
    Check,
    Loader2,
    FileText,
    Calculator,
    Plus,
    Trash2,
    Calendar,
    User,
    Star,
    X
} from "lucide-react"
import { usePresets } from "@/hooks/use-presets"

interface Patient {
    id: string
    full_name: string
    contact_email?: string
    contact_phone?: string
    document_id?: string
}

interface BudgetItem {
    id: string
    procedimento: string
    dente: string // ex: "11", "Todos", "Sup"
    valor: number
    desconto: number // %
}

export default function NewBudgetPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: patientId } = use(params)
    const router = useRouter()
    const supabase = createTenantClient()

    const [patient, setPatient] = useState<Patient | null>(null)
    const [isLoading, setIsLoading] = useState(true) // Carregando paciente
    const [isSaving, setIsSaving] = useState(false) // Salvando orçamento

    // Items do orçamento
    const [items, setItems] = useState<BudgetItem[]>([])

    // Novo item sendo adicionado
    const [newItem, setNewItem] = useState<Partial<BudgetItem>>({
        procedimento: "",
        dente: "",
        valor: 0,
        desconto: 0
    })

    // Condições (Lista de strings)
    const [conditionsList, setConditionsList] = useState<string[]>([
        "Orçamento válido por 30 dias",
        "Valores sujeitos a alteração conforme diagnóstico",
        "Formas de pagamento: Dinheiro, PIX, Cartão de Crédito/Débito"
    ])
    const [newConditionRaw, setNewConditionRaw] = useState("")

    // Presets Hook
    const { presets, addPreset, removePreset } = usePresets('budget_condition')

    const addCondition = (text: string) => {
        if (!text.trim()) return
        if (!conditionsList.includes(text)) {
            setConditionsList([...conditionsList, text])
        }
        setNewConditionRaw("")
    }

    const handleSaveFavorite = async () => {
        if (!newConditionRaw.trim()) return
        await addPreset(newConditionRaw)
        // Also add to current list
        addCondition(newConditionRaw)
    }

    const removeCondition = (index: number) => {
        setConditionsList(conditionsList.filter((_, i) => i !== index))
    }

    const [validUntil, setValidUntil] = useState<string>("")

    // Define data de validade padrão (30 dias) ao carregar
    useEffect(() => {
        const date = new Date()
        date.setDate(date.getDate() + 30)
        setValidUntil(date.toISOString().split('T')[0])
    }, [])

    // Fetch patient data
    useEffect(() => {
        const fetchPatient = async () => {
            setIsLoading(true)
            const { data } = await supabase
                .from("patients")
                .select("*")
                .eq("id", patientId)
                .single()

            if (data) {
                setPatient(data)
            }
            setIsLoading(false)
        }
        fetchPatient()
    }, [patientId])

    const addItem = () => {
        if (!newItem.procedimento || newItem.valor === undefined) {
            alert("Preencha pelo menos o procedimento e o valor.")
            return
        }

        const item: BudgetItem = {
            id: crypto.randomUUID(),
            procedimento: newItem.procedimento,
            dente: newItem.dente || "-",
            valor: Number(newItem.valor),
            desconto: Number(newItem.desconto || 0)
        }

        setItems([...items, item])
        setNewItem({ procedimento: "", dente: "", valor: 0, desconto: 0 })
    }

    const removeItem = (id: string) => {
        setItems(items.filter(i => i.id !== id))
    }

    const calculateTotal = () => {
        return items.reduce((acc, item) => {
            const val = item.valor * (1 - item.desconto / 100)
            return acc + val
        }, 0)
    }

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val)
    }

    const handleSubmit = async () => {
        if (items.length === 0) {
            alert("Adicione pelo menos um procedimento ao orçamento.")
            return
        }

        setIsSaving(true)
        try {
            const totalValue = calculateTotal()

            // Join conditions with bullet points for PDF/Storage
            const formattedConditions = conditionsList.map(c => `• ${c}`).join('\n')

            const budgetData = {
                patient_id: patientId,
                status: 'draft',
                total_value: totalValue,
                items: items, // JSONB
                valid_until: validUntil,
                conditions: formattedConditions,
            }

            const { error } = await supabase
                .from("budgets")
                .insert(budgetData)

            if (error) throw error

            router.push(`/patients/${patientId}?tab=budgets`)
        } catch (error) {
            console.error("Erro ao salvar orçamento:", error)
            alert("Erro ao salvar orçamento. Tente novamente.")
        } finally {
            setIsSaving(false)
        }
    }

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                    <p className="text-emerald-800">Carregando...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
            {/* Header Fixo */}
            <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/70 border-b border-emerald-100 shadow-sm">
                <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.back()}
                            className="hover:bg-emerald-50 text-emerald-700"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div>
                            <h1 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
                                <FileText className="h-5 w-5 text-emerald-600" />
                                Novo Orçamento
                            </h1>
                            <p className="text-sm text-slate-500">{patient?.full_name}</p>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">

                {/* Seção 1: Adicionar Procedimentos */}
                <Card className="border-emerald-100 shadow-lg shadow-emerald-500/5 bg-white/80 backdrop-blur-sm">
                    <CardHeader className="border-b border-emerald-50 bg-emerald-50/30">
                        <CardTitle className="flex items-center gap-2 text-lg text-emerald-800">
                            <Calculator className="h-5 w-5" />
                            Adicionar Procedimento
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                        <div className="grid grid-cols-12 gap-4">
                            <div className="col-span-12 md:col-span-5">
                                <Label className="text-xs text-muted-foreground uppercase tracking-wide mb-1.5 block">Procedimento</Label>
                                <Input
                                    placeholder="Ex: Limpeza, Restauração..."
                                    value={newItem.procedimento}
                                    onChange={e => setNewItem({ ...newItem, procedimento: e.target.value })}
                                    className="h-11 bg-white"
                                />
                            </div>
                            <div className="col-span-6 md:col-span-2">
                                <Label className="text-xs text-muted-foreground uppercase tracking-wide mb-1.5 block">Dente(s)</Label>
                                <Input
                                    placeholder="11, 21"
                                    value={newItem.dente}
                                    onChange={e => setNewItem({ ...newItem, dente: e.target.value })}
                                    className="h-11 bg-white"
                                />
                            </div>
                            <div className="col-span-6 md:col-span-3">
                                <Label className="text-xs text-muted-foreground uppercase tracking-wide mb-1.5 block">Valor (R$)</Label>
                                <Input
                                    type="number"
                                    placeholder="0,00"
                                    value={newItem.valor || ""}
                                    onChange={e => setNewItem({ ...newItem, valor: parseFloat(e.target.value) })}
                                    className="h-11 bg-white"
                                />
                            </div>
                            <div className="col-span-6 md:col-span-2">
                                <Label className="text-xs text-muted-foreground uppercase tracking-wide mb-1.5 block">Desc (%)</Label>
                                <Input
                                    type="number"
                                    placeholder="0"
                                    value={newItem.desconto || ""}
                                    onChange={e => setNewItem({ ...newItem, desconto: parseFloat(e.target.value) })}
                                    className="h-11 bg-white"
                                />
                            </div>
                        </div>
                        <Button
                            onClick={addItem}
                            className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20"
                        >
                            <Plus className="h-4 w-4 mr-2" /> Adicionar Item ao Orçamento
                        </Button>
                    </CardContent>
                </Card>

                {/* Seção 2: Itens Adicionados */}
                {items.length > 0 && (
                    <Card className="border-slate-200 shadow-md">
                        <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                            <div className="flex justify-between items-center">
                                <CardTitle className="text-base font-medium text-slate-700">Itens do Orçamento</CardTitle>
                                <span className="text-sm text-muted-foreground">{items.length} item(s)</span>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow className="hover:bg-transparent">
                                        <TableHead className="pl-6">Procedimento</TableHead>
                                        <TableHead className="w-[100px]">Dente</TableHead>
                                        <TableHead className="text-right">Valor</TableHead>
                                        <TableHead className="text-right">Total</TableHead>
                                        <TableHead className="w-[50px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {items.map((item) => (
                                        <TableRow key={item.id} className="hover:bg-emerald-50/30">
                                            <TableCell className="pl-6 font-medium text-slate-800">{item.procedimento}</TableCell>
                                            <TableCell className="text-slate-600">{item.dente}</TableCell>
                                            <TableCell className="text-right text-slate-600">
                                                <div className="flex flex-col">
                                                    <span>{formatCurrency(item.valor)}</span>
                                                    {item.desconto > 0 && <span className="text-xs text-green-600">-{item.desconto}%</span>}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right font-bold text-emerald-700">
                                                {formatCurrency(item.valor * (1 - item.desconto / 100))}
                                            </TableCell>
                                            <TableCell>
                                                <Button variant="ghost" size="icon" onClick={() => removeItem(item.id)} className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                            <div className="flex justify-end p-6 bg-slate-50/50 border-t border-slate-100">
                                <div className="text-right">
                                    <p className="text-sm text-slate-500 uppercase tracking-wider mb-1">Valor Total</p>
                                    <p className="text-3xl font-bold text-emerald-700">{formatCurrency(calculateTotal())}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Seção 3: Detalhes Finais */}
                <div className="grid md:grid-cols-3 gap-6">
                    <Card className="border-slate-200">
                        <CardHeader>
                            <CardTitle className="text-sm font-medium text-slate-700 flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                Validade
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Input
                                type="date"
                                value={validUntil}
                                onChange={e => setValidUntil(e.target.value)}
                                className="bg-slate-50"
                            />
                        </CardContent>
                    </Card>

                    <Card className="md:col-span-2 border-slate-200">
                        <CardHeader>
                            <CardTitle className="text-sm font-medium text-slate-700 flex items-center gap-2">
                                <FileText className="h-4 w-4" />
                                Condições e Observações
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Input para adicionar nova */}
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Adicionar condição personalizada..."
                                    value={newConditionRaw}
                                    onChange={e => setNewConditionRaw(e.target.value)}
                                    onKeyDown={e => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault()
                                            addCondition(newConditionRaw)
                                        }
                                    }}
                                    className="bg-slate-50"
                                />
                                <Button
                                    type="button"
                                    onClick={() => addCondition(newConditionRaw)}
                                    variant="outline"
                                    className="border-dashed border-emerald-500 text-emerald-600 hover:bg-emerald-50"
                                >
                                    <Plus className="h-4 w-4 mr-2" /> Adicionar
                                </Button>
                                <Button
                                    type="button"
                                    onClick={handleSaveFavorite}
                                    variant="ghost"
                                    title="Salvar como Favorito"
                                    className="text-amber-500 hover:text-amber-600 hover:bg-amber-50"
                                >
                                    <Star className="h-5 w-5" />
                                </Button>
                            </div>

                            {/* Sugestões (Chips) */}
                            <div className="flex flex-wrap gap-2">
                                {presets.map((preset) => (
                                    <div key={preset.id} className="inline-flex items-center bg-slate-100 rounded-full border border-slate-200 hover:border-emerald-200 transition-colors group/chip">
                                        <button
                                            type="button"
                                            onClick={() => addCondition(preset.content)}
                                            className="text-xs px-3 py-1.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-l-full"
                                        >
                                            + {preset.content}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                e.preventDefault()
                                                removePreset(preset.id)
                                            }}
                                            className="px-2 py-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-r-full transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
                                            title="Remover favorito"
                                            aria-label={`Remover favorito ${preset.content}`}
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </div>
                                ))}
                                {presets.length === 0 && (
                                    <span className="text-xs text-muted-foreground italic">Nenhum favorito salvo. Adicione um novo e clique na estrela!</span>
                                )}
                            </div>

                            {/* Lista Atual */}
                            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-2">
                                {conditionsList.length === 0 && (
                                    <p className="text-sm text-muted-foreground text-center py-2">Nenhuma condição adicionada.</p>
                                )}
                                {conditionsList.map((cond, idx) => (
                                    <div key={idx} className="flex items-start gap-2 group">
                                        <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                                        <span className="text-sm text-slate-700 flex-1">{cond}</span>
                                        <button
                                            onClick={() => removeCondition(idx)}
                                            className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-0.5"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Botões Finais */}
                <div className="flex items-center justify-end gap-4 pt-4 pb-12">
                    <Button
                        variant="outline"
                        onClick={() => router.back()}
                        className="h-12 px-8 rounded-xl border-slate-200 hover:bg-slate-50"
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={isSaving || items.length === 0}
                        className="h-12 px-8 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-lg shadow-emerald-500/25 text-white font-medium"
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Salvando...
                            </>
                        ) : (
                            <>
                                <Check className="mr-2 h-4 w-4" />
                                Finalizar Orçamento
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    )
}
