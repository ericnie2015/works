# Photography Portfolio (Auto from `images/`)

This is a plain HTML/CSS/JS photography website for GitHub Pages.  
It auto-builds `Works -> Series -> Photo` directly from your repository folders.

## How Auto Mode Works

- Every folder under `images/` becomes one series.
- Every image file inside that folder is shown automatically.
- No `data.js`, no `thumbs` folder, no manual photo list.

Example:

- `images/street-notes/IMG_0012.jpg`
- `images/street-notes/IMG_0013.jpg`
- `images/coastal-wind/DSC_4410.jpg`

## Files

- `index.html`: redirects to `works.html`
- `works.html`: series list page (auto loads folders)
- `series.html`: photo grid page (auto loads images in one folder)
- `photo.html`: single photo page
- `app.js`: GitHub API loader logic
- `site-config.js`: site title/nav/repo config
- `styles.css`: visual style

## Add Your Photos

1. Create folders under `images/` (folder name = series slug).
2. Upload images into each folder.
3. Commit and push to `main`.
4. Refresh your Pages site in about 30-90 seconds.

## Optional Config

Edit `site-config.js` if needed:

- `siteTitle`
- `nav`
- `owner`
- `repo`
- `imagesRoot`

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

