"use client"

import { useState } from "react"
import { createTenantClient } from "@/lib/supabase/tenant-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { User, Heart, Stethoscope, FileSignature, Loader2, Download } from "lucide-react"

interface Patient {
    id: string
    full_name: string
    contact_email?: string
    contact_phone?: string
    document_id?: string
    birth_date?: string
}

interface AnamneseFormProps {
    patient: Patient
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
}

// Condições médicas para o formulário
const medicalConditions = [
    { id: "tratamento_medico", label: "Tratamento médico?" },
    { id: "cirurgia_recente", label: "Cirurgia recente?" },
    { id: "problema_pele", label: "Problema de pele?" },
    { id: "doenca_infectocontagiosa", label: "Doença infectocontagiosa?" },
    { id: "cancer", label: "Câncer?" },
    { id: "disturbio_circulatorio", label: "Distúrbio circulatório?" },
    { id: "uso_drogas", label: "Uso de drogas?" },
    { id: "efeito_alcool", label: "Sob efeito de álcool?" },
    { id: "dormiu_ontem", label: "Dormiu ontem?" },
    { id: "em_jejum", label: "Em jejum?" },
    { id: "anemia", label: "Anemia?" },
    { id: "queloide", label: "Quelóide?" },
    { id: "vitiligo", label: "Vitiligo?" },
    { id: "diabetes", label: "Diabetes?" },
    { id: "alergia_medicamentos", label: "Alergia a medicamentos?" },
    { id: "depressao_ansiedade", label: "Depressão/ansiedade?" },
    { id: "convulsoes_epilepsia", label: "Convulsões/epilepsia?" },
    { id: "cardiopatia", label: "Cardiopatia?" },
    { id: "hipertensao", label: "Hipertensão?" },
    { id: "hipotensao", label: "Hipotensão?" },
    { id: "marcapasso", label: "Marcapasso?" },
    { id: "hemofilia", label: "Hemofilia?" },
    { id: "hepatite", label: "Hepatite?" },
    { id: "gestante", label: "Gestante?" },
    { id: "amamentando", label: "Amamentando?" },
]

const bloodTypes = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]

