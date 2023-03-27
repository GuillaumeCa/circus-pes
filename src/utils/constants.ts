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
    description: {
      fr: "Ici vous pouvez tester combien de temps un objet ou un PNJ reste sur une shard ou combien d'objets il faut pour décharger tel zone, etc...",
      en: "Here you can check how long an object or a NPC stays in a shard, or how many objects are needed to cull an area.",
    },
  },
  {
    id: "EXPLORATION",
    name: {
      fr: "📍 Point d'intérêt d'exploration",
      en: "📍 Point of interest for exploration",
    },
    description: {
      fr: "Il n'y a pas que les développeurs qui peuvent créer des POI ! Utilisez la persistence pour créer des points d'interêts à explorer !",
      en: "Points of Interest don’t have to come exclusively form the devs! Use persistence to create your own !",
    },
  },
  {
    id: "LOOT",
    name: {
      fr: "🎒 Loot",
      en: "🎒 Loot",
    },
    description: {
      fr: "Un peu de solidarité dans le vers' Vous avez croisé une épave et vous souhaitez en informer les recycleurs ? Vous avez vu une caisse rempli de munitions ? n'hésitez pas à les répertorier.",
      en: "Let’s help each other in the 'verse. If you discover a derelict ship or a crate full of amno, you can index them for other players to use !",
    },
  },
  {
    id: "MISSION",
    name: {
      fr: "🎖 Mission",
      en: "🎖 Mission",
    },
    description: {
      fr: "Le PES permet à tout citoyens du vers' de créer ses propres missions ou jeu de piste ! N'hésitez pas à découvrir les missions des joueurs.",
      en: "The PES allows every citizen in the 'verse to create their own missions or treasure hunts. Come and try missions from other players !",
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
