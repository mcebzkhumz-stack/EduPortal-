import { promises as fs } from 'fs';
import path from 'path';
import { ENV } from '../config/env';

export class BackupService {
  constructor(private readonly backupDirectory: string = path.resolve(ENV.BACKUP_PATH)) {
    void fs.mkdir(this.backupDirectory, { recursive: true });
  }

  async createBackup(data: unknown, backupName?: string): Promise<{ success: boolean; backupName: string; path: string }> {
    const safeName = backupName || `backup-${Date.now()}`;
    const backupPath = path.join(this.backupDirectory, `${safeName}.json`);
    await fs.writeFile(backupPath, JSON.stringify(data, null, 2));
    return { success: true, backupName: safeName, path: backupPath };
  }

  async restoreBackup(backupName: string): Promise<unknown> {
    const backupPath = path.join(this.backupDirectory, `${backupName}.json`);
    const data = await fs.readFile(backupPath, 'utf-8');
    return JSON.parse(data);
  }

  async listBackups(): Promise<string[]> {
    const files = await fs.readdir(this.backupDirectory);
    return files.filter((file) => file.endsWith('.json')).map((file) => file.replace('.json', ''));
  }
}