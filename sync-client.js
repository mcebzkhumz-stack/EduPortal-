(function () {
  const DEFAULT_SERVER = 'http://localhost:3000';

  function getSnapshot() {
    const payload = {
      pageTitle: document.title,
      url: window.location.href,
      timestamp: Date.now(),
      storage: {
        localStorage: Object.keys(localStorage).slice(0, 20),
        sessionStorage: Object.keys(sessionStorage).slice(0, 20)
      },
      documentBody: document.body ? document.body.innerText.slice(0, 4000) : ''
    };

    return payload;
  }

  async function pushToSyncServer(payload) {
    const serverUrl = window.__EDU_SYNC_SERVER__ || DEFAULT_SERVER;
    const response = await fetch(`${serverUrl}/api/sync/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Id': 'eduportal-browser'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Sync request failed: ${response.status}`);
    }

    return response.json();
  }

  window.EduPortalSync = {
    async sync() {
      const payload = getSnapshot();
      return pushToSyncServer(payload);
    }
  };

  window.addEventListener('load', () => {
    window.EduPortalSync.sync().catch(() => {
      // Fail silently so the page still works.
    });
  });
})();
