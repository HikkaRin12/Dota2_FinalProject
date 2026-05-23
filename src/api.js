export const CONFIG = {
  OPENDOTA_BASE_URL: "https://api.opendota.com/api",
  HERO_IMG_BASE_URL: "https://cdn.cloudflare.steamstatic.com",
};

const { OPENDOTA_BASE_URL, HERO_IMG_BASE_URL } = CONFIG;

export const fetchHeroes = async () => {
  try {
    const response = await fetch(`${OPENDOTA_BASE_URL}/heroStats`);

    if (!response.ok) {
      throw new Error(
        `Server error: ${response.status} ${response.statusText}`,
      );
    }

    const heroes = await response.json();

    if (!Array.isArray(heroes)) {
      throw new Error("Unexpected data format from API: expected an array.");
    }

    console.info(`[API] Successfully loaded ${heroes.length} heroes.`);
    return heroes;
  } catch (error) {
    console.error("[API] Error loading heroes:", error.message);

    throw error;
  }
};

export const getHeroImageUrl = (imgPath) => {
  if (!imgPath)
    return "https://via.placeholder.com/256x144/111520/8a9bb0?text=NO+IMG";
  return `${HERO_IMG_BASE_URL}${imgPath}`;
};

export const getHeroIconUrl = (iconPath) => {
  if (!iconPath) return "";
  return `${HERO_IMG_BASE_URL}${iconPath}`;
};
