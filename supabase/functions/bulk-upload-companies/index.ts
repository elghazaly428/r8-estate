import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8'
import Papa from 'https://esm.sh/papaparse@5.3.2'
import { corsHeaders } from '../_shared/cors.ts'

// Define the structure of a row from the CSV
interface CompanyCsvRow {
  name: string
  logo_url: string
  website: string
  domain_name: string
  category_id: string // Comes in as a string from CSV
}

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Create a Supabase client with Admin rights
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 2. Extract the file from the request
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) {
      throw new Error('No file provided.')
    }

    // 3. Read the file content and parse it using Papaparse
    const fileContent = await file.text()
    const { data: parsedRows, errors: parsingErrors } = Papa.parse<CompanyCsvRow>(fileContent, {
      header: true, // Treat the first row as headers
      skipEmptyLines: true,
    })