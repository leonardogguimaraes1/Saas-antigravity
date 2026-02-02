"use server"

import { createTenantServerClient } from "@/lib/supabase/tenant-server"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const formSchema = z.object({
    fullName: z.string().min(2),
    documentId: z.string().min(1),
    contactPhone: z.string().min(1),
    contactEmail: z.string().email(),
})

export async function createPatientAction(prevState: any, formData: FormData) {
    const validatedFields = formSchema.safeParse({
        fullName: formData.get("fullName"),
        documentId: formData.get("documentId"),
        contactPhone: formData.get("contactPhone"),
        contactEmail: formData.get("contactEmail"),
    })

    if (!validatedFields.success) {
        return {
            success: false,
            message: "Dados inválidos. Verifique os campos.",
            errors: validatedFields.error.flatten().fieldErrors,
        }
    }

    const { fullName, documentId, contactPhone, contactEmail } = validatedFields.data

    // 1. Initialize Supabase Client (Data Plane)
    // In a real multi-tenant app, we would resolve these credentials dynamically based on the logged-in user's organization.
    // For V1 MVP (Admin Hardcoded), we use the env vars directly.
    const supabase = await createTenantServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // 2. Insert Data
    const { error } = await supabase.from("patients").insert({
        full_name: fullName,
        document_id: documentId,
        contact_phone: contactPhone,
        contact_email: contactEmail,
    })

    if (error) {
        console.error("Supabase Error:", error)
        return {
            success: false,
            message: "Erro ao salvar no banco de dados.",
        }
    }

    // 3. Revalidate List
    revalidatePath("/patients")

    return {
        success: true,
        message: "Paciente cadastrado com sucesso!",
    }
}
