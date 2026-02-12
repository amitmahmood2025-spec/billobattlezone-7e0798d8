import freefireThumb from "@/assets/games/freefire-thumb.jpg";
import pubgThumb from "@/assets/games/pubg-thumb.jpg";
import ludoThumb from "@/assets/games/ludo-thumb.jpg";
import freefireBanner from "@/assets/games/freefire-banner.jpg";
import pubgBanner from "@/assets/games/pubg-banner.jpg";
import ludoBanner from "@/assets/games/ludo-banner.jpg";

const gameImageMap: Record<string, { thumb: string; banner: string }> = {
  "free fire": { thumb: freefireThumb, banner: freefireBanner },
  "freefire": { thumb: freefireThumb, banner: freefireBanner },
  "ff": { thumb: freefireThumb, banner: freefireBanner },
  "pubg": { thumb: pubgThumb, banner: pubgBanner },
  "pubg mobile": { thumb: pubgThumb, banner: pubgBanner },
  "ludo": { thumb: ludoThumb, banner: ludoBanner },
  "ludo king": { thumb: ludoThumb, banner: ludoBanner },
};

export const getGameImage = (gameType: string): { thumb: string; banner: string } => {
  const key = gameType.toLowerCase().trim();
  return gameImageMap[key] || { thumb: freefireThumb, banner: freefireBanner };
};
