import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

interface VerbatimExtractionRequest {
  projectId: string;
  transcriptId: string;
  content: string;
  fileName: string;
}

interface ExtractedVerbatim {
  text: string;
  speaker: string;
  line_number?: number;
}

Deno.serve(async (req: Request) => {
  try {
    // CORS handling
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 405,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const { projectId, transcriptId, content, fileName }: VerbatimExtractionRequest = await req.json();

    if (!projectId || !transcriptId || !content) {
      return new Response(
        JSON.stringify({ error: 'projectId, transcriptId, and content are required' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log(`Extracting verbatims for transcript ${transcriptId}`);

    // Call OpenAI API to extract verbatims
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')!;
    
    const extractedVerbatims = await extractVerbatimsWithAI(content, openaiApiKey);

    // Save verbatims to database
    const verbatimRecords = extractedVerbatims.map((v: ExtractedVerbatim) => ({
      project_id: projectId,
      transcript_id: transcriptId,
      text: v.text,
      speaker: v.speaker,
      source_file: fileName,
      line_number: v.line_number || null,
      created_at: new Date().toISOString()
    }));

    const { data, error } = await supabase
      .from('qualitative_verbatims')
      .insert(verbatimRecords)
      .select();

    if (error) {
      throw new Error(`Failed to save verbatims: ${error.message}`);
    }

    console.log(`Extracted ${data.length} verbatims from transcript ${transcriptId}`);

    return new Response(
      JSON.stringify({
        success: true,
        data: data,
        count: data.length,
        message: `Successfully extracted ${data.length} verbatims`
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );

  } catch (error) {
    console.error('Verbatim extraction error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Verbatim extraction failed',
        details: error.message
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
});

async function extractVerbatimsWithAI(content: string, openaiApiKey: string): Promise<ExtractedVerbatim[]> {
  const prompt = `
    Extract meaningful verbatims (quotes) from this transcript.
    A verbatim should be:
    - A complete thought or statement
    - At least 10 words long
    - Contains insight, opinion, or experience
    - Includes the speaker identification
    
    Return JSON array with structure:
    [
      {
        "text": "The actual quote",
        "speaker": "Speaker name or identifier", 
        "line_number": 123
      }
    ]
    
    Transcript Content:
    ${content}
  `;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${openaiApiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
      max_tokens: 4000
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.statusText}`);
  }

  const result = await response.json();
  const content_text = result.choices[0]?.message?.content;
  
  if (!content_text) {
    throw new Error('No response from OpenAI');
  }

  try {
    return JSON.parse(content_text);
  } catch (error) {
    console.error('Failed to parse OpenAI response:', content_text);
    throw new Error('Invalid JSON response from OpenAI');
  }
}