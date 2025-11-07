import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { ticketId, subject, description, customerName } = await req.json();

    if (!ticketId || !subject || !description) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client with service role for database updates
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Call Lovable AI to generate suggested response
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are a professional customer support agent. Generate a helpful, empathetic, and professional response to customer support tickets. 
            
Your response should:
- Address the customer by name if provided
- Acknowledge their concern
- Provide a clear solution or next steps
- Be concise (2-4 paragraphs)
- Maintain a friendly, professional tone
- End with an offer for further assistance

Format the response as plain text suitable for direct use in a support email.`
          },
          {
            role: 'user',
            content: `Generate a suggested response for this support ticket:

Subject: ${subject}
Customer: ${customerName || 'Valued Customer'}
Issue: ${description}`
          }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI gateway error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Payment required. Please add credits to your Lovable AI workspace.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      throw new Error('Failed to generate AI response');
    }

    const aiData = await aiResponse.json();
    const suggestedResponse = aiData.choices?.[0]?.message?.content || 'Unable to generate response';

    // Update ticket with AI-suggested response
    const { error: updateError } = await supabase
      .from('tickets')
      .update({ 
        ai_response: suggestedResponse,
        updated_at: new Date().toISOString()
      })
      .eq('id', ticketId);

    if (updateError) {
      console.error('Database update error:', updateError);
      throw new Error('Failed to update ticket');
    }

    console.log('Successfully generated response for ticket:', ticketId);

    return new Response(
      JSON.stringify({ 
        success: true, 
        suggestedResponse,
        ticketId 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in suggest-response function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
