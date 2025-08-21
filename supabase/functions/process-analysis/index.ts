import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

interface AnalysisRequest {
  sessionId: string;
  projectId: string;
}

interface AnalysisStep {
  name: string;
  progress: number;
  estimatedTime: number;
}

const ANALYSIS_STEPS: AnalysisStep[] = [
  { name: 'Extracting objectives from guide', progress: 10, estimatedTime: 30 },
  { name: 'Extracting verbatims from transcripts', progress: 25, estimatedTime: 60 },
  { name: 'Mapping verbatims to questions', progress: 50, estimatedTime: 90 },
  { name: 'Analyzing emergent topics', progress: 70, estimatedTime: 60 },
  { name: 'Performing strategic analysis', progress: 85, estimatedTime: 45 },
  { name: 'Generating reports', progress: 95, estimatedTime: 15 }
];

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

    const { sessionId, projectId }: AnalysisRequest = await req.json();

    if (!sessionId || !projectId) {
      return new Response(
        JSON.stringify({ error: 'sessionId and projectId are required' }),
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

    console.log(`Starting analysis for session ${sessionId}, project ${projectId}`);

    // Update progress through each step
    for (const step of ANALYSIS_STEPS) {
      await updateAnalysisProgress(
        supabase,
        sessionId,
        step.progress,
        step.name,
        step.estimatedTime
      );

      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // Mark as completed
    await supabase
      .from('analysis_sessions')
      .update({
        status: 'completed',
        progress: 100,
        current_step: 'Completed',
        completed_at: new Date().toISOString(),
        estimated_remaining_seconds: 0
      })
      .eq('id', sessionId);

    // Update project status
    await supabase
      .from('projects')
      .update({ status: 'completed' })
      .eq('id', projectId);

    // Save final results
    const finalResults = {
      completedAt: new Date().toISOString(),
      message: 'Analysis completed successfully',
      sessionId: sessionId
    };

    await supabase
      .from('analysis_results')
      .insert({
        project_id: projectId,
        session_id: sessionId,
        result_type: 'full_report',
        data: finalResults
      });

    console.log(`Analysis completed for session ${sessionId}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Analysis completed successfully',
        sessionId: sessionId
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
    console.error('Analysis processing error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Analysis processing failed',
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

async function updateAnalysisProgress(
  supabase: any,
  sessionId: string,
  progress: number,
  stepName: string,
  estimatedRemaining: number
) {
  await supabase
    .from('analysis_sessions')
    .update({
      status: 'processing',
      progress: progress,
      current_step: stepName,
      estimated_remaining_seconds: estimatedRemaining
    })
    .eq('id', sessionId);
}