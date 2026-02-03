import { useState, useEffect } from 'react'
import { createTenantClient } from '@/lib/supabase/tenant-client'

export interface Preset {
    id: string
    content: string
    category: string
}

export function usePresets(category: string) {
    const [presets, setPresets] = useState<Preset[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const supabase = createTenantClient()

    const fetchPresets = async () => {
        try {
            const { data, error } = await supabase
                .from('text_presets')
                .select('*')
                .eq('category', category)
                .order('created_at', { ascending: true })

            if (error) throw error
            if (data) setPresets(data)
        } catch (error) {
            console.error(`Error fetching presets for ${category}:`, error)
        } finally {
            setIsLoading(false)
        }
    }

    const addPreset = async (content: string) => {
        if (!content.trim()) return null

        // Optimistic update
        const tempId = crypto.randomUUID()
        const newPreset = { id: tempId, content, category }
        setPresets(prev => [...prev, newPreset])

        try {
            const { data, error } = await supabase
                .from('text_presets')
                .insert({ category, content })
                .select()
                .single()

            if (error) throw error

            // Validate real ID - CRITICAL FIX: Ensure we replace the tempId with the real ID
            console.log("Preset added, replacing tempId", tempId, "with real ID", data.id)
            setPresets(prev => prev.map(p => p.id === tempId ? data : p))
            return data
        } catch (error) {
            console.error("Error adding preset:", error)
            setPresets(prev => prev.filter(p => p.id !== tempId)) // Rollback
            return null
        }
    }

    const removePreset = async (id: string) => {
        console.log("Attempting to remove preset with ID:", id)

        // Optimistic update
        const backup = [...presets]
        setPresets(prev => prev.filter(p => p.id !== id))

        try {
            const { error } = await supabase
                .from('text_presets')
                .delete()
                .eq('id', id)

            if (error) throw error
            console.log("Preset removed successfully from DB:", id)
        } catch (error) {
            console.error("Error removing preset:", error)
            setPresets(backup) // Rollback
            alert("Erro ao remover favorito. Verifique o console.")
        }
    }

    useEffect(() => {
        fetchPresets()
    }, [category])

    return {
        presets,
        isLoading,
        addPreset,
        removePreset,
        refresh: fetchPresets
    }
}
