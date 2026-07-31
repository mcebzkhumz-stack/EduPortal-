import { Router } from 'express';
import { SyncService } from '../services/sync.service';

export const syncRoutes = Router();
const syncService = new SyncService();

syncRoutes.post('/sync', async (req, res) => {
  try {
    const deviceId = typeof req.headers['x-device-id'] === 'string' ? req.headers['x-device-id'] : 'default-device';
    const result = await syncService.syncData(req.body, deviceId);
    res.status(200).json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Synchronization failed';
    res.status(500).json({ message, error: message });
  }
});

syncRoutes.get('/status', async (_req, res) => {
  try {
    const status = await syncService.getSyncStatus();
    res.status(200).json(status);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to retrieve sync status';
    res.status(500).json({ message, error: message });
  }
});

export default syncRoutes;