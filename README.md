# EduPortal

A single-file, multi-school educational web platform (StudyMate — EduPortal
Core) for schools in Eswatini. Role-based portals for Principal, Deputy,
Teacher, Student, Admin, Librarian, and IT, plus an Owner Console for
managing every school from one place.

## What's in this repo

```
index.html            The entire app — HTML, CSS, and JS in one file
manifest.json          PWA manifest (install prompt, icons, theme color)
browserconfig.xml       Windows tile config
service-worker.js       Offline app-shell caching (same-origin only)
icons/eduportal-icon.svg
.nojekyll               Tells GitHub Pages to serve files as-is, no Jekyll build
```

Everything the app needs at runtime — school data, users, grades,
announcements, etc. — is stored client-side (browser storage / an optional
cloud backend), not in this repo. This repo is just the app shell.

## Deploying to GitHub Pages

1. Push this repo's contents to the root of a GitHub repository (or to a
   `docs/` folder, or a `gh-pages` branch — whichever you point Pages at).
2. In the repo, go to **Settings → Pages**, set the source to the branch/folder
   you pushed to, and save.
3. GitHub will publish it at `https://<your-username>.github.io/<repo-name>/`.
   It can take a minute or two the first time.
4. Once live, share a school's link as `https://.../index.html?school=<id>` —
   the Owner Console's "Copy Link" button on each school builds this for you.

`.nojekyll` is included so GitHub Pages doesn't run its default Jekyll build
step, which isn't needed here and can otherwise interfere with how static
files are served.

## Setting up GitHub sync from the Owner Console

Once the Owner Console has schools registered, its **GitHub Registry Sync**
and **Full Data Sync** panels can mirror data into a GitHub repository (this
can be the same repo as the site, or a separate private one — a separate
repo is recommended so school data isn't sitting in the same place as the
public site code).

1. Create a **fine-grained personal access token**:
   `https://github.com/settings/tokens/new`
   - Scope it to **only** the repository you're syncing into.
   - Grant **Contents: Read and write** — nothing else is needed.
2. In the Owner Console's GitHub Registry Sync panel, enter the token, the
   repo owner/org, repo name, branch, and a file path, then **Save settings**
   and **Push registry now** once to create the initial commit.
3. Optionally enable **Full Data Sync** underneath it to mirror the entire
   app database (every school's users, grades, materials, everything) —
   this fires automatically after any change anywhere in the app once
   turned on.

**Security note:** this is a static, browser-only app with no server of its
own. Any token entered in these panels is stored in that browser and sent
directly to `api.github.com` from the page — it is not hidden from anyone
with access to that device. That's why a fine-grained, single-repo,
Contents-only token is important rather than a broad classic token.

## Local preview

No build step — just open `index.html` in a browser, or serve the folder
with any static file server (`python3 -m http.server`, VS Code's Live
Server, etc.) if you want the service worker and manifest to register
properly (service workers require `http://` or `https://`, not `file://`).
