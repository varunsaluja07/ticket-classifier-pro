import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { subject, description, customerEmail } = await req.json();
    console.log('Processing ticket:', { subject, description, customerEmail });

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const systemPrompt = `You are an AI support ticket categorization system. Analyze support tickets and provide:
1. Category (one of: Technical, Billing, Feature Request, Bug Report, General)
2. Priority (one of: high, medium, low)
3. SLA (Service Level Agreement): Response time based on priority - High: 4 hours, Medium: 8 hours, Low: 24-48 hours
4. A professional, helpful response template

Base priority on urgency indicators like "urgent", "critical", "not working", "broken", etc.`;

    const userPrompt = `Categorize this support ticket:
Subject: ${subject}
Description: ${description}
Customer Email: ${customerEmail}

Provide a JSON response with: category, priority, sla, and suggestedResponse.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'categorize_ticket',
            description: 'Categorize a support ticket with priority, SLA, and response',
            parameters: {
              type: 'object',
              properties: {
                category: {
                  type: 'string',
                  enum: ['Technical', 'Billing', 'Feature Request', 'Bug Report', 'General']
                },
                priority: {
                  type: 'string',
                  enum: ['high', 'medium', 'low']
                },
                sla: {
                  type: 'string',
                  enum: ['4 hours', '8 hours', '24 hours', '48 hours'],
                  description: 'Service Level Agreement response time'
                },
                suggestedResponse: {
                  type: 'string',
                  description: 'A professional response template for the customer'
                }
              },
              required: ['category', 'priority', 'sla', 'suggestedResponse'],
              additionalProperties: false
            }
          }
        }],
        tool_choice: { type: 'function', function: { name: 'categorize_ticket' } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), 
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Payment required. Please add credits to continue.' }), 
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    console.log('AI response:', JSON.stringify(data, null, 2));

    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error('No tool call in AI response');
    }

    const result = JSON.parse(toolCall.function.arguments);
    console.log('Categorization result:', result);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in categorize-ticket:', error);
    const errorMessage = error instanceof Error ? error.message : 'An error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
