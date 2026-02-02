

import { PatientFormSheet } from "@/components/patients/patient-form-sheet"
import PatientsDataWrapper from "@/components/patients/patient-data-wrapper"

export default function PatientsPage() {
    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight">Pacientes</h1>
                <PatientFormSheet />
            </div>
            <PatientsDataWrapper />
        </div>
    )
}
