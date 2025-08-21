import { OpenAI } from 'openai';
import { supabase } from '../config/supabase';
import { Database, VerbatimData, TopicAssignment, QuestionMapping, StrategicAnalysisResult } from '../types/database.types';
import { v4 as uuidv4 } from 'uuid';

type Verbatim = Database['public']['Tables']['qualitative_verbatims']['Row'];
type VerbatimInsert = Database['public']['Tables']['qualitative_verbatims']['Insert'];
type EmergentTopic = Database['public']['Tables']['emergent_topics']['Row'];
type EmergentTopicInsert = Database['public']['Tables']['emergent_topics']['Insert'];
type QuestionMappingRow = Database['public']['Tables']['question_mappings']['Row'];
type QuestionMappingInsert = Database['public']['Tables']['question_mappings']['Insert'];
type StrategicAnalysis = Database['public']['Tables']['strategic_analyses']['Row'];
type StrategicAnalysisInsert = Database['public']['Tables']['strategic_analyses']['Insert'];

export interface ObjectiveData {
  id: string;
  section: string;
  question: string;
  objective: string;
}

export interface ProcessedVerbatim extends VerbatimData {
  id?: string;
  projectId: string;
  transcriptId: string;
}

export class AIProcessorService {
  private openai: OpenAI;
  
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  /**
   * Extract objectives from discussion guide content
   */
  async extractGuideObjectives(guideContent: string): Promise<ObjectiveData[]> {
    try {
      const prompt = `
        Analyze this discussion guide and extract the key objectives and questions.
        Return a JSON array of objectives with this structure:
        [
          {
            "id": "ID-1",
            "section": "Section Name",
            "question": "The actual question asked",
            "objective": "What this question aims to understand"
          }
        ]
        
        Discussion Guide Content:
        ${guideContent}
      `;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      return JSON.parse(content);
    } catch (error) {
      console.error('Error extracting guide objectives:', error);
      throw new Error(`Failed to extract objectives: ${error}`);
    }
  }

