# EduPortal

A single-file, multi-school education platform (StudyMate — EduPortal Core). Everything the app needs to run lives in `index.html`; the other files in this repo make it deployable and keep a hosted copy auto-updating.

## 1. Push this to a repository

```bash
git init
git add .
git commit -m "Initial EduPortal deployment package"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```

## 2. Turn on GitHub Pages (one-time)

In the repo on GitHub: **Settings → Pages → Build and deployment → Source → GitHub Actions**.

That's it — no branch to pick, no folder to point at. The workflow in `.github/workflows/deploy.yml` handles the rest.

## 3. Auto-sync / auto-deploy

From here on, deployment is automatic:

- Every push to `main` triggers `.github/workflows/deploy.yml`, which stamps the real commit SHA and deploy time into `index.html` (replacing the `__BUILD_SHA__` / `__BUILD_DATE__` placeholders) and publishes the site to GitHub Pages. Live in a minute or two after every push — no manual "deploy" step.
- The small build-info line in the bottom-right corner of the live app confirms which commit is actually running.
- You can also trigger a deploy manually from the **Actions** tab (`Deploy EduPortal to GitHub Pages → Run workflow`).

This covers *code* deploys. The app also has its own **data** auto-sync, configured from inside the app itself (Owner Console):

- **GitHub Registry Sync** — mirrors the school directory to a JSON file in a repo of your choice, pushed automatically on every register/edit/suspend/activate/delete.
- **Full Data Sync** — mirrors the entire app database (one JSON file per school), pushed automatically on any change anywhere in the app, using GitHub's Git Data API so it isn't capped at 1MB.

Both need a GitHub Personal Access Token, entered once in the Owner Console:
1. Create a **fine-grained token** at https://github.com/settings/tokens/new, scoped to only the repo you want the data pushed to, with Contents read/write.
2. In EduPortal: Owner Console → **GitHub Registry Sync** (and/or **Full Data Sync**) → paste the token, repo owner, repo name, branch, and file path(s) → Save.
3. From then on it syncs itself — no further manual steps.

If you'd rather not keep the token in the browser at all, use the optional Cloudflare Worker proxy in `proxy/` instead (see `proxy/worker.js` for setup) and point the "Route through a proxy" fields at it.

## Files in this repo

| Path | Purpose |
|---|---|
| `index.html` | The entire app — UI, logic, and storage layer |
| `manifest.json` | PWA manifest (Add to Home Screen) |
| `service-worker.js` | Minimal offline app-shell cache |
| `icons/eduportal-icon.svg` | App icon (favicon, home-screen icon, Windows tile) |
| `browserconfig.xml` | Windows tile config |
| `.nojekyll` | Tells GitHub Pages to serve the site as-is, no Jekyll processing |
| `.github/workflows/deploy.yml` | Auto-deploys to Pages on every push |
| `proxy/` | Optional Cloudflare Worker so a GitHub token doesn't have to sit in the browser |

## Notes

- This is a static, client-only app — there's no backend server. Data lives in the browser (and, optionally, wherever you point the GitHub sync or a Firebase project) rather than on GitHub Pages itself.
- If you ever change the app's branding, regenerate `icons/eduportal-icon.svg` to match — nothing else needs to change, since `manifest.json` and the `<head>` links already point at that fixed path.
- `manifest.json` and `service-worker.js` here match what the app's own Owner Console can (re)generate and download, if you ever need to recreate them from scratch.
