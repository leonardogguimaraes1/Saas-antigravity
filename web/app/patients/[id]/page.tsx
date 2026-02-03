import { createTenantServerClient } from "@/lib/supabase/tenant-server"
import { notFound } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ClinicalHistory } from "@/components/patients/clinical-history"
import { BudgetList } from "@/components/patients/budget-list"
import { Calendar, DollarSign, FileText } from "lucide-react"

interface PatientDetailPageProps {
    params: Promise<{
        id: string
    }>
}

async function getPatient(id: string) {
    const supabase = await createTenantServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { data, error } = await supabase
        .from("patients")
        .select("*")
        .eq("id", id)
        .single()

    if (error || !data) {
        return null
    }

    return data
}

export default async function PatientDetailPage({ params }: PatientDetailPageProps) {
    const { id } = await params
    const patient = await getPatient(id)

    if (!patient) {
        notFound()
    }

    return (
        <div className="flex flex-col gap-6">
            {/* Header */}
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">{patient.full_name}</h1>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Cadastrado em {new Date(patient.created_at).toLocaleDateString("pt-BR")}
                    </span>
                    {/* Future: Add labels like "Active", "Debtor", etc. */}
                </div>
            </div>

            {/* Main Content */}
            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="overview">Visão Geral</TabsTrigger>
                    <TabsTrigger value="anamnese">Anamnese</TabsTrigger>
                    <TabsTrigger value="budgets">Orçamentos</TabsTrigger>
                    <TabsTrigger value="certificates">Atestados</TabsTrigger>
                    <TabsTrigger value="documents">Documentos</TabsTrigger>
                </TabsList>

                <TabsContent value="overview">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    Dados de Contato
                                </CardTitle>
                                <div className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-sm mt-2">
                                    <p><strong>Email:</strong> {patient.contact_email || "-"}</p>
                                    <p><strong>Telefone:</strong> {patient.contact_phone || "-"}</p>
                                    <p><strong>CPF/RG:</strong> {patient.document_id || "-"}</p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    Status Financeiro
                                </CardTitle>
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">R$ 0,00</div>
                                <p className="text-xs text-muted-foreground">
                                    Nenhum orçamento pendente
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    Registros
                                </CardTitle>
                                <FileText className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">0</div>
                                <p className="text-xs text-muted-foreground">
                                    Anamneses registradas
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="anamnese">
                    <ClinicalHistory patientId={patient.id} filterType="anamnesis" />
                </TabsContent>

                <TabsContent value="budgets">
                    <BudgetList patient={patient} />
                </TabsContent>

                <TabsContent value="certificates">
                    <ClinicalHistory patientId={patient.id} filterType="certificate" />
                </TabsContent>

                <TabsContent value="documents">
                    <div className="flex items-center justify-center h-40 border rounded-lg border-dashed text-muted-foreground">
                        Área de Documentos em construção...
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}
