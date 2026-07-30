/* ================================================================
   EduPortal — auth Cloud Functions
   ----------------------------------------------------------------
   These two HTTP functions are the ONLY code allowed to read the
   real password hashes with elevated (Admin SDK) access. The
   browser never checks a password against Firestore directly —
   it POSTs the raw password here over HTTPS, this function hashes
   it the same way the client does (plain SHA-256 hex, no salt —
   matches sha256Hex() in index.html) and compares it to the stored
   hash. On success it mints a Firebase Auth custom token carrying
   the claim(s) firestore.rules checks:

     mintAuthToken  -> { schoolId: "<id>" }   (per-school users)
     mintOwnerToken -> { owner: true }         (Owner Console)

   Deploy with:
     cd functions
     npm install
     firebase deploy --only functions

   Then paste the printed base URL (something like
   https://us-central1-<project>.cloudfunctions.net) into
   FIREBASE_FUNCTIONS_BASE in index.html.
   ================================================================ */

const { onRequest } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');
const crypto = require('crypto');
const corsLib = require('cors');

admin.initializeApp();
const db = admin.firestore();
const cors = corsLib({ origin: true }); // reflects whatever origin calls it (github.io, your custom www domain, etc.)

const KV_COLLECTION = 'eduportal_kv';
const OWNER_NS = 'eduportal_owner_';
function schoolPrefix(id) {
  return (!id || id === 'demo') ? 'studymate_' : `studymate_${id}_`;
}

// Same hashing scheme as sha256Hex() client-side: plain SHA-256 hex, no salt.
function sha256Hex(str) {
  return crypto.createHash('sha256').update(String(str), 'utf8').digest('hex');
}

/* Reads one window.storage-style key straight out of Firestore via the
   Admin SDK (bypasses firestore.rules entirely, which is fine here since
   this code runs server-side, never in the browser). Returns the parsed
   JS value, or `fallback` if the doc doesn't exist / can't be parsed. */
async function readKV(key, fallback) {
  const doc = await db.collection(KV_COLLECTION).doc(key).get();
  if (!doc.exists) return fallback;
  const raw = doc.data().value;
  if (typeof raw !== 'string') return fallback;
  try {
    const parsed = JSON.parse(raw);
    return parsed == null ? fallback : parsed;
  } catch (e) {
    return fallback;
  }
}

function sendJson(res, status, body) {
  res.status(status).json(body);
}

/* ---------------- POST /mintAuthToken ----------------
   Body: { schoolId, username, password }
   Verifies a school-account login and, on success, returns a Firebase
   custom token carrying { schoolId }. */
exports.mintAuthToken = onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== 'POST') return sendJson(res, 405, { ok: false, error: 'POST only.' });
    const { schoolId, username, password } = req.body || {};
    if (!schoolId || !username || !password) {
      return sendJson(res, 400, { ok: false, error: 'schoolId, username and password are required.' });
    }

    try {
      const users = await readKV(`${schoolPrefix(schoolId)}users`, []);
      if (!Array.isArray(users)) return sendJson(res, 200, { ok: false, error: 'No users found for this school.' });

      const user = users.find(u => u && (u.username || '').toUpperCase() === String(username).toUpperCase());
      if (!user) return sendJson(res, 200, { ok: false, error: 'Incorrect username or password.' });
      if (!user.passwordHash) return sendJson(res, 200, { ok: false, error: 'This account has no password set yet.' });

      const hash = sha256Hex(password);
      if (hash !== user.passwordHash) return sendJson(res, 200, { ok: false, error: 'Incorrect username or password.' });

      // Firebase custom-token uid: stable per user, namespaced by school so
      // the same username in two different schools never collides.
      const uid = `school:${schoolId}:${user.id || user.username}`;
      const token = await admin.auth().createCustomToken(uid, {
        schoolId: String(schoolId),
        role: user.role || null,
      });

      return sendJson(res, 200, { ok: true, token, role: user.role || null });
    } catch (e) {
      console.error('mintAuthToken failed', e);
      return sendJson(res, 500, { ok: false, error: 'Sign-in service error.' });
    }
  });
});

/* ---------------- POST /mintOwnerToken ----------------
   Body: { password }
   Verifies the Owner Console password and, on success, returns a
   Firebase custom token carrying { owner: true }. */
exports.mintOwnerToken = onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== 'POST') return sendJson(res, 405, { ok: false, error: 'POST only.' });
    const { password } = req.body || {};
    if (!password) return sendJson(res, 400, { ok: false, error: 'password is required.' });

    try {
      const storedHash = await readKV(`${OWNER_NS}ownerPasswordHash`, null);
      if (!storedHash) return sendJson(res, 200, { ok: false, error: 'Owner password has not been set up yet.' });

      const hash = sha256Hex(password);
      if (hash !== storedHash) return sendJson(res, 200, { ok: false, error: 'Incorrect password.' });

      const token = await admin.auth().createCustomToken('owner', { owner: true });
      return sendJson(res, 200, { ok: true, token });
    } catch (e) {
      console.error('mintOwnerToken failed', e);
      return sendJson(res, 500, { ok: false, error: 'Sign-in service error.' });
    }
  });
});
