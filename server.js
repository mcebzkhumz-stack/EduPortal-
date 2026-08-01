const express = require('express');
const fs = require('fs');
const path = require('path');

const port = process.env.PORT || 8000;
const root = __dirname;
const syncStorePath = path.join(__dirname, '.sync-store.json');

function loadSyncRecords() {
  try {
    const raw = fs.readFileSync(syncStorePath, 'utf8');
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    if (error.code === 'ENOENT') {
      return [];
    }
    console.error('Failed to load sync store:', error);
    return [];
  }
}

function saveSyncRecords(records) {
  try {
    fs.writeFileSync(syncStorePath, JSON.stringify(records, null, 2), 'utf8');
  } catch (error) {
    console.error('Failed to save sync store:', error);
  }
}

function buildSyncRecord(payload) {
  const recordId = payload.recordId || `sync-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return {
    id: recordId,
    deviceId: payload.deviceId || 'unknown-device',
    source: payload.source || 'browser',
    timestamp: payload.timestamp || Date.now(),
    syncedAt: new Date().toISOString(),
    payload
  };
}

const app = express();
app.use(express.json({ limit: '10mb' }));

app.post('/api/sync/sync', (req, res) => {
  const syncPayload = req.body;
  if (!syncPayload || typeof syncPayload !== 'object') {
    return res.status(400).json({ success: false, message: 'Invalid sync payload.' });
  }

  const record = buildSyncRecord(syncPayload);
  const allRecords = loadSyncRecords();
  allRecords.push(record);
  saveSyncRecords(allRecords);

  return res.json({
    success: true,
    message: 'Data synchronized successfully.',
    recordId: record.id,
    syncedAt: record.syncedAt
  });
});

app.get('/api/sync/records', (req, res) => {
  const allRecords = loadSyncRecords();
  const since = Number(req.query.since) || 0;
  const filteredRecords = since > 0 ? allRecords.filter((record) => record.timestamp > since) : allRecords;
  return res.json(filteredRecords);
});

app.get('/api/sync/status', (req, res) => {
  const allRecords = loadSyncRecords();
  return res.json({
    success: true,
    message: 'Sync server is healthy.',
    recordCount: allRecords.length,
    lastUpdated: new Date().toISOString()
  });
});

app.use(express.static(root, { dotfiles: 'ignore' }));
app.get('*', (req, res) => {
  res.sendFile(path.join(root, 'index.html'));
});

app.listen(port, () => {
  console.log(`EduPortal server running at http://localhost:${port}`);
});
