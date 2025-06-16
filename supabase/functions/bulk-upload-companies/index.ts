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

    // 4. Check for parsing errors
    if (parsingErrors.length > 0) {
      throw new Error(`CSV parsing errors: ${parsingErrors.map(e => e.message).join(', ')}`)
    }

    // 5. Validate and transform the data
    const companies = parsedRows.map((row, index) => {
      if (!row.name || !row.domain_name) {
        throw new Error(`Row ${index + 1}: name and domain_name are required`)
      }

      return {
        name: row.name.trim(),
        logo_url: row.logo_url?.trim() || null,
        website: row.website?.trim() || null,
        domain_name: row.domain_name.trim(),
        category_id: row.category_id ? parseInt(row.category_id) : null,
        is_claimed: false
      }
    })

    // 6. Insert companies into the database
    const { data, error } = await supabaseAdmin
      .from('companies')
      .insert(companies)
      .select()

    if (error) {
      throw new Error(`Database error: ${error.message}`)
    }

    // 7. Return success response
    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully uploaded ${companies.length} companies`,
        data: data
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('Bulk upload error:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})