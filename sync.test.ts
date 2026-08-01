import { BackupService } from './backup.service';
import { ReplicationService } from './replication.service';
import { SyncService } from './sync.service';
import { RemoteSyncService } from './remote-sync.service';

describe('Global Data Sync Server', () => {
  let syncService: SyncService;
  let replicationService: ReplicationService;
  let backupService: BackupService;

  beforeEach(() => {
    syncService = new SyncService();
    replicationService = new ReplicationService();
    backupService = new BackupService();
  });

  describe('SyncService', () => {
    it('should synchronize data correctly', async () => {
      const data = { id: '1', timestamp: Date.now(), payload: { key: 'value' } };
      const result = await syncService.syncData(data, 'device-1');
      expect(result.success).toBe(true);
      expect(result.message).toBe('Data synchronized successfully');
    });

    it('should handle synchronization errors', async () => {
      await expect(syncService.syncData(null as unknown as Record<string, unknown>)).rejects.toThrow('Invalid data for synchronization');
    });
  });

  describe('ReplicationService', () => {
    it('should replicate data between devices', async () => {
      const deviceId = 'device-1';
      const data = { id: '1', payload: { key: 'value' } };
      const result = await replicationService.replicateData(deviceId, data);
      expect(result.success).toBe(true);
      expect(result.message).toBe('Data replicated successfully');
    });
  });

  describe('BackupService', () => {
    it('should create a backup successfully', async () => {
      const data = { id: '1', payload: { key: 'value' } };
      const result = await backupService.createBackup(data, 'backup-test');
      expect(result.success).toBe(true);
      expect(result.backupName).toBe('backup-test');
    });

    it('should restore a backup successfully', async () => {
      const backupId = 'backup-test';
      const result = await backupService.restoreBackup(backupId);
      expect(result).toBeDefined();
    });
  });

  describe('RemoteSyncService', () => {
    it('should skip remote sync when disabled', async () => {
      const remoteService = new RemoteSyncService({ enabled: false, endpoint: '' });
      const result = await remoteService.syncRecord({
        id: 'local-test',
        deviceId: 'device-1',
        payload: { ok: true },
        timestamp: Date.now(),
        version: 1,
        checksum: 'abc'
      });
      expect(result.success).toBe(true);
      expect(result.message).toContain('disabled');
    });
  });
});