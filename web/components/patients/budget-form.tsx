"use client"

import { useState, useEffect } from "react"
import { createTenantClient } from "@/lib/supabase/tenant-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"
import { FileText, Plus, Trash2, Loader2, Calculator } from "lucide-react"

interface Patient {
    id: string
    full_name: string
    contact_email?: string
    contact_phone?: string
    document_id?: string
}

export interface BudgetFormProps {
    patient: Patient
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
    existingBudget?: any // Para edição no futuro
}

interface BudgetItem {
    id: string
    procedimento: string
    dente: string // ex: "11", "Todos", "Sup"
    valor: number
    desconto: number // %
}

export function BudgetForm({ patient, isOpen, onClose, onSuccess, existingBudget }: BudgetFormProps) {
    const [isLoading, setIsLoading] = useState(false)

    // Items do orçamento
    const [items, setItems] = useState<BudgetItem[]>([])

    // Novo item sendo adicionado
    const [newItem, setNewItem] = useState<Partial<BudgetItem>>({
        procedimento: "",
        dente: "",
        valor: 0,
        desconto: 0
    })

    // Condições e Observações
    const [conditions, setConditions] = useState(
        "• Orçamento válido por 30 dias\n• Valores sujeitos a alteração conforme diagnóstico\n• Formas de pagamento: Dinheiro, PIX, Cartão de Crédito/Débito"
    )
    const [validUntil, setValidUntil] = useState<string>("")

    // Define data de validade padrão (30 dias) ao abrir
    useEffect(() => {
        if (isOpen && !existingBudget) {
            const date = new Date()
            date.setDate(date.getDate() + 30)
            setValidUntil(date.toISOString().split('T')[0])
            setItems([])
        }
    }, [isOpen, existingBudget])

    const supabase = createTenantClient()

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

        setIsLoading(true)
        try {
            const totalValue = calculateTotal()

            // Gerar número de orçamento (simples timestamp por enquanto, ideal seria sequence)
            const budgetNumber = Math.floor(Date.now() / 1000).toString().slice(-8)

            const budgetData = {
                patient_id: patient.id,
                status: 'draft',
                total_value: totalValue,
                items: items, // JSONB
                valid_until: validUntil,
                conditions: conditions, // Novo campo
                // Additional Metadata in JSONB if needed? 
                // Currently 'budgets' table schema: id, patient_id, status, total_value, items, valid_until, created_at...
                // And I added 'conditions' and 'discount' column in migration 002.
            }

            const { error } = await supabase
                .from("budgets")
                .insert(budgetData)

            if (error) throw error

            onSuccess()
            onClose()
        } catch (error) {
            console.error("Erro ao salvar orçamento:", error)
            alert("Erro ao salvar orçamento. Tente novamente.")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
                <SheetHeader className="mb-6">
                    <SheetTitle className="flex items-center gap-2 text-2xl">
                        <FileText className="h-6 w-6 text-emerald-600" />
                        Novo Orçamento
                    </SheetTitle>
                    <p className="text-sm text-muted-foreground">
                        Crie uma proposta de tratamento para {patient.full_name}
                    </p>
                </SheetHeader>

                <div className="space-y-6">
                    {/* Seção 1: Adicionar Procedimentos */}
                    <Card className="border-emerald-100 bg-gradient-to-br from-emerald-50/50 to-white">
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-lg text-emerald-700">
                                <Calculator className="h-5 w-5" />
                                Adicionar Procedimento
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-12 gap-3">
                                <div className="col-span-12 md:col-span-5">
                                    <Label className="text-xs text-muted-foreground">Procedimento</Label>
                                    <Input
                                        placeholder="Ex: Limpeza, Restauração..."
                                        value={newItem.procedimento}
                                        onChange={e => setNewItem({ ...newItem, procedimento: e.target.value })}
                                    />
                                </div>
                                <div className="col-span-3 md:col-span-2">
                                    <Label className="text-xs text-muted-foreground">Dente(s)</Label>
                                    <Input
                                        placeholder="11, 21"
                                        value={newItem.dente}
                                        onChange={e => setNewItem({ ...newItem, dente: e.target.value })}
                                    />
                                </div>
                                <div className="col-span-5 md:col-span-3">
                                    <Label className="text-xs text-muted-foreground">Valor (R$)</Label>
                                    <Input
                                        type="number"
                                        placeholder="0,00"
                                        value={newItem.valor || ""}
                                        onChange={e => setNewItem({ ...newItem, valor: parseFloat(e.target.value) })}
                                    />
                                </div>
                                <div className="col-span-4 md:col-span-2">
                                    <Label className="text-xs text-muted-foreground">Desc (%)</Label>
                                    <Input
                                        type="number"
                                        placeholder="0"
                                        value={newItem.desconto || ""}
                                        onChange={e => setNewItem({ ...newItem, desconto: parseFloat(e.target.value) })}
                                    />
                                </div>
                            </div>
                            <Button onClick={addItem} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white" size="sm">
                                <Plus className="h-4 w-4 mr-2" /> Adicionar Item
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Seção 2: Lista de Itens */}
                    {items.length > 0 && (
                        <Card>
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Procedimento</TableHead>
                                            <TableHead className="w-[80px]">Dente</TableHead>
                                            <TableHead className="text-right">Valor</TableHead>
                                            <TableHead className="text-right">Total</TableHead>
                                            <TableHead className="w-[50px]"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {items.map((item) => (
                                            <TableRow key={item.id}>
                                                <TableCell className="font-medium">{item.procedimento}</TableCell>
                                                <TableCell>{item.dente}</TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex flex-col">
                                                        <span>{formatCurrency(item.valor)}</span>
                                                        {item.desconto > 0 && <span className="text-xs text-green-600">-{item.desconto}%</span>}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right font-bold">
                                                    {formatCurrency(item.valor * (1 - item.desconto / 100))}
                                                </TableCell>
                                                <TableCell>
                                                    <Button variant="ghost" size="icon" onClick={() => removeItem(item.id)} className="h-8 w-8 text-red-500">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                                <div className="flex justify-end p-4 bg-muted/20">
                                    <div className="text-right">
                                        <p className="text-sm text-muted-foreground">Valor Total</p>
                                        <p className="text-2xl font-bold text-emerald-700">{formatCurrency(calculateTotal())}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Seção 3: Condições e Validade */}
                    <Card>
                        <CardContent className="pt-6 space-y-4">
                            <div>
                                <Label>Validade da Proposta</Label>
                                <Input
                                    type="date"
                                    value={validUntil}
                                    onChange={e => setValidUntil(e.target.value)}
                                    className="max-w-[200px]"
                                />
                            </div>
                            <div>
                                <Label>Condições de Pagamento e Observações</Label>
                                <Textarea
                                    value={conditions}
                                    onChange={e => setConditions(e.target.value)}
                                    rows={5}
                                    className="mt-1"
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                    Estas informações aparecerão no rodapé do PDF.
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Botões */}
                    <div className="flex gap-3 pt-4">
                        <Button variant="outline" onClick={onClose} className="flex-1">
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={isLoading || items.length === 0}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Salvando...
                                </>
                            ) : (
                                "Salvar Orçamento"
                            )}
                        </Button>
                    </div>

                </div>
            </SheetContent>
        </Sheet>
    )
}
