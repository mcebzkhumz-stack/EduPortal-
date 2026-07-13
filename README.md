# EduPortal

Single-file school management and e-learning platform (StudyMate — EduPortal Core).

## Deploy to GitHub Pages

1. Push this repo's contents (`index.html`, `.nojekyll`) to a GitHub repository.
2. In the repo: **Settings → Pages → Build and deployment → Source** = `Deploy from a branch`.
3. Branch = `main` (or your default), folder = `/ (root)`. Save.
4. Wait a minute, then visit `https://<your-username>.github.io/<repo-name>/`.

`.nojekyll` is included so GitHub Pages serves the file as-is without Jekyll processing (important since the file contains characters/paths Jekyll could otherwise mangle).

## Firebase (optional — enables cross-device Full Data Sync)

Without configuration, EduPortal runs fully client-side on `localStorage`. To enable shared/synced storage across devices:

1. Create a free Firebase project at https://console.firebase.google.com.
2. Project settings → General → Your apps → Web app (`</>`) → copy the config object.
3. Open `index.html`, find `const FIREBASE_CONFIG = {...}` (search for `PASTE_YOUR_API_KEY_HERE`), and paste in your real values.
4. Firestore Database → Create database → Production mode → pick a region.
5. Firestore → Rules → publish:
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /eduportal_kv/{docId} {
         allow read, write: if true;
       }
     }
   }
   ```
6. Commit and push. The app auto-detects a configured `apiKey` and switches from localStorage to Firestore-backed sync.

## Notes

- Everything (HTML, CSS, JS) lives in `index.html`; the only external requests are the two Firebase SDK `<script>` tags loaded from `gstatic.com`, which only matter if you've filled in `FIREBASE_CONFIG`.
- Validated: JS parses cleanly (`node --check`), HTML has no duplicate IDs or unclosed tags, and CSS/link markup passes HTML5 validation (the validator's `inset` / `aspect-ratio` / `scrollbar-width` "unknown property" warnings are false positives from an outdated CSS spec list — all three are standard, widely supported properties).
