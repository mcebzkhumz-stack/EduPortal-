# EduPortal

A multi-school management platform for MNK Investments — built as a single self-contained HTML file (no build step, no dependencies to install).

## Live site

Once GitHub Pages is enabled on this repo (Settings → Pages → Deploy from branch → `main` / root), the app is served at:

```
https://YOUR-USERNAME.github.io/YOUR-REPO-NAME/
```

## Storage backend

The app persists data using a tiered fallback system, checked in this order:

1. **`window.storage`** — Claude.ai's built-in cloud storage, active automatically when previewed inside Claude.ai.
2. **Firebase Firestore** — used everywhere else (GitHub Pages, custom domains, etc.), once `FIREBASE_CONFIG` near the top of the main `<script>` block in `index.html` is filled in with your Firebase project's credentials. See the setup instructions in the comment directly above `FIREBASE_CONFIG` in the file.
3. **A JSON-storage bin** (extendsclass.com) — an older fallback, used only if no Firebase config is set but a bin ID is passed via URL (`?storage=BIN_ID`).
4. **`localStorage`** — last resort, device/browser-only, no cross-device sync. A banner appears in the app when running in this mode.

**Before deploying for real multi-user use**, fill in `FIREBASE_CONFIG` and set the Firestore security rules described in the code comments — otherwise every device will have its own isolated, unsynced copy of the data.

## Deploying updates

This repo has no build process. To update the live site:

1. Edit `index.html` directly (on GitHub, or locally and push).
2. Commit and push to `main`.
3. GitHub Pages redeploys automatically within a minute or two.

## Local testing

Just open `index.html` directly in a browser, or serve it locally:

```bash
python3 -m http.server 8000
```

then visit `http://localhost:8000`.

Note: the Firebase tier will still work when testing locally, since Firestore is reached over the internet regardless of where the HTML is served from.
