(function () {
  const cfg = window.SITE_CONFIG || {};
  const imageExt = /\.(jpg|jpeg|png|webp|gif)$/i;

  function inferRepoFromLocation() {
    const host = window.location.hostname;
    const parts = window.location.pathname.split("/").filter(Boolean);
    if (host.endsWith(".github.io")) {
      const owner = host.replace(".github.io", "");
      const repo = parts[0] || "";
      return { owner, repo };
    }
    return { owner: cfg.owner || "", repo: cfg.repo || "" };
  }

  function getRepoInfo() {
    const inferred = inferRepoFromLocation();
    return {
      owner: cfg.owner || inferred.owner,
      repo: cfg.repo || inferred.repo,
      imagesRoot: cfg.imagesRoot || "images"
    };
  }

  function titleFromSlug(slug) {
    const map = cfg.seriesNames || {};
    if (map[slug]) return map[slug];
    return slug.replace(/\s+/g, " ").trim();
  }

  function fileName(path) {
    return decodeURIComponent(path.split("/").pop() || "");
  }

  function apiUrl(path) {
    const { owner, repo } = getRepoInfo();
    return `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
  }

  async function fetchContents(path) {
    const res = await fetch(apiUrl(path), {
      headers: { Accept: "application/vnd.github+json" }
    });
    if (!res.ok) {
      throw new Error(`GitHub API error: ${res.status}`);
    }
    return res.json();
  }

  function renderError(targetId, message) {
    const node = document.getElementById(targetId);
    if (!node) return;
    node.innerHTML = `<p class="error">${message}</p>`;
  }

  function initHeader() {
    const title = cfg.siteTitle || "My Photography";
    const navItems = cfg.nav || [{ label: "Works", href: "works.html" }];
    const titleNode = document.getElementById("site-title");
    if (titleNode) titleNode.textContent = title;
    const nav = document.getElementById("top-nav");
    if (!nav) return;
    nav.innerHTML = "";
    navItems.forEach((item) => {
      const a = document.createElement("a");
      a.href = item.href;
      a.textContent = item.label;
      nav.appendChild(a);
    });
  }

  async function loadSeriesList() {
    const list = document.getElementById("series-list");
    if (!list) return;
    list.innerHTML = '<li class="muted">Loading...</li>';
    try {
      const { imagesRoot } = getRepoInfo();
      const entries = await fetchContents(imagesRoot);
      const series = entries.filter((e) => e.type === "dir").sort((a, b) => a.name.localeCompare(b.name));
      list.innerHTML = "";
      if (!series.length) {
        list.innerHTML = '<li class="muted">No series found under images/</li>';
        return;
      }
      series.forEach((s) => {
        const li = document.createElement("li");
        const a = document.createElement("a");
        a.href = `series.html?slug=${encodeURIComponent(s.name)}`;
        a.textContent = titleFromSlug(s.name);
        li.appendChild(a);
        list.appendChild(li);
      });
    } catch (err) {
      renderError("main-content", "Failed to load series from GitHub. Please check repository settings.");
    }
  }

  async function loadSeriesPage() {
    const params = new URLSearchParams(window.location.search);
    const slug = params.get("slug");
    if (!slug) {
      renderError("photo-grid", "Series not found.");
      return;
    }

    const seriesTitle = titleFromSlug(slug);
    document.getElementById("series-title").textContent = seriesTitle;
    document.getElementById("series-subtitle").textContent = `Folder: ${slug}`;
    document.title = `${seriesTitle} | ${cfg.siteTitle || "My Photography"}`;

    const grid = document.getElementById("photo-grid");
    grid.innerHTML = '<p class="muted">Loading...</p>';
    try {
      const { imagesRoot } = getRepoInfo();
      const entries = await fetchContents(`${imagesRoot}/${slug}`);
      const photos = entries
        .filter((e) => e.type === "file" && imageExt.test(e.name))
        .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));

      grid.innerHTML = "";
      if (!photos.length) {
        grid.innerHTML = '<p class="muted">No images found in this series folder.</p>';
        return;
      }

      photos.forEach((p) => {
        const card = document.createElement("a");
        card.className = "thumb-card";
        card.href = `photo.html?series=${encodeURIComponent(slug)}&file=${encodeURIComponent(p.name)}`;
        card.innerHTML = `
          <img src="${p.download_url}" alt="${fileName(p.name)}" loading="lazy" />
          <div class="thumb-meta">
            <p class="thumb-title">${fileName(p.name)}</p>
          </div>
        `;
        grid.appendChild(card);
      });
    } catch (err) {
      grid.innerHTML = '<p class="error">Failed to load this series.</p>';
    }
  }

  async function loadPhotoPage() {
    const params = new URLSearchParams(window.location.search);
    const slug = params.get("series");
    const file = params.get("file");
    if (!slug || !file) {
      renderError("main-content", "Photo not found.");
      return;
    }

    const title = fileName(file);
    const seriesTitle = titleFromSlug(slug);
    document.getElementById("photo-title").textContent = title;
    document.getElementById("photo-subtitle").textContent = `${seriesTitle}`;
    document.getElementById("photo-caption").textContent = title;
    document.getElementById("back-link").href = `series.html?slug=${encodeURIComponent(slug)}`;
    document.getElementById("back-link").textContent = `Back to ${seriesTitle}`;
    document.title = `${title} | ${cfg.siteTitle || "My Photography"}`;

    const { imagesRoot } = getRepoInfo();
    const img = document.getElementById("photo-image");
    const encodedPath = `${imagesRoot}/${slug}/${file}`.split("/").map(encodeURIComponent).join("/");
    img.src = `https://raw.githubusercontent.com/${getRepoInfo().owner}/${getRepoInfo().repo}/main/${encodedPath}`;
    img.alt = title;
  }

  window.PortfolioApp = {
    initHeader,
    loadSeriesList,
    loadSeriesPage,
    loadPhotoPage
  };
})();