  /**
   * Extract verbatims from transcript content
   */
  async extractVerbatims(
    projectId: string,
    transcriptId: string,
    transcriptContent: string,
    sourceFileName: string
  ): Promise<Verbatim[]> {
    try {
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
        ${transcriptContent}
      `;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2,
        max_tokens: 4000
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      const extractedVerbatims = JSON.parse(content);
      
      // Save verbatims to database
      const verbatimRecords: VerbatimInsert[] = extractedVerbatims.map((v: any) => ({
        id: uuidv4(),
        project_id: projectId,
        transcript_id: transcriptId,
        text: v.text,
        speaker: v.speaker,
        source_file: sourceFileName,
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

      return data || [];
    } catch (error) {
      console.error('Error extracting verbatims:', error);
      throw new Error(`Failed to extract verbatims: ${error}`);
    }
  }

  /**
   * Map verbatims to discussion guide questions
   */
  async mapVerbatimsToQuestions(
    projectId: string,
    verbatims: Verbatim[],
    objectives: ObjectiveData[]
  ): Promise<QuestionMappingRow[]> {
    try {
      const mappings: QuestionMappingInsert[] = [];

      // Process verbatims in batches to avoid token limits
      const batchSize = 10;
      for (let i = 0; i < verbatims.length; i += batchSize) {
        const batch = verbatims.slice(i, i + batchSize);
        
        const prompt = `
          Map these verbatims to the most relevant discussion guide question.
          
          Discussion Guide Questions:
          ${objectives.map(obj => `${obj.id}: ${obj.question}`).join('\n')}
          
          Verbatims to map:
          ${batch.map((v, idx) => `${idx + 1}: "${v.text}" - ${v.speaker}`).join('\n')}
          
          Return JSON array with structure:
          [
            {
              "verbatim_index": 1,
              "best_fit_question_id": "ID-3",
              "confidence": "High|Medium|Low",
              "reasoning": "Why this question is the best fit"
            }
          ]
        `;

        const response = await this.openai.chat.completions.create({
          model: "gpt-4",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.1
        });

        const content = response.choices[0]?.message?.content;
        if (!content) continue;

        const batchMappings = JSON.parse(content);
        
        for (const mapping of batchMappings) {
          const verbatimIndex = mapping.verbatim_index - 1;
          if (verbatimIndex >= 0 && verbatimIndex < batch.length) {
            const verbatim = batch[verbatimIndex];
            const objective = objectives.find(obj => obj.id === mapping.best_fit_question_id);
            
            if (objective && mapping.confidence !== 'Low') {
              mappings.push({
                id: uuidv4(),
                project_id: projectId,
                verbatim_id: verbatim.id,
                question_section: objective.section,
                question_text: objective.question,
                confidence: mapping.confidence as 'High' | 'Medium' | 'Low',
                reasoning: mapping.reasoning,
                created_at: new Date().toISOString()
              });
            }
          }
        }
      }

      // Save mappings to database
      if (mappings.length > 0) {
        const { data, error } = await supabase
          .from('question_mappings')
          .insert(mappings)
          .select();

        if (error) {
          throw new Error(`Failed to save question mappings: ${error.message}`);
        }

        return data || [];
      }

      return [];
    } catch (error) {
      console.error('Error mapping verbatims to questions:', error);
      throw new Error(`Failed to map verbatims: ${error}`);
    }
  }

  /**
   * Analyze emergent topics from verbatims
   */
  async analyzeEmergentTopics(
    projectId: string,
    verbatims: Verbatim[]
  ): Promise<EmergentTopic[]> {
    try {
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

      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 3000
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      const result = JSON.parse(content);
      const topicRecords: EmergentTopicInsert[] = [];

      for (const topic of result.topics) {
        for (const verbatimIndex of topic.verbatim_indices) {
          const verbatim = verbatims[verbatimIndex - 1];
          if (verbatim) {
            topicRecords.push({
              id: uuidv4(),
              project_id: projectId,
              verbatim_id: verbatim.id,
              broad_topic: topic.broad_topic,
              sub_topic: topic.sub_topic,
              created_at: new Date().toISOString()
            });
          }
        }
      }

      // Save topics to database
      if (topicRecords.length > 0) {
        const { data, error } = await supabase
          .from('emergent_topics')
          .insert(topicRecords)
          .select();

        if (error) {
          throw new Error(`Failed to save emergent topics: ${error.message}`);
        }

        return data || [];
      }

      return [];
    } catch (error) {
      console.error('Error analyzing emergent topics:', error);
      throw new Error(`Failed to analyze topics: ${error}`);
    }
  }

  /**
   * Perform strategic analysis on topics
   */
  async performStrategicAnalysis(
    projectId: string,
    broadTopic: string,
    subTopic: string,
    relatedVerbatims: Verbatim[]
  ): Promise<StrategicAnalysis> {
    try {
      const prompt = `
        Perform strategic analysis on this topic based on the related verbatims.
        Provide actionable insights, key themes, takeaways, and supporting quotes.
        
        Topic: ${broadTopic} - ${subTopic}
        
        Related Verbatims:
        ${relatedVerbatims.map((v, idx) => `${idx + 1}: "${v.text}" - ${v.speaker}`).join('\n')}
        
        Return JSON with structure:
        {
          "key_insights": "Main insights about this topic",
          "key_themes": ["Theme 1", "Theme 2", "Theme 3"],
          "key_takeaways": ["Takeaway 1", "Takeaway 2", "Takeaway 3"],
          "supporting_quotes": ["Quote 1", "Quote 2", "Quote 3"]
        }
      `;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      const analysis = JSON.parse(content);
      
      const analysisRecord: StrategicAnalysisInsert = {
        id: uuidv4(),
        project_id: projectId,
        broad_topic: broadTopic,
        sub_topic: subTopic,
        key_insights: analysis.key_insights,
        key_themes: analysis.key_themes,
        key_takeaways: analysis.key_takeaways,
        supporting_quotes: analysis.supporting_quotes,
        verbatim_count: relatedVerbatims.length,
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('strategic_analyses')
        .insert(analysisRecord)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to save strategic analysis: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error performing strategic analysis:', error);
      throw new Error(`Failed to perform strategic analysis: ${error}`);
    }
  }

  /**
   * Get verbatims for a specific topic
   */
  async getTopicVerbatims(projectId: string, broadTopic: string, subTopic: string): Promise<Verbatim[]> {
    const { data, error } = await supabase
      .from('emergent_topics')
      .select(`
        verbatim_id,
        qualitative_verbatims (*)
      `)
      .eq('project_id', projectId)
      .eq('broad_topic', broadTopic)
      .eq('sub_topic', subTopic);

    if (error) {
      throw new Error(`Failed to get topic verbatims: ${error.message}`);
    }

    return data?.map(item => (item as any).qualitative_verbatims).filter(Boolean) || [];
  }

  /**
   * Get all unique topics for a project
   */
  async getProjectTopics(projectId: string): Promise<Array<{broad_topic: string, sub_topic: string, count: number}>> {
    const { data, error } = await supabase
      .rpc('get_topic_hierarchy', { project_uuid: projectId });

    if (error) {
      throw new Error(`Failed to get project topics: ${error.message}`);
    }

    return data || [];
  }
}