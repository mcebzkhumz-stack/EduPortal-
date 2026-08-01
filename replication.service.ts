import { SyncRecord, buildSyncRecord } from './sync-record';

export class ReplicationService {
  private readonly dataStore = new Map<string, SyncRecord>();

  public async replicate(record: SyncRecord): Promise<{ success: boolean; message: string }> {
    this.dataStore.set(record.id, record);
    return { success: true, message: 'Data replicated successfully' };
  }

  public async replicateData(deviceId: string, data: unknown): Promise<{ success: boolean; message: string; recordId: string }> {
    const record = buildSyncRecord(deviceId, data);
    this.dataStore.set(record.id, record);
    return { success: true, message: 'Data replicated successfully', recordId: record.id };
  }

  public getData(id: string): SyncRecord | undefined {
    return this.dataStore.get(id);
  }

  public deleteData(id: string): void {
    this.dataStore.delete(id);
  }

  public listData(): SyncRecord[] {
    return Array.from(this.dataStore.values());
  }
}