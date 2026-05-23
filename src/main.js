import { fetchHeroes, getHeroImageUrl } from "./api.js";
import {
  getFavorites,
  getFavoritesCount,
  isFavorite,
  toggleFavorite,
} from "./storage.js";

const heroesGrid = document.getElementById("heroesGrid");
const searchInput = document.getElementById("searchInput");
const searchClear = document.getElementById("searchClear");
const emptyState = document.getElementById("emptyState");
const resultsInfo = document.getElementById("resultsInfo");
const heroCountDisplay = document.getElementById("heroCountDisplay");
const heroCountBadge = document.getElementById("heroCountBadge");
const favoritesCount = document.getElementById("favoritesCount");
const btnFavoritesToggle = document.getElementById("btnFavoritesToggle");
const btnResetFilters = document.getElementById("btnResetFilters");
const sortSelect = document.getElementById("sortSelect");
const modalOverlay = document.getElementById("modalOverlay");
const modalClose = document.getElementById("modalClose");
const modalHeroImg = document.getElementById("modalHeroImg");
const modalHeroName = document.getElementById("modalHeroName");
const modalAttrBadge = document.getElementById("modalAttrBadge");
const modalStats = document.getElementById("modalStats");
const modalRoles = document.getElementById("modalRoles");
const modalFavBtn = document.getElementById("modalFavBtn");
const modalBanner = document.getElementById("modalBanner");
const toast = document.getElementById("toast");
const attrButtons = document.querySelectorAll(".attr-btn");
const landingSection = document.getElementById("landingSection");
const heroesSection = document.getElementById("heroesSection");
const btnExploreHeroes = document.getElementById("btnExploreHeroes");
const btnExploreHeroes2 = document.getElementById("btnExploreHeroes2");
const btnBackHome = document.getElementById("btnBackHome");
const logoLink = document.getElementById("logoLink");

const state = {
  allHeroes: [],
  activeAttr: "all",
  searchQuery: "",
  sortBy: "localized_name",
  showOnlyFavorites: false,
  currentHeroId: null,
  heroesLoaded: false, 
  currentPage: "landing",
};

const ATTR_LABELS = {
  str: "Strength",
  agi: "Agility",
  int: "Intelligence",
  all_hero: "Universal",
  all: "Universal",
};

const ATTR_CSS_MAP = {
  str: "str",
  agi: "agi",
  int: "int",
  all_hero: "all_hero",
  all: "all_hero",
};

const showHeroesPage = () => {
  landingSection.hidden = true;
  heroesSection.hidden = false;

  btnBackHome.hidden = false;
  heroCountBadge.hidden = false;
  btnFavoritesToggle.hidden = false;

  state.currentPage = "heroes";
  window.scrollTo({ top: 0, behavior: "smooth" });

  if (!state.heroesLoaded) {
    loadHeroes();
  }
};

const showLandingPage = () => {
  heroesSection.hidden = true;
  landingSection.hidden = false;

  btnBackHome.hidden = true;
  heroCountBadge.hidden = true;
  btnFavoritesToggle.hidden = true;

  if (!modalOverlay.hidden) closeModal(false);

  state.currentPage = "landing";
  window.location.hash = "";
  window.scrollTo({ top: 0, behavior: "smooth" });
};

const createHeroCardHTML = (hero) => {
  const {
    id,
    localized_name,
    primary_attr,
    img,
    base_attack_min,
    base_attack_max,
    move_speed,
    base_armor,
  } = hero;

  const imageUrl = getHeroImageUrl(img);
  const attrClass = ATTR_CSS_MAP[primary_attr] || "str";
  const attrLabel = ATTR_LABELS[primary_attr] || primary_attr;
  const isFav = isFavorite(id);
  const avgAttack = Math.round((base_attack_min + base_attack_max) / 2);

  return `
    <article
      class="hero-card"
      role="listitem"
      data-hero-id="${id}"
      tabindex="0"
      aria-label="Hero ${localized_name}"
    >
      <div class="hero-card__img-wrapper">
        <img
          class="hero-card__img"
          src="${imageUrl}"
          alt="${localized_name}"
          loading="lazy"
          onerror="this.src='https://placehold.co/256x144/111520/8a9bb0?text=${encodeURIComponent(localized_name)}'"
        />
        <span class="hero-card__attr-badge hero-card__attr-badge--${attrClass}" title="${attrLabel}" aria-label="Attribute: ${attrLabel}">
          ${["all_hero", "all"].includes(primary_attr) ? "✦" : primary_attr.toUpperCase()}
        </span>
        <button
          class="hero-card__fav-btn ${isFav ? "is-favorite" : ""}"
          data-fav-id="${id}"
          aria-label="${isFav ? "Remove from favorites" : "Add to favorites"}"
          aria-pressed="${isFav}"
        >
          <svg class="icon-star" viewBox="0 0 24 24">
            <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
          </svg>
        </button>
      </div>
      <div class="hero-card__body">
        <p class="hero-card__name">${localized_name}</p>
        <div class="hero-card__mini-stats">
          <div class="mini-stat">
            <span class="mini-stat__value">${avgAttack}</span>
            <span class="mini-stat__label">Attack</span>
          </div>
          <div class="mini-stat">
            <span class="mini-stat__value">${move_speed}</span>
            <span class="mini-stat__label">Speed</span>
          </div>
          <div class="mini-stat">
            <span class="mini-stat__value">${base_armor}</span>
            <span class="mini-stat__label">Armor</span>
          </div>
        </div>
      </div>
    </article>
  `;
};

