/*import { supabase, storageBucket } from "../config/supabase.js"

export const uploadToStorage = async (filename, buffer, contentType) => {
    const { error } = await supabase.storage
        .from(storageBucket)
        .upload(filename, buffer, {
            contentType,
            upsert: true
        })

    if (error) {
        throw error
    }

    return filename
}*/
import { supabase, storageBucket } from "../config/supabase.js"

export const uploadToStorage = async (filename, buffer, contentType) => {

    console.log("========== SUPABASE UPLOAD ==========")
    console.log("Bucket:", storageBucket)
    console.log("Filename:", filename)
    console.log("Buffer size:", buffer.length)
    console.log("Content Type:", contentType)

    const { error } = await supabase.storage
        .from(storageBucket)
        .upload(filename, buffer, {
            contentType,
            upsert: true
        })

    if (error) {
        console.log("Supabase Upload Error:", error)
        throw error
    }

    console.log("Upload successful!")

    return filename
}