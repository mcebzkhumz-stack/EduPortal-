(function () {
  const DEFAULT_SERVER = /^https?:/.test(window.location.origin)
    ? window.location.origin
    : '';
  const SYNC_ENDPOINT = '/api/sync';
  const DEVICE_ID_KEY = 'eduportal_device_id';

  function getDeviceId() {
    let deviceId = localStorage.getItem(DEVICE_ID_KEY);
    if (!deviceId) {
      deviceId = `device-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      localStorage.setItem(DEVICE_ID_KEY, deviceId);
    }
    return deviceId;
  }

  function getSnapshot() {
    const localEntries = {};
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (key) {
        localEntries[key] = localStorage.getItem(key);
      }
    }

    const sessionEntries = {};
    for (let i = 0; i < sessionStorage.length; i += 1) {
      const key = sessionStorage.key(i);
      if (key) {
        sessionEntries[key] = sessionStorage.getItem(key);
      }
    }

    return {
      deviceId: getDeviceId(),
      source: 'browser',
      pageTitle: document.title,
      url: window.location.href,
      timestamp: Date.now(),
      storage: {
        localStorage: localEntries,
        sessionStorage: sessionEntries
      },
      documentBody: document.body ? document.body.innerText.slice(0, 4000) : ''
    };
  }

  function getSyncServerUrl() {
    const serverUrl = window.__EDU_SYNC_SERVER__ || DEFAULT_SERVER;
    return /^https?:/.test(serverUrl) ? serverUrl : '';
  }

  async function pushToSyncServer(payload) {
    const serverUrl = getSyncServerUrl();
    if (!serverUrl) {
      console.warn(
        'EduPortalSync disabled: no valid HTTP sync server configured for file:// or invalid origin.',
      );
      return { ok: false, skipped: true, message: 'No sync server available.' };
    }

    const response = await fetch(`${serverUrl}${SYNC_ENDPOINT}/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Sync request failed: ${response.status}`);
    }

    return response.json();
  }

  async function fetchSyncRecords() {
    const serverUrl = getSyncServerUrl();
    if (!serverUrl) {
      return [];
    }

    const response = await fetch(`${serverUrl}${SYNC_ENDPOINT}/records`, {
      headers: {
        Accept: 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch sync records: ${response.status}`);
    }

    return response.json();
  }

  function mergeRemoteStorage(records) {
    const remoteRecords = records.filter((record) => record.deviceId !== getDeviceId());
    remoteRecords.forEach((record) => {
      const payload = record.payload || {};
      const storage = payload.storage || {};

      const localStorageEntries = storage.localStorage || {};
      Object.keys(localStorageEntries).forEach((key) => {
        if (key && localStorageEntries[key] != null) {
          try {
            localStorage.setItem(key, localStorageEntries[key]);
          } catch (error) {
            console.warn('EduPortalSync could not merge localStorage key:', key, error);
          }
        }
      });

      const sessionStorageEntries = storage.sessionStorage || {};
      Object.keys(sessionStorageEntries).forEach((key) => {
        if (key && sessionStorageEntries[key] != null) {
          try {
            sessionStorage.setItem(key, sessionStorageEntries[key]);
          } catch (error) {
            console.warn('EduPortalSync could not merge sessionStorage key:', key, error);
          }
        }
      });
    });

    return remoteRecords.length;
  }

  window.EduPortalSync = {
    async sync() {
      const payload = getSnapshot();
      const pushResult = await pushToSyncServer(payload);
      const records = await fetchSyncRecords();
      const mergedCount = mergeRemoteStorage(records);
      return { pushResult, mergedCount, records };
    },
    async status() {
      const serverUrl = getSyncServerUrl();
      if (!serverUrl) {
        return { success: false, skipped: true, message: 'No sync server available.' };
      }
      const response = await fetch(`${serverUrl}${SYNC_ENDPOINT}/status`);
      return response.ok ? response.json() : { success: false, status: response.status };
    }
  };
  async function startAutoSync() {
    try {
      const result = await window.EduPortalSync.sync();
      if (result && result.pushResult && result.pushResult.skipped) {
        console.info('EduPortalSync skipped because no sync server is configured.');
      }
    } catch (error) {
      console.warn('EduPortalSync failed during auto sync:', error);
    }
  }

  window.addEventListener('load', () => {
    startAutoSync();
    setInterval(startAutoSync, 30000);
  });
})();
