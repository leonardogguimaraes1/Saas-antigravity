"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"

interface ToothSelectorProps {
    selectedTeeth: number[]
    onSelectionChange: (teeth: number[]) => void
    disabled?: boolean
}

// Dental notation (FDI World Dental Federation)
const dentalArch = {
    upperRight: [18, 17, 16, 15, 14, 13, 12, 11],
    upperLeft: [21, 22, 23, 24, 25, 26, 27, 28],
    lowerLeft: [31, 32, 33, 34, 35, 36, 37, 38],
    lowerRight: [48, 47, 46, 45, 44, 43, 42, 41],
}

// Tooth names for accessibility
const toothNames: Record<number, string> = {
    // Upper Right
    18: "3º Molar Superior Direito", 17: "2º Molar Superior Direito", 16: "1º Molar Superior Direito",
    15: "2º Pré-Molar Superior Direito", 14: "1º Pré-Molar Superior Direito", 13: "Canino Superior Direito",
    12: "Incisivo Lateral Superior Direito", 11: "Incisivo Central Superior Direito",
    // Upper Left
    21: "Incisivo Central Superior Esquerdo", 22: "Incisivo Lateral Superior Esquerdo", 23: "Canino Superior Esquerdo",
    24: "1º Pré-Molar Superior Esquerdo", 25: "2º Pré-Molar Superior Esquerdo", 26: "1º Molar Superior Esquerdo",
    27: "2º Molar Superior Esquerdo", 28: "3º Molar Superior Esquerdo",
    // Lower Left
    31: "Incisivo Central Inferior Esquerdo", 32: "Incisivo Lateral Inferior Esquerdo", 33: "Canino Inferior Esquerdo",
    34: "1º Pré-Molar Inferior Esquerdo", 35: "2º Pré-Molar Inferior Esquerdo", 36: "1º Molar Inferior Esquerdo",
    37: "2º Molar Inferior Esquerdo", 38: "3º Molar Inferior Esquerdo",
    // Lower Right
    41: "Incisivo Central Inferior Direito", 42: "Incisivo Lateral Inferior Direito", 43: "Canino Inferior Direito",
    44: "1º Pré-Molar Inferior Direito", 45: "2º Pré-Molar Inferior Direito", 46: "1º Molar Inferior Direito",
    47: "2º Molar Inferior Direito", 48: "3º Molar Inferior Direito",
}

// Simplified Realistic Tooth Paths (Viewed from facial aspect)
// Normalized to viewBox="0 0 100 150" for scaling
const toothPaths: Record<string, string> = {
    // Upper Incisors (Central)
    upperCentral: "M20,100 L25,140 C35,150 65,150 75,140 L80,100 L85,40 C88,20 80,10 50,10 C20,10 12,20 15,40 Z",
    // Upper Incisors (Lateral)
    upperLateral: "M25,100 L28,130 C35,145 65,145 72,130 L75,100 L80,45 C83,25 75,15 50,15 C25,15 17,25 20,45 Z",
    // Upper Canine
    upperCanine: "M25,90 L30,130 C40,150 60,150 70,130 L75,90 L85,40 C90,20 70,5 50,5 C30,5 10,20 15,40 Z",
    // Upper Premolar
    upperPremolar: "M20,90 L25,120 C35,140 65,140 75,120 L80,90 L90,50 C95,30 85,15 50,15 C15,15 5,30 10,50 Z",
    // Upper Molar
    upperMolar: "M10,80 L15,110 C20,135 35,140 45,120 L50,100 L55,120 C65,140 80,135 85,110 L90,80 L95,40 C98,20 85,10 50,10 C15,10 2,20 5,40 Z",

    // Lower Incisors
    lowerIncisor: "M30,50 L32,10 C35,2 65,2 68,10 L70,50 L75,110 C78,130 70,140 50,140 C30,140 22,130 25,110 Z",
    // Lower Canine
    lowerCanine: "M25,60 L28,20 C35,5 65,5 72,20 L75,60 L80,110 C83,130 70,145 50,145 C30,145 17,130 20,110 Z",
    // Lower Premolar
    lowerPremolar: "M20,60 L25,30 C35,10 65,10 75,30 L80,60 L85,100 C90,120 80,135 50,135 C20,135 10,120 15,100 Z",
    // Lower Molar
    lowerMolar: "M10,70 L15,40 C20,15 35,10 45,30 L50,50 L55,30 C65,10 80,15 85,40 L90,70 L95,110 C98,130 85,140 50,140 C15,140 2,130 5,110 Z",
}

