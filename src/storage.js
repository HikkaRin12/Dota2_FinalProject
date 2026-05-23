const FAVORITES_STORAGE_KEY = "dota2_dashboard_favorites";

export const getFavorites = () => {
  try {
    const stored = localStorage.getItem(FAVORITES_STORAGE_KEY);

    if (stored === null) return [];

    const parsed = JSON.parse(stored);

    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn("[Storage] Error reading favorites:", error.message);
    return [];
  }
};

const saveFavorites = (favorites) => {
  try {
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
    return true;
  } catch (error) {
    console.error("[Storage] Error writing to localStorage:", error.message);
    return false;
  }
};

export const isFavorite = (heroId) => {
  const favorites = getFavorites();
  return favorites.includes(heroId);
};

export const toggleFavorite = (heroId) => {
  const favorites = getFavorites();
  const isCurrentlyFavorite = favorites.includes(heroId);

  let updatedFavorites;

  if (isCurrentlyFavorite) {
    updatedFavorites = favorites.filter((id) => id !== heroId);
  } else {
    updatedFavorites = [...favorites, heroId];
  }

  const success = saveFavorites(updatedFavorites);

  return {
    isNowFavorite: !isCurrentlyFavorite,
    success,
  };
};

export const getFavoritesCount = () => getFavorites().length;

export const clearFavorites = () => {
  try {
    localStorage.removeItem(FAVORITES_STORAGE_KEY);
  } catch (error) {
    console.error("[Storage] Error clearing favorites:", error.message);
  }
};
