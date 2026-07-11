# EduPortal — Working Directory

This is the multi-file working version of the EduPortal single-file app
(`eduportal-index.html`), split out for easier day-to-day development. The
app's behavior is unchanged — this is purely a reorganization, not a rewrite.

## Structure

```
eduportal-project/
├── index.html          Page shell: <head> meta/SEO tags + all HTML markup
├── css/
│   └── styles.css       Every style rule (was the inline <style> block)
├── js/
│   └── app.js            All application logic (was the inline <script> block)
├── icons/
│   └── eduportal-icon.svg   App icon referenced by manifest.json / favicon
├── manifest.json        Basic PWA manifest (new — index.html already linked
│                         to manifest.json and an icon; both were missing
│                         files, so minimal versions are included now)
└── README.md             This file
```

## Running it locally

Because `index.html` now loads `css/styles.css` and `js/app.js` as separate
files (rather than inlining them), opening `index.html` directly via
`file://` works in most browsers, but a couple of things behave better over
a real local server:

- **Video/audio calls** (WebRTC camera/mic access) require a secure context
  — `https://` or `http://localhost` — browsers block camera/mic on plain
  `file://` pages.
- The optional **service worker** (`service-worker.js`, not included — the
  app already checks for it gracefully and skips registration if it's
  absent) also needs `http(s)://`.

Simplest way to serve it locally:

```bash
cd eduportal-project
python3 -m http.server 8080
# then open http://localhost:8080
```

Any static file server works the same way (`npx serve`, VS Code's Live
Server extension, etc.) — nothing here needs a build step or dependencies.

## Data storage

The app persists school data to shared online storage (see the "Cloud
storage layer" comment block near the top of `js/app.js`) with a
same-device-only localStorage fallback when no online store is configured.
That configuration (`ONLINE_STORE_BIN_ID` etc.) lives in `js/app.js` and
works the same as it did in the single-file version.

## Editing

- **Markup / structure** → `index.html`
- **Look and feel** → `css/styles.css`
- **Behavior, data, all school/role logic** → `js/app.js`

Everything is still plain HTML/CSS/JS — no bundler, no framework, no
`npm install` required. If you ever want to go back to a single portable
file (e.g. to hand someone one `.html` file to open directly), the three
files can be re-inlined by hand or on request.
