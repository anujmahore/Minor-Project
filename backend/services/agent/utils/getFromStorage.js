import { supabase, storageBucket } from "../config/supabase.js"

export const getFromStorage = async (filename, expiresIn = 600) => {
    const { data, error } = await supabase.storage
        .from(storageBucket)
        .createSignedUrl(filename, expiresIn)

    if (error) {
        throw error
    }

    return data.signedUrl
}
