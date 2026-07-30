# EduPortal

A single-file school management platform (Owner, Principal, Teacher, Student,
Bursar, Librarian, Parent) with per-school customization, a tertiary/academic
suite, live calls, and a digital whiteboard. Everything runs client-side out
of `index.html`; this repo just adds the small set of static files that make
it installable, offline-tolerant, and deployable as a real site.

## What's in this repo

| File | Purpose |
|---|---|
| `index.html` | The entire application. |
| `manifest.json` | Web app manifest — lets people "Add to Home Screen". |
| `service-worker.js` | Minimal offline cache for the app shell (not app data). |
| `icons/eduportal-icon.svg` | App icon used by the manifest, favicon, and browserconfig. |
| `browserconfig.xml` | Windows/Edge tile theming. |
| `.github/workflows/deploy.yml` | Builds and publishes the site to GitHub Pages on every push to `main`. |
| `.nojekyll` | Tells GitHub Pages to serve files as-is, skipping Jekyll processing. |

## 1. Deploy to GitHub Pages

1. Push this repo's contents to a GitHub repository (public or private — Pages works with either on a paid plan; public repos get it free).
2. In the repo, go to **Settings → Pages** and set **Source** to **GitHub Actions**.
3. Push to `main` (or run the workflow manually from the **Actions** tab). The included workflow will:
   - Stamp the real commit SHA and deploy timestamp into `index.html`'s build-info placeholders (this only touches the deployed copy, never your source).
   - Publish everything to Pages.
4. Your site will be live at `https://<your-username>.github.io/<repo-name>/`.

No build step, bundler, or `npm install` is needed — it's static files.

## 2. GitHub auto-connect (repository sync)

The app already knows which repository it's hosted in: on load, it reads its
own GitHub Pages URL (`https://OWNER.github.io/REPO/...`) and automatically
fills in the owner, repo, and branch used for its optional GitHub-backed data
sync (Owner Console → GitHub Registry Sync). You don't need to type those in.

To turn sync on, you still need to paste in a **Personal Access Token** once,
in that same panel:

- Use a **fine-grained token scoped to only this one repository**, with
  **Contents: Read and write** permission — not a broad classic token.
- This is a static, browser-only app with no server of its own. The token is
  stored in that browser and sent straight to `api.github.com` — it is not
  hidden from anyone with access to that device. Don't paste a real token
  into a copy of this file you hand to someone else.
- If you ever want to point sync at a *different* repository than the one
  hosting the site, you can type different values into that panel — the app
  will remember that as a deliberate choice and stop auto-detecting.

## 3. Optional: Firebase (cross-device real-time sync)

Without Firebase, the app still fully works using an online-store/localStorage
fallback. To enable real-time cross-device sync (needed for things like the
live whiteboard broadcast and instant messaging), open `index.html`, find the
`FIREBASE_CONFIG` block near the top of the `<script>`, and replace the
`PASTE_...` placeholders with values from your own Firebase project. This is
optional and the app clearly logs a console warning (not an error) when it's
left unconfigured.

## 4. Branding

Swap `icons/eduportal-icon.svg` for your own logo (keep the filename, or
update the three references to it in `index.html`'s `<head>` and in
`manifest.json` / `browserconfig.xml`). The Owner Console also has per-school
customization (accent colors, disabled roles/tabs) that doesn't require
touching any files.

## Local preview

Just open `index.html` in a browser — no server required for basic use.
Some features (manifest install prompt, service worker) only activate when
served over `http(s)://`, e.g. via `python3 -m http.server` from this folder.
