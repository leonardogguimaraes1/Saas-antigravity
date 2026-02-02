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
    Loader2
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
]

export default function NewAnamnesePage({ params }: { params: Promise<{ id: string }> }) {
    const { id: patientId } = use(params)
    const router = useRouter()
    const supabase = createTenantClient()

    const [patient, setPatient] = useState<Patient | null>(null)
    const [currentStep, setCurrentStep] = useState(1)
    const [isLoading, setIsLoading] = useState(false)
    const [isSaving, setIsSaving] = useState(false)

    // Form data
    const [patientFormData, setPatientFormData] = useState({
        full_name: "",
        birth_date: "",
        document_id: "",
        contact_phone: "",
        contact_email: ""
    })
    const [comoConheceu, setComoConheceu] = useState("")
    const [conditions, setConditions] = useState<Record<string, boolean>>({})
    const [tipoSanguineo, setTipoSanguineo] = useState("")
    const [procedureName, setProcedureName] = useState("")
    const [dentesSelec, setDentesSelec] = useState("")
    const [observacoes, setObservacoes] = useState("")


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
                setPatientFormData({
                    full_name: data.full_name || "",
                    birth_date: data.birth_date || "",
                    document_id: data.document_id || "",
                    contact_phone: data.contact_phone || "",
                    contact_email: data.contact_email || ""
                })
            }
            setIsLoading(false)
        }
        fetchPatient()
    }, [patientId])

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
        if (!patient) return

        setIsSaving(true)
        try {
            const content = {
                dadosPaciente: {
                    nome: patientFormData.full_name,
                    dataNascimento: patientFormData.birth_date,
                    idade: calculateAge(patientFormData.birth_date || ""),
                    cpf: patientFormData.document_id,
                    telefone: patientFormData.contact_phone,
                    email: patientFormData.contact_email,
                    comoConheceu,
                },
                avaliacaoMedica: {
                    ...conditions,
                    tipoSanguineo,
                },
                tratamento: {
                    nomeProcedimento: procedureName,
                    dentesSelec,
                    observacoes,
                },
                assinatura: {
                    declaracaoAceita: true,
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

            router.push(`/patients/${patientId}?tab=anamnese`)
        } catch (error) {
            console.error("Erro ao salvar anamnese:", error)
            alert("Erro ao salvar anamnese. Tente novamente.")
        } finally {
            setIsSaving(false)
        }
    }

    const nextStep = () => {
        if (currentStep < 3) setCurrentStep(currentStep + 1)
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
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
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
                            <h1 className="text-xl font-semibold text-slate-900">
                                Nova Anamnese
                            </h1>
                            <p className="text-sm text-slate-500">{patient.full_name}</p>
                        </div>
                    </div>
                    <div className="text-sm text-slate-500">
                        Etapa {currentStep} de 4
                    </div>
                </div>
            </header>

            {/* Stepper */}
            <div className="max-w-6xl mx-auto px-6 py-8">
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
                                                ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30 scale-110'
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
                                            ${isActive ? 'text-blue-600' : isCompleted ? 'text-emerald-600' : 'text-slate-400'}
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
                                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-100 text-blue-600 mb-4">
                                    <User className="h-8 w-8" />
                                </div>
                                <h2 className="text-2xl font-bold text-slate-900">Dados do Paciente</h2>
                                <p className="text-slate-500 mt-2">Confirme as informações do paciente</p>
                            </div>

                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="md:col-span-2">
                                    <Label htmlFor="full_name" className="text-xs text-slate-500 uppercase tracking-wide mb-1.5 block">Nome Completo</Label>
                                    <Input
                                        id="full_name"
                                        value={patientFormData.full_name}
                                        onChange={(e) => setPatientFormData(prev => ({ ...prev, full_name: e.target.value }))}
                                        className="h-11 bg-slate-50/50 border-slate-200 focus:bg-white transition-all font-medium text-slate-900"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="birth_date" className="text-xs text-slate-500 uppercase tracking-wide mb-1.5 block">Data de Nascimento</Label>
                                    <Input
                                        id="birth_date"
                                        type="date"
                                        value={patientFormData.birth_date ? new Date(patientFormData.birth_date).toISOString().split('T')[0] : ""}
                                        onChange={(e) => setPatientFormData(prev => ({ ...prev, birth_date: e.target.value }))}
                                        className="h-11 bg-slate-50/50 border-slate-200 focus:bg-white transition-all font-medium text-slate-900"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="document_id" className="text-xs text-slate-500 uppercase tracking-wide mb-1.5 block">CPF/RG</Label>
                                    <Input
                                        id="document_id"
                                        value={patientFormData.document_id}
                                        onChange={(e) => setPatientFormData(prev => ({ ...prev, document_id: e.target.value }))}
                                        className="h-11 bg-slate-50/50 border-slate-200 focus:bg-white transition-all font-medium text-slate-900"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="contact_phone" className="text-xs text-slate-500 uppercase tracking-wide mb-1.5 block">Telefone</Label>
                                    <Input
                                        id="contact_phone"
                                        value={patientFormData.contact_phone}
                                        onChange={(e) => setPatientFormData(prev => ({ ...prev, contact_phone: e.target.value }))}
                                        className="h-11 bg-slate-50/50 border-slate-200 focus:bg-white transition-all font-medium text-slate-900"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="contact_email" className="text-xs text-slate-500 uppercase tracking-wide mb-1.5 block">Email</Label>
                                    <Input
                                        id="contact_email"
                                        type="email"
                                        value={patientFormData.contact_email}
                                        onChange={(e) => setPatientFormData(prev => ({ ...prev, contact_email: e.target.value }))}
                                        className="h-11 bg-slate-50/50 border-slate-200 focus:bg-white transition-all font-medium text-slate-900"
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
                                        htmlFor={condition.id}
                                        className={`
                                            flex items-center gap-3 p-4 rounded-xl border-2 transition-all cursor-pointer
                                            ${conditions[condition.id]
                                                ? 'border-blue-500 bg-blue-50'
                                                : 'border-slate-200 hover:border-slate-300 bg-white'
                                            }
                                        `}
                                    >
                                        <Checkbox
                                            id={condition.id}
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
                                    {/* Procedure Name Card */}
                                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mb-8 animate-in slide-in-from-bottom-2 duration-500">
                                        <Label htmlFor="procedureName" className="text-sm font-semibold text-slate-900 uppercase tracking-wide flex items-center gap-2 mb-3">
                                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                            Nome do Procedimento
                                        </Label>
                                        <Input
                                            id="procedureName"
                                            value={procedureName}
                                            onChange={(e) => setProcedureName(e.target.value)}
                                            placeholder="Ex: Restauração em Resina, Profilaxia, Canal..."
                                            className="h-14 text-lg bg-slate-50 border-slate-200 focus:bg-white transition-all placeholder:text-slate-400"
                                        />
                                    </div>

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

                    {currentStep < 3 ? (
                        <Button
                            onClick={nextStep}
                            className="h-12 px-8 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-lg shadow-blue-500/25"
                        >
                            Próximo
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    ) : (
                        <Button
                            onClick={handleSubmit}
                            disabled={isSaving}
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
                                    Salvar Anamnese
                                </>
                            )}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    )
}
