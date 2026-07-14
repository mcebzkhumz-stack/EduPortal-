# EduPortal

A single-file, multi-school management and learning portal (`index.html`)
built for MNK Investments — school registration, role-based dashboards
(Student, Teacher, Principal/Dean, Deputy, Administration, Librarian, IT
Management), a full Tertiary/university mode, and an Owner Console for
managing every school from one place. Everything runs client-side; there's
no backend server to deploy.

This repo is the deploy-ready scaffold around that one file: the extra
static assets it references (icons, manifest, service worker, SEO files)
plus a GitHub Action that publishes it to GitHub Pages automatically.

## Repo layout

```
index.html                     the entire app
manifest.json                  PWA manifest ("Add to Home Screen")
service-worker.js              minimal offline app-shell cache
icons/eduportal-icon.svg       app icon
browserconfig.xml              Windows tile config
robots.txt / sitemap.xml       placeholders — see "Search engine setup" below
.well-known/security.txt       responsible-disclosure contact (expires yearly)
og-images/                     per-school link-preview images go here
.github/workflows/deploy.yml   GitHub Pages deploy action
proxy/                         optional Cloudflare Worker to hide the GitHub token (see proxy/README.md)
```

## Deploy to GitHub Pages

1. Push this repo to GitHub.
2. Repo → **Settings → Pages → Build and deployment → Source** → **GitHub
   Actions**. That's it — `.github/workflows/deploy.yml` handles the rest
   on every push to `main`.
3. Once deployed, the site is live at `https://{you}.github.io/{repo}/`
   (or your custom domain, if you've set one up under Settings → Pages).

The workflow also stamps the real commit SHA and deploy time into
`index.html` in place of the `__BUILD_SHA__` / `__BUILD_DATE__`
placeholders, so the small build-info line near the bottom of the app shows
exactly which version is live. Opening the file straight from disk (or from
a Claude artifact) will always show "Dev build" instead — that's expected,
not a problem.

## First run

Open the deployed site once with no `?school=` in the URL to land on the
Owner Console sign-in (**Staff Sign In** on the landing page). The very
first Owner account you set up controls every school registered afterward.

## GitHub sync (optional, from inside the app)

Owner Console → **GitHub Registry Sync** can mirror the school directory —
and a second, simpler file of just school emails — into a GitHub repo of
your choice (this one or a separate one), auto-pushing on every
registration, edit, suspend/activate, or delete. Owner Console → **Full
Data Sync** can mirror the *entire* app database the same way. Both need:

- A **fine-grained GitHub Personal Access Token**, scoped to only the
  target repo's Contents (read/write) — not a broad classic token.
- The repo owner/org and repo name.

Because this is a static app with no server, that token is stored in the
browser and sent straight to `api.github.com` from there — see the warning
shown in the panel itself. If that's a concern, use the optional Cloudflare
Worker proxy in `proxy/` instead (`proxy/README.md` has setup steps) so the
real token stays server-side.

## Search engine setup (per school)

Owner Console → Registered Schools → **Search Setup**, per school,
downloads:

- `{schoolId}-sitemap.xml` / `{schoolId}-robots.txt`
- `{schoolId}.png` — a 1200×630 link-preview banner, baked with that
  school's own badge and (if uploaded) one of its photos
- `{schoolId}-logo.png` — a square logo-only version

Drop the banner and logo into `og-images/` (see `og-images/README.md`).
There's also a combined sitemap covering every discoverable school at once
(Owner Console → same panel → master sitemap download) — use that instead
of stitching the per-school ones together by hand, and replace the
placeholder `sitemap.xml` / `robots.txt` at the repo root with it.

Tertiary schools get schema.org's `CollegeOrUniversity` type automatically
in their structured data instead of the generic `EducationalOrganization`.

None of this creates a Google Business Profile (the tabs/reviews/hours/map
card you get when searching an established institution) — that's a
separate, free listing claimed at
[business.google.com](https://business.google.com) once the site is public.
This just gives Google accurate data to work with when it crawls the page.

## Updating the icon / manifest / service worker

If you change the app's branding, regenerate `manifest.json` and
`service-worker.js` to stay in sync — their exact contents are produced by
`generateManifestJson()` / `generateServiceWorkerJs()` inside `index.html`,
so copy from there (or wire a download button to them, the same way
Search Setup already does for the other generated files) rather than
hand-editing this repo's copies out of sync with the app.
