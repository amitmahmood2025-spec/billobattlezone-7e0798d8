// Game-specific mode configuration for tournament creation
export interface GameMode {
  label: string;
  value: string;
}

export interface GameConfig {
  label: string;
  value: string;
  modes: GameMode[];
  maps?: string[];
  perspectives?: string[];
  matchTypes?: string[];
}

export const GAME_CONFIGS: GameConfig[] = [
  {
    label: "Free Fire",
    value: "Free Fire",
    modes: [
      { label: "BR Match", value: "BR Match" },
      { label: "Clash Squad", value: "Clash Squad" },
      { label: "Lone Wolf", value: "Lone Wolf" },
      { label: "CS 1v1", value: "CS 1v1" },
      { label: "CS 1v2", value: "CS 1v2" },
      { label: "CS 1v3", value: "CS 1v3" },
      { label: "CS 1v4", value: "CS 1v4" },
    ],
    maps: ["Bermuda", "Purgatory", "Kalahari", "Alpine", "Nexterra"],
    perspectives: ["TPP"],
    matchTypes: ["Solo", "Duo", "Squad"],
  },
  {
    label: "PUBG",
    value: "PUBG",
    modes: [
      { label: "BR Match", value: "BR Match" },
      { label: "Arena TDM", value: "Arena TDM" },
      { label: "1v1", value: "1v1" },
      { label: "2v2", value: "2v2" },
    ],
    maps: ["Erangel", "Miramar", "Sanhok", "Vikendi", "Livik", "Nusa"],
    perspectives: ["TPP", "FPP"],
    matchTypes: ["Solo", "Duo", "Squad"],
  },
  {
    label: "Ludo",
    value: "Ludo",
    modes: [
      { label: "Classic 1v1", value: "Classic 1v1" },
      { label: "Classic 2v2", value: "Classic 2v2" },
      { label: "Quick 1v1", value: "Quick 1v1" },
    ],
    maps: [],
    perspectives: [],
    matchTypes: ["1v1", "2v2"],
  },
];

export function getGameConfig(gameValue: string): GameConfig | undefined {
  return GAME_CONFIGS.find((g) => g.value === gameValue);
}
