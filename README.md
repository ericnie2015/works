# Photography Portfolio (Static, GitHub Pages)

This is a plain HTML/CSS/JS photography website inspired by a "Works -> Series -> Photo" structure.

## Files

- `index.html`: redirects to `works.html`
- `works.html`: series list page
- `series.html`: series gallery page
- `photo.html`: single photo page
- `data.js`: all site content (title, nav, series, photos)
- `styles.css`: visual style

## Add Your Photos

1. Create folders under `images/`, for example:
   - `images/street-notes/thumbs/`
   - `images/street-notes/full/`
2. Put thumbnail files into `thumbs/` and large files into `full/`.
3. Update `data.js`:
   - `siteTitle`
   - `series[].title`, `years`, `description`
   - each `photos[]` item: `id`, `title`, `thumb`, `full`, `caption`

## Local Preview

If you have Python:

```bash
python -m http.server 8000
```

Open `http://localhost:8000/works.html`.

## Deploy to GitHub Pages

1. Create a new GitHub repository (for example `my-photo-site`).
2. Push this folder to GitHub:

```bash
git init
git add .
git commit -m "Initial photography portfolio site"
git branch -M main
git remote add origin https://github.com/<your-username>/<repo-name>.git
git push -u origin main
```

3. On GitHub: `Settings -> Pages`
   - Source: `Deploy from a branch`
   - Branch: `main`
   - Folder: `/ (root)`
4. Save and wait 1-3 minutes.
5. Your site URL will be:
   - `https://<your-username>.github.io/<repo-name>/`

