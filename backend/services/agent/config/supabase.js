/*import { createClient } from "@supabase/supabase-js"

export const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
)

export const storageBucket = process.env.SUPABASE_BUCKET_NAME */
import { createClient } from "@supabase/supabase-js"

console.log("SUPABASE URL:", process.env.SUPABASE_URL)
console.log("BUCKET:", process.env.SUPABASE_BUCKET_NAME)

export const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
)

export const storageBucket = process.env.SUPABASE_BUCKET_NAME