const getToothPath = (tooth: number) => {
    // Upper Arch (11-18, 21-28)
    if (tooth >= 11 && tooth <= 28) {
        const type = tooth % 10
        if (type === 1) return toothPaths.upperCentral
        if (type === 2) return toothPaths.upperLateral
        if (type === 3) return toothPaths.upperCanine
        if (type >= 4 && type <= 5) return toothPaths.upperPremolar
        if (type >= 6) return toothPaths.upperMolar
    }
    // Lower Arch (31-38, 41-48)
    else {
        const type = tooth % 10
        if (type >= 1 && type <= 2) return toothPaths.lowerIncisor
        if (type === 3) return toothPaths.lowerCanine
        if (type >= 4 && type <= 5) return toothPaths.lowerPremolar
        if (type >= 6) return toothPaths.lowerMolar
    }
    return toothPaths.upperMolar // Fallback
}

export function ToothSelector({ selectedTeeth, onSelectionChange, disabled = false }: ToothSelectorProps) {
    const [hoveredTooth, setHoveredTooth] = useState<number | null>(null)

    const toggleTooth = (tooth: number) => {
        if (disabled) return
        if (selectedTeeth.includes(tooth)) {
            onSelectionChange(selectedTeeth.filter(t => t !== tooth))
        } else {
            onSelectionChange([...selectedTeeth, tooth])
        }
    }

    const ToothButton = ({ tooth, isLower = false }: { tooth: number, isLower?: boolean }) => {
        const selected = selectedTeeth.includes(tooth)
        const hovered = hoveredTooth === tooth
        const isMolar = (tooth % 10) >= 6

        return (
            <button
                type="button"
                onClick={() => toggleTooth(tooth)}
                onMouseEnter={() => setHoveredTooth(tooth)}
                onMouseLeave={() => setHoveredTooth(null)}
                disabled={disabled}
                title={toothNames[tooth]}
                className={cn(
                    "relative group transition-all duration-300 ease-out focus:outline-none",
                    // Rebalanced sizes: Slightly larger to fill the space comfortably
                    isMolar ? "w-9 sm:w-10 shrink-0" : "w-6 sm:w-7 shrink"
                )}
            >
                {/* Tooth Shape SVG */}
                <div className={cn(
                    "relative w-full aspect-[2/3] transition-transform duration-300",
                    selected ? "scale-105 drop-shadow-md" : (hovered ? "scale-105" : "scale-100")
                )}>
                    <svg
                        viewBox="0 0 100 150"
                        className={cn(
                            "w-full h-full drop-shadow-sm transition-all duration-300",
                            selected
                                ? "fill-blue-500 text-blue-600"
                                : "fill-slate-50 text-slate-300 hover:fill-slate-100"
                        )}
                    >
                        {/* Root/Body */}
                        <path
                            d={getToothPath(tooth)}
                            stroke="currentColor"
                            strokeWidth="3"
                            vectorEffect="non-scaling-stroke"
                        />

                        {/* Inner detail for glossy feel - semi-transparent overlay */}
                        <path
                            d={getToothPath(tooth)}
                            fill={selected ? "white" : "transparent"}
                            fillOpacity={selected ? "0.1" : "0"}
                            className="pointer-events-none"
                        />
                    </svg>

                    {/* Tooth Number */}
                    <span className={cn(
                        "absolute left-1/2 -translate-x-1/2 text-[10px] sm:text-xs font-semibold select-none transition-colors duration-200",
                        isLower ? "-bottom-6" : "-top-6",
                        selected ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600"
                    )}>
                        {tooth}
                    </span>
                </div>
            </button>
        )
    }

    const renderQuadrant = (teeth: number[], isLower: boolean) => (
        // Balanced spacing for full-width card
        <div className="flex items-end justify-center gap-1 px-1">
            {teeth.map((tooth) => (
                <ToothButton key={tooth} tooth={tooth} isLower={isLower} />
            ))}
        </div>
    )

    return (
        <div className="w-full w-full mx-auto space-y-8 select-none">
            {/* Header */}
            <div className="text-center space-y-1">
                <h3 className="text-lg font-semibold text-slate-900 tracking-tight">
                    Odontograma
                </h3>
                <p className="text-sm text-slate-500">
                    Selecione os dentes no diagrama anatômico
                </p>
            </div>

            {/* Main Chart Container - Framed Aesthetic */}
            <div className="relative bg-white/80 rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-xl shadow-slate-100/50 backdrop-blur-md w-full mx-auto overflow-hidden">

                {/* Grid Layout for Arches */}
                <div className="flex flex-col gap-0">

                    {/* Upper Arch */}
                    <div className="flex flex-col items-center relative">
                        <div className="absolute -top-6 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                            Superior
                        </div>
                        {/* Flex container that centers the arch */}
                        <div className="flex justify-center items-end w-full max-w-full">
                            {/* Right Quadrant (18-11) */}
                            <div className="flex justify-end shrink-0">
                                {renderQuadrant(dentalArch.upperRight, false)}
                            </div>
                            {/* Midline Gap */}
                            <div className="w-px h-16 bg-slate-200/50 mx-1 sm:mx-2 shrink-0" />
                            {/* Left Quadrant (21-28) */}
                            <div className="flex justify-start shrink-0">
                                {renderQuadrant(dentalArch.upperLeft, false)}
                            </div>
                        </div>
                    </div>


                    {/* Divider with symmetrical spacing */}
                    <div className="flex items-center justify-between w-full px-4 sm:px-8 py-6 opacity-30 select-none">
                        <span className="text-xs font-medium uppercase tracking-widest">Direita</span>
                        <div className="h-px bg-slate-400 flex-1 mx-4" />
                        <span className="text-xs font-medium uppercase tracking-widest">Esquerda</span>
                    </div>

                    {/* Lower Arch */}
                    <div className="flex flex-col items-center relative">
                        <div className="absolute -bottom-6 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                            Inferior
                        </div>
                        <div className="flex justify-center items-start w-full max-w-full">
                            {/* Right Quadrant (48-41) */}
                            <div className="flex justify-end shrink-0">
                                {renderQuadrant(dentalArch.lowerRight, true)}
                            </div>
                            {/* Midline Gap - Expanded for labels */}
                            <div className="w-px h-16 bg-slate-200/50 mx-8 sm:mx-12 shrink-0" />
                            {/* Left Quadrant (31-38) */}
                            <div className="flex justify-start shrink-0">
                                {renderQuadrant(dentalArch.lowerLeft, true)}
                            </div>
                        </div>
                    </div>



                </div>
            </div>

            {/* Selection Summary */}
            <div className="flex flex-col items-center gap-4 animate-in slide-in-from-bottom-4 duration-500">
                <div className={cn(
                    "inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full transition-all duration-300",
                    selectedTeeth.length > 0 ? "bg-blue-50 text-blue-700 shadow-sm border border-blue-100" : "bg-slate-50 text-slate-500 border border-slate-100"
                )}>
                    <span className="text-sm font-medium">Dentes Selecionados</span>
                    <span className={cn(
                        "flex items-center justify-center min-w-[24px] h-6 px-1.5 rounded-full text-xs font-bold transition-colors",
                        selectedTeeth.length > 0 ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-500"
                    )}>
                        {selectedTeeth.length}
                    </span>
                </div>

                {selectedTeeth.length > 0 && (
                    <div className="flex flex-wrap justify-center gap-2 max-w-2xl mx-auto">
                        {selectedTeeth.sort((a, b) => a - b).map((tooth) => (
                            <button
                                key={tooth}
                                onClick={() => toggleTooth(tooth)}
                                className="group flex items-center gap-1.5 pl-3 pr-2 py-1.5 bg-white border border-slate-200 rounded-full text-sm font-medium text-slate-700 hover:border-red-200 hover:bg-red-50 hover:text-red-700 transition-colors shadow-sm"
                            >
                                {tooth}
                                <div className="p-0.5 rounded-full bg-slate-100 group-hover:bg-red-200/50 transition-colors">
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
