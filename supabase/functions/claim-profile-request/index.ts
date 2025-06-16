import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8';
import { corsHeaders } from '../_shared/cors.ts';

// Main function logic
serve(async (req) => {
  // This is needed if you're planning to invoke your function from a browser.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { company_id, employee_email, supervisor_email } = await req.json();

    // Create a Supabase client with the SERVICE_ROLE_KEY for admin privileges
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. Check if the company is already claimed
    const { data: company, error: companyError } = await supabaseAdmin
      .from('companies')
      .select('is_claimed')
      .eq('id', company_id)
      .single();

    if (companyError || !company) {
      throw new Error('Company not found.');
    }
    if (company.is_claimed) {
      return new Response(JSON.stringify({ error: 'This company profile has already been claimed.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 409, // 409 Conflict
      });
    }
    
    // 2. Get the initiator's user ID from the auth token
    const authHeader = req.headers.get('Authorization')!;
    const { data: { user } } = await supabaseAdmin.auth.getUser(authHeader.replace('Bearer ', ''));
    if (!user) {
        throw new Error("User not authenticated.");
    }
    const initiator_profile_id = user.id;


    // 3. Generate unique tokens and set expiration
    const employee_token = crypto.randomUUID();
    const supervisor_token = crypto.randomUUID();
    const expires_at = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours from now

    // 4. Insert the pending claim into the database
    const { data: claimRequest, error: insertError } = await supabaseAdmin
      .from('claim_requests')
      .insert({
        company_id,
        initiator_profile_id,
        employee_email,
        supervisor_email,
        employee_token,
        supervisor_token,
        expires_at,
        status: 'pending',
      })
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    // 5. TODO: Send emails with these links. For now, we log them for testing.
    console.log("--- Claim Process Initiated ---");
    console.log("Company ID:", company_id);
    console.log("Employee Verification Link:", `http://localhost:3000/api/verify-claim?token=${employee_token}`);
    console.log("Supervisor Verification Link:", `http://localhost:3000/api/verify-claim?token=${supervisor_token}`);
    console.log("-------------------------------");
    

    return new Response(JSON.stringify({ message: 'Claim process initiated successfully.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});