const renderHeroes = (heroes) => {
  heroesGrid.querySelectorAll(".skeleton-card").forEach((s) => s.remove());

  if (heroes.length === 0) {
    heroesGrid.innerHTML = "";
    heroesGrid.hidden = true;
    emptyState.hidden = false;
    resultsInfo.textContent = "Heroes not found.";
    return;
  }

  emptyState.hidden = true;
  heroesGrid.hidden = false;
  heroesGrid.innerHTML = heroes.map(createHeroCardHTML).join("");

  const filterStr = state.showOnlyFavorites ? " (favorites)" : "";
  resultsInfo.textContent = `Showing ${heroes.length} of ${state.allHeroes.length} heroes${filterStr}`;
};

const updateFavoritesUI = () => {
  const count = getFavoritesCount();
  favoritesCount.textContent = count;
  btnFavoritesToggle.classList.toggle("is-active", state.showOnlyFavorites);
  btnFavoritesToggle.setAttribute("aria-pressed", state.showOnlyFavorites);
};

const updateHeroCount = () => {
  heroCountDisplay.textContent = state.allHeroes.length;
};

const applyFiltersAndRender = () => {
  let result = state.allHeroes;

  if (state.activeAttr !== "all") {
    result = result.filter((hero) => hero.primary_attr === state.activeAttr);
  }

  if (state.searchQuery.trim() !== "") {
    const query = state.searchQuery.trim().toLowerCase();
    result = result.filter((hero) =>
      hero.localized_name.toLowerCase().includes(query),
    );
  }

  if (state.showOnlyFavorites) {
    const favorites = getFavorites();
    result = result.filter((hero) => favorites.includes(hero.id));
  }

  result = [...result].sort((a, b) => {
    const field = state.sortBy;
    if (typeof a[field] === "string") return a[field].localeCompare(b[field]);
    return (b[field] ?? 0) - (a[field] ?? 0);
  });

  renderHeroes(result);
};

