import { createTenantServerClient } from "@/lib/supabase/tenant-server"
import { PatientTable } from "@/components/patients/patient-table"
import { Patient } from "@/components/patients/patient-table"

async function getPatients(): Promise<Patient[]> {
    const supabase = await createTenantServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { data, error } = await supabase
        .from("patients")
        .select("id, full_name, document_id, contact_phone, created_at")
        .order("created_at", { ascending: false })

    if (error) {
        console.error("Error fetching patients:", error)
        return []
    }

    // Map to UI model
    return data.map((p) => ({
        id: p.id,
        fullName: p.full_name,
        documentId: p.document_id || "-",
        contactPhone: p.contact_phone || "-",
        lastVisit: new Date(p.created_at).toLocaleDateString("pt-BR"), // Using created_at as proxy for now
        status: "active",
    }))
}

export default async function PatientsDataWrapper() {
    const patients = await getPatients()
    return <PatientTable initialData={patients} />
}