export function AnamneseForm({ patient, isOpen, onClose, onSuccess }: AnamneseFormProps) {
    const [isLoading, setIsLoading] = useState(false)

    // Estados do formulário
    const [comoConheceu, setComoConheceu] = useState("")
    const [conditions, setConditions] = useState<Record<string, boolean>>({})
    const [tipoSanguineo, setTipoSanguineo] = useState("")
    const [dentesSelec, setDentesSelec] = useState("")
    const [observacoes, setObservacoes] = useState("")
    const [declaracaoAceita, setDeclaracaoAceita] = useState(false)

    const supabase = createTenantClient()

    const handleConditionChange = (id: string, checked: boolean) => {
        setConditions(prev => ({ ...prev, [id]: checked }))
    }

    const calculateAge = (birthDate: string) => {
        if (!birthDate) return null
        const today = new Date()
        const birth = new Date(birthDate)
        let age = today.getFullYear() - birth.getFullYear()
        const monthDiff = today.getMonth() - birth.getMonth()
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--
        }
        return age
    }

    const handleSubmit = async () => {
        if (!declaracaoAceita) {
            alert("Você precisa aceitar a declaração para continuar.")
            return
        }

        setIsLoading(true)
        try {
            const content = {
                dadosPaciente: {
                    nome: patient.full_name,
                    dataNascimento: patient.birth_date,
                    idade: calculateAge(patient.birth_date || ""),
                    cpf: patient.document_id,
                    telefone: patient.contact_phone,
                    email: patient.contact_email,
                    comoConheceu,
                },
                avaliacaoMedica: {
                    ...conditions,
                    tipoSanguineo,
                },
                tratamento: {
                    dentesSelec,
                    observacoes,
                },
                assinatura: {
                    declaracaoAceita,
                    dataCriacao: new Date().toISOString(),
                }
            }

            const { error } = await supabase
                .from("clinical_records")
                .insert({
                    patient_id: patient.id,
                    type: "anamnesis",
                    title: `Anamnese - ${new Date().toLocaleDateString("pt-BR")}`,
                    content,
                })

            if (error) throw error

            onSuccess()
            onClose()
            resetForm()
        } catch (error) {
            console.error("Erro ao salvar anamnese:", error)
            alert("Erro ao salvar anamnese. Tente novamente.")
        } finally {
            setIsLoading(false)
        }
    }

    const resetForm = () => {
        setComoConheceu("")
        setConditions({})
        setTipoSanguineo("")
        setDentesSelec("")
        setObservacoes("")
        setDeclaracaoAceita(false)
    }

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
                <SheetHeader className="mb-6">
                    <SheetTitle className="flex items-center gap-2 text-2xl">
                        <Stethoscope className="h-6 w-6 text-blue-600" />
                        Anamnese Odontológica
                    </SheetTitle>
                    <p className="text-sm text-muted-foreground">
                        Preencha todos os campos para gerar o documento
                    </p>
                </SheetHeader>

                <div className="space-y-6">
                    {/* Seção 1: Dados do Paciente */}
                    <Card className="border-blue-100 bg-gradient-to-br from-blue-50/50 to-white">
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-lg text-blue-700">
                                <User className="h-5 w-5" />
                                Dados do Paciente
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <Label className="text-xs text-muted-foreground">Nome</Label>
                                    <p className="font-medium">{patient.full_name}</p>
                                </div>
                                <div>
                                    <Label className="text-xs text-muted-foreground">Data Nasc.</Label>
                                    <p className="font-medium">
                                        {patient.birth_date
                                            ? `${new Date(patient.birth_date).toLocaleDateString("pt-BR")} (${calculateAge(patient.birth_date)} anos)`
                                            : "-"
                                        }
                                    </p>
                                </div>
                                <div>
                                    <Label className="text-xs text-muted-foreground">CPF/RG</Label>
                                    <p className="font-medium">{patient.document_id || "-"}</p>
                                </div>
                                <div>
                                    <Label className="text-xs text-muted-foreground">Telefone</Label>
                                    <p className="font-medium">{patient.contact_phone || "-"}</p>
                                </div>
                                <div>
                                    <Label className="text-xs text-muted-foreground">Email</Label>
                                    <p className="font-medium">{patient.contact_email || "-"}</p>
                                </div>
                            </div>
                            <Separator />
                            <div>
                                <Label htmlFor="comoConheceu">Como nos conheceu?</Label>
                                <Select value={comoConheceu} onValueChange={setComoConheceu}>
                                    <SelectTrigger id="comoConheceu" className="mt-1">
                                        <SelectValue placeholder="Selecione..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="instagram">Instagram</SelectItem>
                                        <SelectItem value="facebook">Facebook</SelectItem>
                                        <SelectItem value="google">Google</SelectItem>
                                        <SelectItem value="indicacao">Indicação</SelectItem>
                                        <SelectItem value="passando_frente">Passando em frente</SelectItem>
                                        <SelectItem value="outro">Outro</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Seção 2: Avaliação Médica */}
                    <Card className="border-rose-100 bg-gradient-to-br from-rose-50/50 to-white">
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-lg text-rose-700">
                                <Heart className="h-5 w-5" />
                                Avaliação Médica
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                                {medicalConditions.map((condition) => (
                                    <div key={condition.id} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={condition.id}
                                            checked={conditions[condition.id] || false}
                                            onCheckedChange={(checked) =>
                                                handleConditionChange(condition.id, checked as boolean)
                                            }
                                        />
                                        <Label
                                            htmlFor={condition.id}
                                            className="text-sm font-normal cursor-pointer"
                                        >
                                            {condition.label}
                                        </Label>
                                    </div>
                                ))}
                            </div>
                            <Separator className="my-4" />
                            <div className="w-1/2">
                                <Label htmlFor="tipoSanguineo">Tipo Sanguíneo</Label>
                                <Select value={tipoSanguineo} onValueChange={setTipoSanguineo}>
                                    <SelectTrigger id="tipoSanguineo" className="mt-1">
                                        <SelectValue placeholder="Selecione..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {bloodTypes.map(type => (
                                            <SelectItem key={type} value={type}>{type}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Seção 3: Tratamento */}
                    <Card className="border-emerald-100 bg-gradient-to-br from-emerald-50/50 to-white">
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-lg text-emerald-700">
                                <Stethoscope className="h-5 w-5" />
                                Tratamento
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label htmlFor="dentesSelec">Dentes Selecionados</Label>
                                <Input
                                    id="dentesSelec"
                                    placeholder="Ex: 11, 21, 36..."
                                    value={dentesSelec}
                                    onChange={(e) => setDentesSelec(e.target.value)}
                                    className="mt-1"
                                />
                            </div>
                            <div>
                                <Label htmlFor="observacoes">Observações Gerais</Label>
                                <Textarea
                                    id="observacoes"
                                    placeholder="Anotações adicionais sobre o tratamento..."
                                    value={observacoes}
                                    onChange={(e) => setObservacoes(e.target.value)}
                                    className="mt-1 min-h-[80px]"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Seção 4: Declaração */}
                    <Card className="border-amber-100 bg-gradient-to-br from-amber-50/50 to-white">
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-lg text-amber-700">
                                <FileSignature className="h-5 w-5" />
                                Declaração
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                Declaro que as informações acima prestadas são verdadeiras e assumo
                                total responsabilidade pelas mesmas, estando ciente de que a omissão
                                de qualquer informação pode comprometer o meu tratamento.
                            </p>
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="declaracao"
                                    checked={declaracaoAceita}
                                    onCheckedChange={(checked) => setDeclaracaoAceita(checked as boolean)}
                                />
                                <Label htmlFor="declaracao" className="cursor-pointer">
                                    Li e concordo com a declaração acima
                                </Label>
                            </div>
                            <div className="pt-2 text-sm text-muted-foreground">
                                <strong>Data:</strong> {new Date().toLocaleDateString("pt-BR")}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Botões de ação */}
                    <div className="flex gap-3 pt-4">
                        <Button
                            variant="outline"
                            onClick={onClose}
                            className="flex-1"
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={isLoading || !declaracaoAceita}
                            className="flex-1 bg-blue-600 hover:bg-blue-700"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Salvando...
                                </>
                            ) : (
                                "Salvar Anamnese"
                            )}
                        </Button>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    )
}
