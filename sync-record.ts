import crypto from 'crypto';

export interface SyncRecord {
  id: string;
  deviceId: string;
  payload: unknown;
  timestamp: number;
  version: number;
  checksum: string;
}

export function buildSyncRecord(deviceId: string, payload: unknown): SyncRecord {
  const payloadString = JSON.stringify(payload ?? {});

  return {
    id: `${deviceId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    deviceId,
    payload,
    timestamp: Date.now(),
    version: 1,
    checksum: crypto.createHash('sha256').update(payloadString).digest('hex')
  };
}