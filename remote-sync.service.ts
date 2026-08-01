import https from 'https';
import http from 'http';

export interface RemoteSyncConfig {
  enabled: boolean;
  endpoint: string;
  apiKey?: string;
}

export class RemoteSyncService {
  constructor(private readonly config: RemoteSyncConfig) {}

  async syncRecord(record: unknown): Promise<{ success: boolean; message: string }> {
    if (!this.config.enabled || !this.config.endpoint) {
      return { success: true, message: 'Remote sync is disabled; local backup is still preserved.' };
    }

    return new Promise((resolve, reject) => {
      const transport = this.config.endpoint.startsWith('https') ? https : http;
      const req = transport.request(
        this.config.endpoint,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(this.config.apiKey ? { Authorization: `Bearer ${this.config.apiKey}` } : {})
          }
        },
        (res) => {
          let body = '';
          res.on('data', (chunk) => {
            body += chunk;
          });
          res.on('end', () => {
            if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
              resolve({ success: true, message: `Remote sync accepted (${res.statusCode})` });
            } else {
              reject(new Error(`Remote sync failed (${res.statusCode}): ${body}`));
            }
          });
        }
      );

      req.on('error', (error) => {
        reject(error);
      });

      req.write(JSON.stringify(record));
      req.end();
    });
  }
}
