(function () {
  const cfg = window.SITE_CONFIG || {};
  const imageExt = /\.(jpg|jpeg|png|webp|gif)$/i;
  const INITIAL_BATCH = 20;
  const LOAD_BATCH = 20;

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

  function rawFileUrl(path) {
    const { owner, repo } = getRepoInfo();
    const encodedPath = path.split("/").map(encodeURIComponent).join("/");
    return `https://raw.githubusercontent.com/${owner}/${repo}/main/${encodedPath}`;
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

  async function fetchSeriesPhotos(slug) {
    const { imagesRoot } = getRepoInfo();
    const entries = await fetchContents(`${imagesRoot}/${slug}`);
    return entries
      .filter((e) => e.type === "file" && imageExt.test(e.name))
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
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
      const photos = await fetchSeriesPhotos(slug);

      grid.innerHTML = "";
      if (!photos.length) {
        grid.innerHTML = '<p class="muted">No images found in this series folder.</p>';
        return;
      }

      let rendered = 0;
      const renderBatch = (count) => {
        const end = Math.min(rendered + count, photos.length);
        for (let i = rendered; i < end; i += 1) {
          const p = photos[i];
          const card = document.createElement("a");
          card.className = "thumb-card";
          card.href = `photo.html?series=${encodeURIComponent(slug)}&file=${encodeURIComponent(p.name)}`;
          const fullUrl = p.download_url;
          const previewUrl = rawFileUrl(`${imagesRoot}/${slug}/thumbs/${p.name}`);
          card.innerHTML = `<img src="${previewUrl}" alt="${fileName(p.name)}" loading="lazy" decoding="async" />`;
          const img = card.querySelector("img");
          img.addEventListener("error", () => {
            if (img.src !== fullUrl) {
              img.src = fullUrl;
            }
          });
          grid.appendChild(card);
        }
        rendered = end;
      };

      renderBatch(INITIAL_BATCH);

      if (rendered < photos.length) {
        const moreWrap = document.createElement("div");
        moreWrap.className = "load-more-wrap container";
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "load-more-btn";
        btn.textContent = `Load more (${photos.length - rendered} remaining)`;
        btn.addEventListener("click", () => {
          renderBatch(LOAD_BATCH);
          const remaining = photos.length - rendered;
          if (remaining <= 0) {
            moreWrap.remove();
          } else {
            btn.textContent = `Load more (${remaining} remaining)`;
          }
        });
        moreWrap.appendChild(btn);
        grid.parentNode.insertBefore(moreWrap, grid.nextSibling);
      }
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

    const seriesTitle = titleFromSlug(slug);
    document.getElementById("photo-title").textContent = "";
    document.getElementById("photo-subtitle").textContent = `${seriesTitle}`;
    document.getElementById("back-link").href = `series.html?slug=${encodeURIComponent(slug)}`;
    document.getElementById("back-link").textContent = `Back to ${seriesTitle}`;

    const { imagesRoot } = getRepoInfo();
    const img = document.getElementById("photo-image");
    const caption = document.getElementById("photo-caption");

    const photoUrl = (name) =>
      `photo.html?series=${encodeURIComponent(slug)}&file=${encodeURIComponent(name)}`;

    const showPhoto = (photo, { updateHistory = false, replace = false } = {}) => {
      const title = fileName(photo.name);
      img.src = rawFileUrl(`${imagesRoot}/${slug}/${photo.name}`);
      img.alt = title;
      caption.textContent = title;
      document.title = `${title} | ${cfg.siteTitle || "My Photography"}`;
      if (updateHistory) {
        const state = { series: slug, file: photo.name };
        const url = photoUrl(photo.name);
        if (replace) {
          history.replaceState(state, "", url);
        } else {
          history.pushState(state, "", url);
        }
      }
    };

    const findIndex = (photos, name) => {
      const decoded = decodeURIComponent(name);
      return photos.findIndex((p) => p.name === name || p.name === decoded);
    };

    try {
      const photos = await fetchSeriesPhotos(slug);
      if (!photos.length) {
        renderError("main-content", "No images in this series.");
        return;
      }

      let index = findIndex(photos, file);
      if (index < 0) index = 0;

      showPhoto(photos[index], { updateHistory: true, replace: true });

      const goTo = (nextIndex, { historyMode = "push" } = {}) => {
        if (nextIndex < 0 || nextIndex >= photos.length) return;
        index = nextIndex;
        showPhoto(photos[index], {
          updateHistory: true,
          replace: historyMode === "replace"
        });
      };

      document.addEventListener("keydown", (e) => {
        if (e.target.closest("input, textarea, select, [contenteditable='true']")) return;

        let delta = 0;
        if (e.key === "ArrowLeft" || e.key === "ArrowUp") delta = -1;
        else if (e.key === "ArrowRight" || e.key === "ArrowDown") delta = 1;
        else return;

        e.preventDefault();
        goTo(index + delta);
      });

      window.addEventListener("popstate", () => {
        const currentFile = new URLSearchParams(window.location.search).get("file");
        if (!currentFile) return;
        const i = findIndex(photos, currentFile);
        if (i >= 0) {
          index = i;
          showPhoto(photos[index]);
        }
      });
    } catch (err) {
      showPhoto({ name: file });
    }
  }

  window.PortfolioApp = {
    initHeader,
    loadSeriesList,
    loadSeriesPage,
    loadPhotoPage
  };
})();
