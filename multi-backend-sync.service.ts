import { createClient, SupabaseClient } from '@supabase/supabase-js';
import https from 'https';
import http from 'http';

export interface BackendSyncResult {
  provider: string;
  success: boolean;
  message: string;
}

export interface MultiBackendSyncConfig {
  supabaseUrl?: string;
  supabaseKey?: string;
  firebaseUrl?: string;
  firebaseAuthToken?: string;
  remoteEndpoint?: string;
  remoteApiKey?: string;
}

export class MultiBackendSyncService {
  private supabaseClient?: SupabaseClient;

  constructor(private readonly config: MultiBackendSyncConfig) {
    if (this.config.supabaseUrl && this.config.supabaseKey) {
      this.supabaseClient = createClient(this.config.supabaseUrl, this.config.supabaseKey);
    }
  }

  async syncRecord(record: unknown): Promise<{ success: boolean; message: string; results: BackendSyncResult[] }> {
    const providers = this.buildProviders();

    if (providers.length === 0) {
      return {
        success: true,
        message: 'No remote backends configured; local backup is still preserved.',
        results: []
      };
    }

    const results: BackendSyncResult[] = [];

    for (const provider of providers) {
      try {
        if (provider.name === 'supabase') {
          await this.syncToSupabase(record);
          results.push({ provider: 'supabase', success: true, message: 'Synced to Supabase' });
        } else if (provider.name === 'firebase') {
          await this.syncToFirebase(record);
          results.push({ provider: 'firebase', success: true, message: 'Synced to Firebase' });
        } else {
          await this.postJson(provider.endpoint, record, provider.headers);
          results.push({ provider: 'generic-http', success: true, message: 'Synced to generic HTTP endpoint' });
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown backend sync error';
        results.push({ provider: provider.name, success: false, message });
      }
    }

    const successCount = results.filter((entry) => entry.success).length;
    return {
      success: successCount > 0,
      message: successCount > 0 ? `Synced to ${successCount}/${results.length} backend(s)` : 'All configured backend syncs failed',
      results
    };
  }

  private buildProviders(): Array<{ name: string; endpoint: string; headers: Record<string, string> }> {
    const providers: Array<{ name: string; endpoint: string; headers: Record<string, string> }> = [];

    if (this.config.supabaseUrl && this.config.supabaseKey) {
      providers.push({ name: 'supabase', endpoint: '', headers: {} });
    }

    if (this.config.firebaseUrl) {
      providers.push({ name: 'firebase', endpoint: this.config.firebaseUrl, headers: {} });
    }

    if (this.config.remoteEndpoint) {
      providers.push({ name: 'generic-http', endpoint: this.config.remoteEndpoint, headers: { ...(this.config.remoteApiKey ? { Authorization: `Bearer ${this.config.remoteApiKey}` } : {}) } });
    }

    return providers;
  }

  private async syncToSupabase(record: unknown): Promise<void> {
    if (!this.supabaseClient) {
      throw new Error('Supabase client is not configured');
    }

    const { error } = await this.supabaseClient.from('sync_records').insert([{ data: record, created_at: new Date().toISOString() }]);
    if (error) {
      throw new Error(error.message);
    }
  }

  private async syncToFirebase(record: unknown): Promise<void> {
    if (!this.config.firebaseUrl) {
      throw new Error('Firebase URL is not configured');
    }

    const endpoint = `${this.config.firebaseUrl.replace(/\/$/, '')}/sync_records.json${this.config.firebaseAuthToken ? `?auth=${encodeURIComponent(this.config.firebaseAuthToken)}` : ''}`;
    await this.postJson(endpoint, { data: record, createdAt: new Date().toISOString() }, { 'Content-Type': 'application/json' });
  }

  private postJson(endpoint: string, payload: unknown, headers: Record<string, string>): Promise<{ statusCode?: number }> {
    return new Promise((resolve, reject) => {
      const url = new URL(endpoint);
      const transport = url.protocol === 'https:' ? https : http;
      const request = transport.request(
        {
          hostname: url.hostname,
          port: url.port,
          path: `${url.pathname}${url.search}`,
          method: 'POST',
          headers
        },
        (response) => {
          let body = '';
          response.on('data', (chunk) => {
            body += chunk.toString();
          });
          response.on('end', () => {
            if (response.statusCode && response.statusCode >= 200 && response.statusCode < 300) {
              resolve({ statusCode: response.statusCode });
            } else {
              reject(new Error(`Backend rejected request with ${response.statusCode}: ${body}`));
            }
          });
        }
      );

      request.on('error', (error) => {
        reject(error);
      });

      request.write(JSON.stringify(payload));
      request.end();
    });
  }
}
