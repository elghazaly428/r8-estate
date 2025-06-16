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
  category_name: string // Now expects category name instead of ID
}

// Define category structure from database
interface Category {
  id: number
  name: string
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

    // 2. Fetch All Categories First
    const { data: categories, error: categoriesError } = await supabaseAdmin
      .from('categories')
      .select('id, name')

    if (categoriesError) {
      throw new Error(`Failed to fetch categories: ${categoriesError.message}`)
    }

    // Create a lookup map for category names to IDs
    const categoryLookup = new Map<string, number>()
    categories?.forEach((category: Category) => {
      if (category.name) {
        categoryLookup.set(category.name.toLowerCase().trim(), category.id)
      }
    })

    // 3. Extract the file from the request
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) {
      throw new Error('No file provided.')
    }

    // 4. Read the file content and parse it using Papaparse
    const fileContent = await file.text()
    const { data: parsedRows, errors: parsingErrors } = Papa.parse<CompanyCsvRow>(fileContent, {
      header: true, // Treat the first row as headers
      skipEmptyLines: true,
    })

    // 5. Check for parsing errors
    if (parsingErrors.length > 0) {
      throw new Error(`CSV parsing errors: ${parsingErrors.map(e => e.message).join(', ')}`)
    }

    // 6. Validate and transform the data
    const companies = []
    const validationErrors = []

    for (let index = 0; index < parsedRows.length; index++) {
      const row = parsedRows[index]
      const rowNumber = index + 2 // +2 because index starts at 0 and we have a header row

      // Validate required fields
      if (!row.name || !row.domain_name) {
        validationErrors.push(`Row ${rowNumber}: name and domain_name are required`)
        continue
      }

      // Process category_name
      let categoryId = null
      if (row.category_name && row.category_name.trim()) {
        const categoryName = row.category_name.trim().toLowerCase()
        
        // Search for exact match in category lookup
        if (categoryLookup.has(categoryName)) {
          categoryId = categoryLookup.get(categoryName)!
        } else {
          // Category not found - record validation error and skip this row
          validationErrors.push(`Row ${rowNumber}: Category '${row.category_name}' does not exist`)
          continue
        }
      }
      // If category_name is empty or null, categoryId remains null (which is allowed)

      // Add valid company to the list
      companies.push({
        name: row.name.trim(),
        logo_url: row.logo_url?.trim() || null,
        website: row.website?.trim() || null,
        domain_name: row.domain_name.trim(),
        category_id: categoryId,
        is_claimed: false
      })
    }

    // 7. Check if there were validation errors
    if (validationErrors.length > 0) {
      throw new Error(`Data validation failed:\n${validationErrors.join('\n')}`)
    }

    // 8. Check if we have any valid companies to insert
    if (companies.length === 0) {
      throw new Error('No valid companies found in the CSV file')
    }

    // 9. Perform Batch Insert into the database
    const { data, error } = await supabaseAdmin
      .from('companies')
      .insert(companies)
      .select()

    if (error) {
      throw new Error(`Database error: ${error.message}`)
    }

    // 10. Return success response
    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully processed and inserted ${companies.length} companies`,
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