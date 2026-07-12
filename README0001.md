This folder is where per-school link-preview images belong once generated.

For each school, Owner Console → Registered Schools → **Search Setup**
downloads two files for that school:

- `{schoolId}.png` — the 1200×630 link-preview banner (now includes that
  school's own badge and, if uploaded, one of its photos)
- `{schoolId}-logo.png` — a square logo-only version (badge, or a lettered
  placeholder if no badge is set)

Drop both into this folder and commit them — `index.html`'s meta tags and
structured data already point at `/og-images/{schoolId}.png` and
`/og-images/{schoolId}-logo.png` for every school, so nothing else needs to
change once the files are here.

Re-download and replace them any time a school's badge or photos change.
