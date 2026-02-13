import freefireThumb from "@/assets/games/freefire-thumb.jpg";
import pubgThumb from "@/assets/games/pubg-thumb.jpg";
import ludoThumb from "@/assets/games/ludo-thumb.jpg";
import freefireBanner from "@/assets/games/freefire-banner.jpg";
import freefireAction from "@/assets/games/freefire-action.jpg";
import pubgBanner from "@/assets/games/pubg-banner.jpg";
import pubgAction from "@/assets/games/pubg-action.jpg";
import ludoBanner from "@/assets/games/ludo-banner.jpg";
import ludoAction from "@/assets/games/ludo-action.jpg";

const gameImageMap: Record<string, { thumb: string; banner: string; action: string }> = {
  "free fire": { thumb: freefireThumb, banner: freefireBanner, action: freefireAction },
  "freefire": { thumb: freefireThumb, banner: freefireBanner, action: freefireAction },
  "ff": { thumb: freefireThumb, banner: freefireBanner, action: freefireAction },
  "pubg": { thumb: pubgThumb, banner: pubgBanner, action: pubgAction },
  "pubg mobile": { thumb: pubgThumb, banner: pubgBanner, action: pubgAction },
  "ludo": { thumb: ludoThumb, banner: ludoBanner, action: ludoAction },
  "ludo king": { thumb: ludoThumb, banner: ludoBanner, action: ludoAction },
};

export const getGameImage = (gameType: string): { thumb: string; banner: string; action: string } => {
  const key = gameType.toLowerCase().trim();
  return gameImageMap[key] || { thumb: freefireThumb, banner: freefireBanner, action: freefireAction };
};
