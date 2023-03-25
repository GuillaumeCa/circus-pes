import { z } from "zod";

export const LOCATIONS = [
  {
    name: "Crusader",
    children: [
      "Crusader",
      "Cellin",
      "Yela",
      "Grim Hex",
      "Daymar",
      "CRU-L1",
      "CRU-L2",
      "CRU-L3",
      "CRU-L4",
      "CRU-L5",
    ],
  },
  {
    name: "Hurston",
    children: [
      "Hurston",
      "Ita",
      "Aberdeen",
      "Arial",
      "Magda",
      "HUR-L1",
      "HUR-L2",
      "HUR-L3",
      "HUR-L4",
      "HUR-L5",
    ],
  },
  {
    name: "ArCorp",
    children: [
      "ArCorp",
      "Wala",
      "Lyria",
      "ARC-L1",
      "ARC-L2",
      "ARC-L3",
      "ARC-L4",
      "ARC-L5",
    ],
  },
  {
    name: "Microtech",
    children: [
      "Microtech",
      "Calliope",
      "Clio",
      "Euterpe",
      "MIC-L1",
      "MIC-L2",
      "MIC-L3",
      "MIC-L4",
      "MIC-L5",
    ],
  },
  { name: "Stanton", children: ["Aaron Halo", "Stanton"] },
];

export const REGIONS = [
  {
    name: {
      fr: "Europe",
      en: "Europe",
    },
    prefix: "EU",
  },
  {
    name: {
      fr: "USA",
      en: "USA",
    },
    prefix: "US",
  },
  {
    name: {
      fr: "Asie",
      en: "Asia",
    },
    prefix: "APE1",
  },
  {
    name: {
      fr: "Australie",
      en: "Australia",
    },
    prefix: "APSE2",
  },
];

export const categoriesSchema = z.enum([
  "TEST",
  "EXPLORATION",
  "LOOT",
  "SPECTACLE",
  "OTHER",
]);
export type CategoryEnum = z.infer<typeof categoriesSchema>;

export const CATEGORIES = [
  {
    id: "TEST",
    name: {
      fr: "🔬 Test de persistence",
      en: "🔬 Persistence test",
    },
  },
  {
    id: "EXPLORATION",
    name: {
      fr: "🎯 Point d'intérêt d'exploration",
      en: "🎯 Point of interest for exploration",
    },
  },
  {
    id: "LOOT",
    name: {
      fr: "🎒 Loot",
      en: "🎒 Loot",
    },
  },
  {
    id: "SPECTACLE",
    name: {
      fr: "🎭 Spectacle",
      en: "🎭 Spectacle",
    },
  },
  {
    id: "OTHER",
    name: {
      fr: "Autre",
      en: "Other",
    },
  },
];
