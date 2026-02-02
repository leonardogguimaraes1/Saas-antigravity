"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createTenantClient } from "@/lib/supabase/tenant-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ToothSelector } from "@/components/patients/tooth-selector"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
    ArrowLeft,
    ArrowRight,
    User,
    Heart,
    Stethoscope,
    FileCheck,
    Check,
    Loader2,
    Pencil
} from "lucide-react"
import { use } from "react"

interface Patient {
    id: string
    full_name: string
    contact_email?: string
    contact_phone?: string
    document_id?: string
    birth_date?: string
}

// Condições médicas
const medicalConditions = [
    { id: "tratamento_medico", label: "Tratamento médico?" },
    { id: "cirurgia_recente", label: "Cirurgia recente?" },
    { id: "problema_pele", label: "Problema de pele?" },
    { id: "doenca_infectocontagiosa", label: "Doença infectocontagiosa?" },
    { id: "cancer", label: "Câncer?" },
    { id: "disturbio_circulatorio", label: "Distúrbio circulatório?" },
    { id: "uso_drogas", label: "Uso de drogas?" },
    { id: "efeito_alcool", label: "Sob efeito de álcool?" },
    { id: "dormiu_ontem", label: "Dormiu bem ontem?" },
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

const steps = [
    { id: 1, name: "Dados", icon: User },
    { id: 2, name: "Saúde", icon: Heart },
    { id: 3, name: "Tratamento", icon: Stethoscope },
    { id: 4, name: "Confirmar", icon: FileCheck },
]

export default function EditAnamnesePage({ params }: { params: Promise<{ id: string; recordId: string }> }) {
    const { id: patientId, recordId } = use(params)
    const router = useRouter()
    const supabase = createTenantClient()

    const [patient, setPatient] = useState<Patient | null>(null)
    const [currentStep, setCurrentStep] = useState(1)
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)

    // Form data
    const [comoConheceu, setComoConheceu] = useState("")
    const [conditions, setConditions] = useState<Record<string, boolean>>({})
    const [tipoSanguineo, setTipoSanguineo] = useState("")
    const [dentesSelec, setDentesSelec] = useState("")
    const [observacoes, setObservacoes] = useState("")
    const [declaracaoAceita, setDeclaracaoAceita] = useState(false)

    // Editable patient data
    const [editNome, setEditNome] = useState("")
    const [editTelefone, setEditTelefone] = useState("")
    const [editEmail, setEditEmail] = useState("")
    const [editCpf, setEditCpf] = useState("")
    const [editDataNascimento, setEditDataNascimento] = useState("")

    // Fetch patient and record data
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true)

            // Fetch patient
            const { data: patientData } = await supabase
                .from("patients")
                .select("*")
                .eq("id", patientId)
                .single()

            if (patientData) setPatient(patientData)

            // Fetch existing record
            const { data: recordData } = await supabase
                .from("clinical_records")
                .select("*")
                .eq("id", recordId)
                .single()

            if (recordData?.content) {
                const content = recordData.content
                // Populate form with existing data
                setComoConheceu(content.dadosPaciente?.comoConheceu || "")
                setConditions(content.avaliacaoMedica || {})
                setTipoSanguineo(content.avaliacaoMedica?.tipoSanguineo || "")
                setDentesSelec(content.tratamento?.dentesSelec || "")
                setObservacoes(content.tratamento?.observacoes || "")
                setDeclaracaoAceita(content.assinatura?.declaracaoAceita || false)

                // Populate editable patient data from record (if available) or from patient
                setEditNome(content.dadosPaciente?.nome || patientData?.full_name || "")
                setEditTelefone(content.dadosPaciente?.telefone || patientData?.contact_phone || "")
                setEditEmail(content.dadosPaciente?.email || patientData?.contact_email || "")
                setEditCpf(content.dadosPaciente?.cpf || patientData?.document_id || "")
                setEditDataNascimento(content.dadosPaciente?.dataNascimento || patientData?.birth_date || "")
            } else if (patientData) {
                // No record content, use patient data
                setEditNome(patientData.full_name || "")
                setEditTelefone(patientData.contact_phone || "")
                setEditEmail(patientData.contact_email || "")
                setEditCpf(patientData.document_id || "")
                setEditDataNascimento(patientData.birth_date || "")
            }

            setIsLoading(false)
        }
        fetchData()
    }, [patientId, recordId])

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
        if (!patient || !declaracaoAceita) return

        setIsSaving(true)
        try {
            const content = {
                dadosPaciente: {
                    nome: editNome,
                    dataNascimento: editDataNascimento,
                    idade: calculateAge(editDataNascimento || ""),
                    cpf: editCpf,
                    telefone: editTelefone,
                    email: editEmail,
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
                    dataAtualizacao: new Date().toISOString(),
                }
            }

            const { error } = await supabase
                .from("clinical_records")
                .update({
                    title: `Anamnese - ${new Date().toLocaleDateString("pt-BR")} (Atualizada)`,
                    content,
                })
                .eq("id", recordId)

            if (error) throw error

            router.push(`/patients/${patientId}?tab=anamnese`)
        } catch (error) {
            console.error("Erro ao atualizar anamnese:", error)
            alert("Erro ao atualizar anamnese. Tente novamente.")
        } finally {
            setIsSaving(false)
        }
    }

    const nextStep = () => {
        if (currentStep < 4) setCurrentStep(currentStep + 1)
    }

    const prevStep = () => {
        if (currentStep > 1) setCurrentStep(currentStep - 1)
    }

    if (isLoading || !patient) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    <p className="text-slate-600">Carregando...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-amber-50 to-orange-50">
            {/* Header Fixo */}
            <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/70 border-b border-slate-200/50 shadow-sm">
                <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.back()}
                            className="hover:bg-slate-100"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div>
                            <div className="flex items-center gap-2">
                                <Pencil className="h-4 w-4 text-amber-600" />
                                <h1 className="text-xl font-semibold text-slate-900">
                                    Editar Anamnese
                                </h1>
                            </div>
                            <p className="text-sm text-slate-500">{patient.full_name}</p>
                        </div>
                    </div>
                    <div className="text-sm text-slate-500">
                        Etapa {currentStep} de 4
                    </div>
                </div>
            </header>

            {/* Stepper */}
            <div className="max-w-3xl mx-auto px-6 py-8">
                <div className="flex justify-between items-center mb-12">
                    {steps.map((step, index) => {
                        const Icon = step.icon
                        const isActive = currentStep === step.id
                        const isCompleted = currentStep > step.id

                        return (
                            <div key={step.id} className="flex items-center">
                                <div className="flex flex-col items-center">
                                    <div
                                        className={`
                                            w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300
                                            ${isActive
                                                ? 'bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/30 scale-110'
                                                : isCompleted
                                                    ? 'bg-emerald-500 text-white'
                                                    : 'bg-white text-slate-400 border-2 border-slate-200'
                                            }
                                        `}
                                    >
                                        {isCompleted ? (
                                            <Check className="h-6 w-6" />
                                        ) : (
                                            <Icon className="h-6 w-6" />
                                        )}
                                    </div>
                                    <span
                                        className={`
                                            mt-3 text-sm font-medium transition-colors
                                            ${isActive ? 'text-amber-600' : isCompleted ? 'text-emerald-600' : 'text-slate-400'}
                                        `}
                                    >
                                        {step.name}
                                    </span>
                                </div>
                                {index < steps.length - 1 && (
                                    <div
                                        className={`
                                            w-16 md:w-24 h-1 mx-2 rounded-full transition-colors
                                            ${currentStep > step.id ? 'bg-emerald-500' : 'bg-slate-200'}
                                        `}
                                    />
                                )}
                            </div>
                        )
                    })}
                </div>

                {/* Content Area */}
                <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200/50 p-8 md:p-12">

                    {/* Step 1: Dados do Paciente */}
                    {currentStep === 1 && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="text-center mb-8">
                                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-100 text-amber-600 mb-4">
                                    <User className="h-8 w-8" />
                                </div>
                                <h2 className="text-2xl font-bold text-slate-900">Dados do Paciente</h2>
                                <p className="text-slate-500 mt-2">Edite as informações do paciente</p>
                            </div>

                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="md:col-span-2">
                                    <Label htmlFor="editNome" className="text-sm font-medium text-slate-700">
                                        Nome Completo
                                    </Label>
                                    <Input
                                        id="editNome"
                                        placeholder="Nome completo do paciente"
                                        value={editNome}
                                        onChange={(e) => setEditNome(e.target.value)}
                                        className="mt-2 h-12 rounded-xl border-slate-200"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="editDataNascimento" className="text-sm font-medium text-slate-700">
                                        Data de Nascimento
                                    </Label>
                                    <Input
                                        id="editDataNascimento"
                                        type="date"
                                        value={editDataNascimento}
                                        onChange={(e) => setEditDataNascimento(e.target.value)}
                                        className="mt-2 h-12 rounded-xl border-slate-200"
                                    />
                                    {editDataNascimento && (
                                        <p className="text-xs text-slate-500 mt-1">
                                            Idade: {calculateAge(editDataNascimento)} anos
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <Label htmlFor="editCpf" className="text-sm font-medium text-slate-700">
                                        CPF/RG
                                    </Label>
                                    <Input
                                        id="editCpf"
                                        placeholder="000.000.000-00"
                                        value={editCpf}
                                        onChange={(e) => setEditCpf(e.target.value)}
                                        className="mt-2 h-12 rounded-xl border-slate-200"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="editTelefone" className="text-sm font-medium text-slate-700">
                                        Telefone
                                    </Label>
                                    <Input
                                        id="editTelefone"
                                        placeholder="(00) 00000-0000"
                                        value={editTelefone}
                                        onChange={(e) => setEditTelefone(e.target.value)}
                                        className="mt-2 h-12 rounded-xl border-slate-200"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="editEmail" className="text-sm font-medium text-slate-700">
                                        Email
                                    </Label>
                                    <Input
                                        id="editEmail"
                                        type="email"
                                        placeholder="email@exemplo.com"
                                        value={editEmail}
                                        onChange={(e) => setEditEmail(e.target.value)}
                                        className="mt-2 h-12 rounded-xl border-slate-200"
                                    />
                                </div>
                            </div>

                            <div className="pt-4">
                                <Label htmlFor="comoConheceu" className="text-sm font-medium text-slate-700">
                                    Como nos conheceu?
                                </Label>
                                <Select value={comoConheceu} onValueChange={setComoConheceu}>
                                    <SelectTrigger className="mt-2 h-12 rounded-xl border-slate-200">
                                        <SelectValue placeholder="Selecione uma opção..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="instagram">Instagram</SelectItem>
                                        <SelectItem value="facebook">Facebook</SelectItem>
                                        <SelectItem value="google">Google</SelectItem>
                                        <SelectItem value="indicacao">Indicação de amigo/familiar</SelectItem>
                                        <SelectItem value="passando_frente">Passando em frente</SelectItem>
                                        <SelectItem value="outro">Outro</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Avaliação Médica */}
                    {currentStep === 2 && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="text-center mb-8">
                                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-rose-100 text-rose-600 mb-4">
                                    <Heart className="h-8 w-8" />
                                </div>
                                <h2 className="text-2xl font-bold text-slate-900">Avaliação Médica</h2>
                                <p className="text-slate-500 mt-2">Marque as condições que se aplicam</p>
                            </div>

                            <div className="grid md:grid-cols-2 gap-3">
                                {medicalConditions.map((condition) => (
                                    <label
                                        key={condition.id}
                                        htmlFor={`edit-${condition.id}`}
                                        className={`
                                            flex items-center gap-3 p-4 rounded-xl border-2 transition-all cursor-pointer
                                            ${conditions[condition.id]
                                                ? 'border-amber-500 bg-amber-50'
                                                : 'border-slate-200 hover:border-slate-300 bg-white'
                                            }
                                        `}
                                    >
                                        <Checkbox
                                            id={`edit-${condition.id}`}
                                            checked={conditions[condition.id] || false}
                                            onCheckedChange={(checked) =>
                                                handleConditionChange(condition.id, checked as boolean)
                                            }
                                            className="h-5 w-5"
                                        />
                                        <span className="text-sm font-medium text-slate-700">
                                            {condition.label}
                                        </span>
                                    </label>
                                ))}
                            </div>

                            <div className="pt-4">
                                <Label htmlFor="tipoSanguineo" className="text-sm font-medium text-slate-700">
                                    Tipo Sanguíneo
                                </Label>
                                <Select value={tipoSanguineo} onValueChange={setTipoSanguineo}>
                                    <SelectTrigger className="mt-2 h-12 rounded-xl border-slate-200 w-48">
                                        <SelectValue placeholder="Selecione..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {bloodTypes.map(type => (
                                            <SelectItem key={type} value={type}>{type}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Tratamento */}
                    {currentStep === 3 && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="text-center mb-8">
                                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 mb-4">
                                    <Stethoscope className="h-8 w-8" />
                                </div>
                                <h2 className="text-2xl font-bold text-slate-900">Tratamento</h2>
                                <p className="text-slate-500 mt-2">Informações sobre o procedimento</p>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <Label htmlFor="dentesSelec" className="text-sm font-medium text-slate-700">
                                        Dentes Selecionados para Tratamento
                                    </Label>
                                    <div className="mb-6">
                                        <ToothSelector
                                            selectedTeeth={dentesSelec ? dentesSelec.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n)) : []}
                                            onSelectionChange={(teeth) => setDentesSelec(teeth.join(', '))}
                                        />
                                    </div>
                                    <div className="hidden">
                                        <Label htmlFor="dentesSelec" className="text-sm font-medium text-slate-700">
                                            Dentes Selecionados (Texto)
                                        </Label>
                                        <Input
                                            id="dentesSelec"
                                            value={dentesSelec}
                                            readOnly
                                            className="mt-2 h-12 rounded-xl border-slate-200 bg-slate-50"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <Label htmlFor="observacoes" className="text-sm font-medium text-slate-700">
                                        Observações Gerais
                                    </Label>
                                    <Textarea
                                        id="observacoes"
                                        placeholder="Anotações adicionais sobre o tratamento, queixas do paciente, histórico relevante..."
                                        value={observacoes}
                                        onChange={(e) => setObservacoes(e.target.value)}
                                        className="mt-2 min-h-[160px] rounded-xl border-slate-200 resize-none"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 4: Confirmação */}
                    {currentStep === 4 && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="text-center mb-8">
                                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-100 text-amber-600 mb-4">
                                    <FileCheck className="h-8 w-8" />
                                </div>
                                <h2 className="text-2xl font-bold text-slate-900">Confirmação</h2>
                                <p className="text-slate-500 mt-2">Revise e confirme as alterações</p>
                            </div>

                            <div className="space-y-4">
                                <div className="p-6 bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl">
                                    <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                                        <User className="h-4 w-4 text-amber-600" />
                                        Paciente
                                    </h3>
                                    <p className="text-slate-700">{editNome}</p>
                                    <p className="text-sm text-slate-500">{editTelefone} • {editEmail}</p>
                                </div>

                                <div className="p-6 bg-gradient-to-br from-rose-50 to-rose-100 rounded-2xl">
                                    <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                                        <Heart className="h-4 w-4 text-rose-600" />
                                        Condições Marcadas
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        {Object.entries(conditions)
                                            .filter(([key, v]) => v && key !== 'tipoSanguineo')
                                            .map(([key]) => {
                                                const condition = medicalConditions.find(c => c.id === key)
                                                return (
                                                    <span
                                                        key={key}
                                                        className="px-3 py-1 bg-white rounded-full text-sm text-rose-700 border border-rose-200"
                                                    >
                                                        {condition?.label.replace("?", "")}
                                                    </span>
                                                )
                                            })}
                                        {Object.entries(conditions).filter(([k, v]) => v && k !== 'tipoSanguineo').length === 0 && (
                                            <span className="text-sm text-slate-500">Nenhuma condição marcada</span>
                                        )}
                                    </div>
                                    {tipoSanguineo && (
                                        <p className="mt-3 text-sm text-slate-700">
                                            <strong>Tipo Sanguíneo:</strong> {tipoSanguineo}
                                        </p>
                                    )}
                                </div>

                                {(dentesSelec || observacoes) && (
                                    <div className="p-6 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl">
                                        <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                                            <Stethoscope className="h-4 w-4 text-emerald-600" />
                                            Tratamento
                                        </h3>
                                        {dentesSelec && <p className="text-slate-700"><strong>Dentes:</strong> {dentesSelec}</p>}
                                        {observacoes && <p className="text-sm text-slate-600 mt-2">{observacoes}</p>}
                                    </div>
                                )}
                            </div>

                            {/* Declaração */}
                            <div className="p-6 bg-amber-50 border-2 border-amber-200 rounded-2xl">
                                <p className="text-sm text-slate-700 leading-relaxed mb-4">
                                    Declaro que as informações acima prestadas são verdadeiras e assumo
                                    total responsabilidade pelas mesmas, estando ciente de que a omissão
                                    de qualquer informação pode comprometer o meu tratamento.
                                </p>
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <Checkbox
                                        id="declaracao-edit"
                                        checked={declaracaoAceita}
                                        onCheckedChange={(checked) => setDeclaracaoAceita(checked as boolean)}
                                        className="h-5 w-5"
                                    />
                                    <span className="font-medium text-slate-900">
                                        Li e concordo com a declaração acima
                                    </span>
                                </label>
                            </div>

                            <p className="text-center text-sm text-slate-500">
                                Atualização: {new Date().toLocaleDateString("pt-BR")}
                            </p>
                        </div>
                    )}
                </div>

                {/* Navigation Buttons */}
                <div className="flex justify-between mt-8">
                    <Button
                        variant="outline"
                        onClick={prevStep}
                        disabled={currentStep === 1}
                        className="h-12 px-6 rounded-xl"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Anterior
                    </Button>

                    {currentStep < 4 ? (
                        <Button
                            onClick={nextStep}
                            className="h-12 px-8 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 shadow-lg shadow-amber-500/25"
                        >
                            Próximo
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    ) : (
                        <Button
                            onClick={handleSubmit}
                            disabled={!declaracaoAceita || isSaving}
                            className="h-12 px-8 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-lg shadow-emerald-500/25"
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Salvando...
                                </>
                            ) : (
                                <>
                                    <Check className="mr-2 h-4 w-4" />
                                    Salvar Alterações
                                </>
                            )}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    )
}
