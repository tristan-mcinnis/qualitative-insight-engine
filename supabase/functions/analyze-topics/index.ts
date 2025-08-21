import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

interface TopicAnalysisRequest {
  projectId: string;
  verbatims: Array<{
    id: string;
    text: string;
    speaker: string;
  }>;
}

interface TopicAssignment {
  broad_topic: string;
  sub_topic: string;
  verbatim_indices: number[];
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

    const { projectId, verbatims }: TopicAnalysisRequest = await req.json();

    if (!projectId || !verbatims || !Array.isArray(verbatims)) {
      return new Response(
        JSON.stringify({ error: 'projectId and verbatims array are required' }),
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

    console.log(`Analyzing topics for ${verbatims.length} verbatims in project ${projectId}`);

    // Call OpenAI API to analyze topics
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')!;
    
    const topicAssignments = await analyzeTopicsWithAI(verbatims, openaiApiKey);

    // Save topic assignments to database
    const topicRecords = [];
    
    for (const assignment of topicAssignments) {
      for (const verbatimIndex of assignment.verbatim_indices) {
        const verbatim = verbatims[verbatimIndex - 1]; // AI returns 1-based indices
        if (verbatim) {
          topicRecords.push({
            project_id: projectId,
            verbatim_id: verbatim.id,
            broad_topic: assignment.broad_topic,
            sub_topic: assignment.sub_topic,
            created_at: new Date().toISOString()
          });
        }
      }
    }

    if (topicRecords.length > 0) {
      const { data, error } = await supabase
        .from('emergent_topics')
        .insert(topicRecords)
        .select();

      if (error) {
        throw new Error(`Failed to save topics: ${error.message}`);
      }

      console.log(`Saved ${data.length} topic assignments for project ${projectId}`);

      return new Response(
        JSON.stringify({
          success: true,
          data: data,
          topicSummary: topicAssignments,
          count: data.length,
          message: `Successfully analyzed and saved ${data.length} topic assignments`
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    } else {
      return new Response(
        JSON.stringify({
          success: true,
          data: [],
          count: 0,
          message: 'No topics identified'
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

  } catch (error) {
    console.error('Topic analysis error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Topic analysis failed',
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

async function analyzeTopicsWithAI(verbatims: any[], openaiApiKey: string): Promise<TopicAssignment[]> {
  const prompt = `
    Analyze these verbatims and identify emergent topics and themes.
    Group similar ideas into broad topics and sub-topics.
    
    Verbatims:
    ${verbatims.map((v, idx) => `${idx + 1}: "${v.text}" - ${v.speaker}`).join('\n')}
    
    Return JSON with structure:
    {
      "topics": [
        {
          "broad_topic": "Main Theme",
          "sub_topic": "Specific Aspect",
          "verbatim_indices": [1, 3, 7]
        }
      ]
    }
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
      temperature: 0.3,
      max_tokens: 3000
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.statusText}`);
  }

  const result = await response.json();
  const content = result.choices[0]?.message?.content;
  
  if (!content) {
    throw new Error('No response from OpenAI');
  }

  try {
    const parsed = JSON.parse(content);
    return parsed.topics || [];
  } catch (error) {
    console.error('Failed to parse OpenAI response:', content);
    throw new Error('Invalid JSON response from OpenAI');
  }
}