const validateSearchInput = (value) => {
  const FORBIDDEN_CHARS = /[<>"'`;/\\{}]/g;
  if (FORBIDDEN_CHARS.test(value)) {
    return {
      isValid: false,
      sanitized: value.replace(FORBIDDEN_CHARS, ""),
      error: "Some characters are not allowed and were removed",
    };
  }
  return { isValid: true, sanitized: value, error: null };
};

const getRouteHeroId = () => {
  const hash = window.location.hash.slice(1);
  const match = hash.match(/^hero-(\d+)$/);
  return match ? Number(match[1]) : null;
};

const updateRouteForHero = (heroId) => {
  const hash = `hero-${heroId}`;
  if (window.location.hash.slice(1) !== hash) {
    window.location.hash = hash;
  }
};

const clearRoute = () => {
  if (window.location.hash) window.location.hash = "";
};

const handleRoute = () => {
  const heroId = getRouteHeroId();

  if (heroId === null) {
    if (!modalOverlay.hidden) closeModal(false);
    return;
  }

  if (state.currentPage !== "heroes") {
    showHeroesPage();
    return;
  }

  const heroExists = state.allHeroes.some((hero) => hero.id === heroId);
  if (!heroExists) {
    clearRoute();
    return;
  }

  if (String(state.currentHeroId) === String(heroId) && !modalOverlay.hidden)
    return;

  openModal(heroId, false);
};
let modalOpenerElement = null;

const openModal = (heroId, updateHash = true) => {
  const id = Number(heroId);
  if (!Number.isInteger(id) || id <= 0) return;

  const hero = state.allHeroes.find((h) => h.id === id);
  if (!hero) return;

  if (updateHash) updateRouteForHero(id);

  modalOpenerElement = document.activeElement;
  state.currentHeroId = id;

  const {
    localized_name,
    primary_attr,
    img,
    roles = [],
    base_attack_min,
    base_attack_max,
    base_armor,
    base_hp,
    base_mp,
    move_speed,
    attack_type,
    attack_range,
    base_str,
    base_agi,
    base_int,
  } = hero;

  const attrClass = primary_attr || "str";
  const attrLabel = ATTR_LABELS[primary_attr] || primary_attr;
  const isFav = isFavorite(hero.id);

  modalHeroImg.src = getHeroImageUrl(img);
  modalHeroImg.alt = localized_name;

  const tintColors = {
    str: "rgba(232, 64, 64, 0.15)",
    agi: "rgba(69, 194, 70, 0.15)",
    int: "rgba(91, 155, 213, 0.15)",
    all_hero: "rgba(169, 112, 208, 0.15)",
  };
  modalBanner.style.background = `linear-gradient(45deg, ${tintColors[primary_attr] || "transparent"}, transparent)`;

  modalHeroName.textContent = localized_name;
  modalAttrBadge.textContent = `⬥ ${attrLabel}`;
  modalAttrBadge.className = `modal-attr-badge modal-attr-badge--${attrClass}`;

  modalFavBtn.classList.toggle("is-favorite", isFav);
  modalFavBtn.setAttribute(
    "aria-label",
    isFav ? "Remove from favorites" : "Add to favorites",
  );

  const statsData = [
    { label: "Attack (min)", value: base_attack_min },
    { label: "Attack (max)", value: base_attack_max },
    {
      label: "Attack Type",
      value: attack_type === "Melee" ? "⚔ Melee" : "🏹 Ranged",
    },
    { label: "Range", value: attack_range },
    { label: "Armor", value: base_armor },
    { label: "HP", value: base_hp },
    { label: "Mana", value: base_mp },
    { label: "Speed", value: move_speed },
    { label: "Strength", value: base_str },
    { label: "Agility", value: base_agi },
    { label: "Intelligence", value: base_int },
  ];

  modalStats.innerHTML = statsData
    .map(
      ({ label, value }) => `
      <div class="stat-block">
        <div class="stat-block__value">${value ?? "—"}</div>
        <div class="stat-block__label">${label}</div>
      </div>
    `,
    )
    .join("");

  modalRoles.innerHTML = roles.length
    ? roles.map((role) => `<span class="role-tag">${role}</span>`).join("")
    : '<span class="role-tag">No data available</span>';

  modalOverlay.hidden = false;
  document.body.style.overflow = "hidden";
  requestAnimationFrame(() => modalClose.focus());
};

const closeModal = (updateHash = true) => {
  modalOverlay.hidden = true;
  document.body.style.overflow = "";
  state.currentHeroId = null;
  modalOpenerElement?.focus();
  modalOpenerElement = null;
  if (updateHash) clearRoute();
};

let toastTimer = null;

const showToast = (message, type = "add") => {
  if (toastTimer) clearTimeout(toastTimer);
  toast.textContent = message;
  toast.className = `toast toast--${type} toast--visible`;
  toastTimer = setTimeout(() => toast.classList.remove("toast--visible"), 2500);
};

const handleFavoriteToggle = (heroId, btnElement) => {
  const { isNowFavorite, success } = toggleFavorite(heroId);
  if (!success) {
    showToast("Can't add to favorites.", "error");
    return;
  }

  const hero = state.allHeroes.find((h) => h.id === heroId);
  const heroName = hero?.localized_name ?? "Hero";

  btnElement.classList.toggle("is-favorite", isNowFavorite);
  btnElement.setAttribute("aria-pressed", isNowFavorite);
  btnElement.setAttribute(
    "aria-label",
    isNowFavorite ? "Remove from favorites" : "Add to favorites",
  );

  if (state.currentHeroId === heroId) {
    modalFavBtn.classList.toggle("is-favorite", isNowFavorite);
  }

  const cardFavBtn = heroesGrid.querySelector(`[data-fav-id="${heroId}"]`);
  if (cardFavBtn && cardFavBtn !== btnElement) {
    cardFavBtn.classList.toggle("is-favorite", isNowFavorite);
  }

  showToast(
    isNowFavorite
      ? `★ ${heroName} added to favorites`
      : `${heroName} removed from favorites`,
    isNowFavorite ? "add" : "remove",
  );

  updateFavoritesUI();
  if (state.showOnlyFavorites) applyFiltersAndRender();
};

const loadHeroes = async () => {
  try {
    resultsInfo.textContent = "Loading data...";
    const heroes = await fetchHeroes();

    state.allHeroes = heroes.map((hero) => ({
      ...hero,
      primary_attr:
        hero.primary_attr === "all" ? "all_hero" : hero.primary_attr,
    }));

    state.heroesLoaded = true;
    updateHeroCount();
    applyFiltersAndRender();
    handleRoute();

    console.info("[App] Heroes loaded successfully.");
  } catch (error) {
    heroesGrid.innerHTML = `
      <div class="empty-state" style="grid-column: 1/-1;">
        <div class="empty-icon">⚠</div>
        <p class="empty-title">Failed to load heroes</p>
        <p class="empty-subtitle">${error.message}</p>
        <button onclick="window.location.reload()">Try again</button>
      </div>
    `;
    resultsInfo.textContent = "Load error";
    showToast("Failed to connect to API", "error");
  }
};

const setupEventListeners = () => {
  btnExploreHeroes?.addEventListener("click", showHeroesPage);
  btnExploreHeroes2?.addEventListener("click", showHeroesPage);

  btnBackHome?.addEventListener("click", showLandingPage);
  logoLink?.addEventListener("click", (e) => {
    e.preventDefault();
    if (state.currentPage === "heroes") {
      showLandingPage();
    }
  });
  
  searchInput.addEventListener("input", (event) => {
    const { isValid, sanitized, error } = validateSearchInput(
      event.target.value,
    );
    if (!isValid) {
      searchInput.value = sanitized;
      showToast(error, "error");
    }
    state.searchQuery = sanitized;
    searchClear.hidden = sanitized.length === 0;
    applyFiltersAndRender();
  });

  searchClear.addEventListener("click", () => {
    searchInput.value = "";
    searchClear.hidden = true;
    state.searchQuery = "";
    searchInput.focus();
    applyFiltersAndRender();
  });

  attrButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const selectedAttr = btn.dataset.attr;
      if (state.activeAttr === selectedAttr) return;
      state.activeAttr = selectedAttr;
      attrButtons.forEach((b) => {
        const isActive = b.dataset.attr === selectedAttr;
        b.classList.toggle("active", isActive);
        b.setAttribute("aria-pressed", isActive);
      });
      applyFiltersAndRender();
    });
  });

  btnFavoritesToggle.addEventListener("click", () => {
    state.showOnlyFavorites = !state.showOnlyFavorites;
    updateFavoritesUI();
    applyFiltersAndRender();
  });

  btnResetFilters.addEventListener("click", () => {
    state.activeAttr = "all";
    state.searchQuery = "";
    state.showOnlyFavorites = false;
    searchInput.value = "";
    searchClear.hidden = true;
    attrButtons.forEach((b) => {
      const isAll = b.dataset.attr === "all";
      b.classList.toggle("active", isAll);
      b.setAttribute("aria-pressed", isAll);
    });
    updateFavoritesUI();
    applyFiltersAndRender();
  });

  sortSelect.addEventListener("change", (event) => {
    state.sortBy = event.target.value;
    applyFiltersAndRender();
  });

  heroesGrid.addEventListener("click", (event) => {
    const favBtn = event.target.closest(".hero-card__fav-btn");
    if (favBtn) {
      event.stopPropagation();
      handleFavoriteToggle(Number(favBtn.dataset.favId), favBtn);
      return;
    }
    const heroCard = event.target.closest(".hero-card");
    if (heroCard) openModal(heroCard.dataset.heroId);
  });

  heroesGrid.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      const heroCard = event.target.closest(".hero-card");
      if (heroCard) {
        event.preventDefault();
        openModal(heroCard.dataset.heroId);
      }
    }
  });

  modalFavBtn.addEventListener("click", () => {
    if (state.currentHeroId === null) return;
    handleFavoriteToggle(state.currentHeroId, modalFavBtn);
  });
  modalClose.addEventListener("click", closeModal);
  modalOverlay.addEventListener("click", (event) => {
    if (event.target === modalOverlay) closeModal();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !modalOverlay.hidden) closeModal();
  });

  window.addEventListener("hashchange", handleRoute);
};

document.addEventListener("DOMContentLoaded", () => {
  console.info("[App] Initializing application...");
  setupEventListeners();
  updateFavoritesUI();

  landingSection.hidden = false;
  heroesSection.hidden = true;

  if (getRouteHeroId() !== null) {
    showHeroesPage();
  }
});
