"use client"

import { ClinicalHistory } from "./clinical-history"

interface Patient {
    id: string
    full_name: string
    contact_email?: string
    contact_phone?: string
    document_id?: string
    birth_date?: string
}

interface AnamneseWrapperProps {
    patient: Patient
}

export function AnamneseWrapper({ patient }: AnamneseWrapperProps) {
    return (
        <ClinicalHistory
            patientId={patient.id}
            patient={patient}
            filterType="anamnesis"
        />
    )
}
