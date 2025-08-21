import { supabase } from '../config/supabase';
import { AnalysisProgress } from '../types/database.types';

export interface RealtimeSubscription {
  id: string;
  channel: string;
  callback: (payload: any) => void;
  unsubscribe: () => void;
}

export class RealtimeService {
  private subscriptions: Map<string, RealtimeSubscription> = new Map();

  /**
   * Subscribe to analysis progress updates for a specific project
   */
  subscribeToAnalysisProgress(
    projectId: string,
    callback: (progress: AnalysisProgress) => void
  ): RealtimeSubscription {
    const channelName = `analysis_progress_${projectId}`;
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'analysis_sessions',
          filter: `project_id=eq.${projectId}`
        },
        (payload) => {
          console.log('Analysis progress update received:', payload);
          
          if (payload.new) {
            const session = payload.new;
            const progress: AnalysisProgress = {
              sessionId: session.id,
              projectId: session.project_id,
              status: session.status,
              progress: session.progress,
              currentStep: session.current_step || 'Initializing',
              estimatedRemaining: session.estimated_remaining_seconds || undefined,
              error: session.error_message || undefined
            };
            
            callback(progress);
          }
        }
      )
      .subscribe((status) => {
        console.log(`Analysis progress subscription status: ${status} for project ${projectId}`);
      });

    const subscription: RealtimeSubscription = {
      id: channelName,
      channel: channelName,
      callback,
      unsubscribe: () => {
        channel.unsubscribe();
        this.subscriptions.delete(channelName);
      }
    };

    this.subscriptions.set(channelName, subscription);
    return subscription;
  }

  /**
   * Subscribe to new verbatims being added to a project
   */
  subscribeToVerbatims(
    projectId: string,
    callback: (verbatim: any) => void
  ): RealtimeSubscription {
    const channelName = `verbatims_${projectId}`;
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'qualitative_verbatims',
          filter: `project_id=eq.${projectId}`
        },
        (payload) => {
          console.log('New verbatim added:', payload);
          if (payload.new) {
            callback(payload.new);
          }
        }
      )
      .subscribe();

    const subscription: RealtimeSubscription = {
      id: channelName,
      channel: channelName,
      callback,
      unsubscribe: () => {
        channel.unsubscribe();
        this.subscriptions.delete(channelName);
      }
    };

    this.subscriptions.set(channelName, subscription);
    return subscription;
  }

  /**
   * Subscribe to emergent topics updates
   */
  subscribeToEmergentTopics(
    projectId: string,
    callback: (topic: any) => void
  ): RealtimeSubscription {
    const channelName = `topics_${projectId}`;
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'emergent_topics',
          filter: `project_id=eq.${projectId}`
        },
        (payload) => {
          console.log('New topic identified:', payload);
          if (payload.new) {
            callback(payload.new);
          }
        }
      )
      .subscribe();

    const subscription: RealtimeSubscription = {
      id: channelName,
      channel: channelName,
      callback,
      unsubscribe: () => {
        channel.unsubscribe();
        this.subscriptions.delete(channelName);
      }
    };

    this.subscriptions.set(channelName, subscription);
    return subscription;
  }

  /**
   * Subscribe to analysis results being saved
   */
  subscribeToAnalysisResults(
    projectId: string,
    callback: (result: any) => void
  ): RealtimeSubscription {
    const channelName = `results_${projectId}`;
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'analysis_results',
          filter: `project_id=eq.${projectId}`
        },
        (payload) => {
          console.log('Analysis result saved:', payload);
          if (payload.new) {
            callback(payload.new);
          }
        }
      )
      .subscribe();

    const subscription: RealtimeSubscription = {
      id: channelName,
      channel: channelName,
      callback,
      unsubscribe: () => {
        channel.unsubscribe();
        this.subscriptions.delete(channelName);
      }
    };

    this.subscriptions.set(channelName, subscription);
    return subscription;
  }

  /**
   * Subscribe to project status changes
   */
  subscribeToProjectUpdates(
    projectId: string,
    callback: (project: any) => void
  ): RealtimeSubscription {
    const channelName = `project_${projectId}`;
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'projects',
          filter: `id=eq.${projectId}`
        },
        (payload) => {
          console.log('Project updated:', payload);
          if (payload.new) {
            callback(payload.new);
          }
        }
      )
      .subscribe();

    const subscription: RealtimeSubscription = {
      id: channelName,
      channel: channelName,
      callback,
      unsubscribe: () => {
        channel.unsubscribe();
        this.subscriptions.delete(channelName);
      }
    };

    this.subscriptions.set(channelName, subscription);
    return subscription;
  }

  /**
   * Unsubscribe from a specific subscription
   */
  unsubscribe(subscriptionId: string): boolean {
    const subscription = this.subscriptions.get(subscriptionId);
    if (subscription) {
      subscription.unsubscribe();
      return true;
    }
    return false;
  }

  /**
   * Unsubscribe from all subscriptions
   */
  unsubscribeAll(): void {
    for (const subscription of this.subscriptions.values()) {
      subscription.unsubscribe();
    }
    this.subscriptions.clear();
  }

  /**
   * Get active subscriptions count
   */
  getActiveSubscriptionsCount(): number {
    return this.subscriptions.size;
  }

  /**
   * Get all active subscription IDs
   */
  getActiveSubscriptionIds(): string[] {
    return Array.from(this.subscriptions.keys());
  }

  /**
   * Send a custom realtime message (for testing or custom events)
   */
  async sendCustomMessage(channel: string, event: string, payload: any): Promise<void> {
    const channelInstance = supabase.channel(channel);
    
    try {
      await channelInstance.send({
        type: 'broadcast',
        event: event,
        payload: payload
      });
    } catch (error) {
      console.error('Failed to send custom realtime message:', error);
      throw new Error(`Failed to send realtime message: ${error}`);
    }
  }

  /**
   * Listen for custom broadcast messages
   */
  subscribeToCustomMessages(
    channel: string,
    event: string,
    callback: (payload: any) => void
  ): RealtimeSubscription {
    const channelName = `custom_${channel}_${event}`;
    
    const channelInstance = supabase
      .channel(channel)
      .on('broadcast', { event }, callback)
      .subscribe();

    const subscription: RealtimeSubscription = {
      id: channelName,
      channel: channel,
      callback,
      unsubscribe: () => {
        channelInstance.unsubscribe();
        this.subscriptions.delete(channelName);
      }
    };

    this.subscriptions.set(channelName, subscription);
    return subscription;
  }

  /**
   * Check if realtime is connected
   */
  async checkRealtimeConnection(): Promise<boolean> {
    try {
      const testChannel = supabase.channel('connection_test');
      await testChannel.subscribe();
      testChannel.unsubscribe();
      return true;
    } catch (error) {
      console.error('Realtime connection check failed:', error);
      return false;
    }
  }
}