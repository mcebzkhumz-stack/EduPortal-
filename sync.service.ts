import { BackupService } from './backup.service';
import { ReplicationService } from './replication.service';
import { RemoteSyncService } from './remote-sync.service';
import { MultiBackendSyncService } from './multi-backend-sync.service';
import { SyncRecord, buildSyncRecord } from '../models/sync-record';
import { ENV } from '../config/env';

export class SyncService {
  constructor(
    private readonly replicationService: ReplicationService = new ReplicationService(),
    private readonly backupService: BackupService = new BackupService(),
    private readonly remoteSyncService: RemoteSyncService = new RemoteSyncService({
      enabled: ENV.REMOTE_SYNC_ENABLED,
      endpoint: ENV.REMOTE_SYNC_ENDPOINT,
      apiKey: ENV.REMOTE_SYNC_API_KEY
    }),
    private readonly multiBackendSyncService: MultiBackendSyncService = new MultiBackendSyncService({
      supabaseUrl: ENV.SUPABASE_URL,
      supabaseKey: ENV.SUPABASE_KEY,
      firebaseUrl: ENV.FIREBASE_URL,
      firebaseAuthToken: ENV.FIREBASE_AUTH_TOKEN,
      remoteEndpoint: ENV.REMOTE_SYNC_ENDPOINT,
      remoteApiKey: ENV.REMOTE_SYNC_API_KEY
    })
  ) {}

  async syncData(data: unknown, deviceId = 'default-device'): Promise<{ success: boolean; message: string; recordId?: string }> {
    if (data === null || data === undefined) {
      throw new Error('Invalid data for synchronization');
    }

    const record: SyncRecord = buildSyncRecord(deviceId, data);
    await this.backupService.createBackup(record, record.id);
    await this.replicationService.replicate(record);
    await this.remoteSyncService.syncRecord(record);
    const backendResult = await this.multiBackendSyncService.syncRecord(record);

    return { success: true, message: backendResult.message, recordId: record.id };
  }

  async getSyncStatus(): Promise<{ success: boolean; message: string; lastSyncedAt: string }> {
    return {
      success: true,
      message: 'Sync service is healthy',
      lastSyncedAt: new Date().toISOString()
    };
  }
}