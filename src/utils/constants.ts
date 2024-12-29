import { z } from "zod";

export const LOCATIONS = [
  // Stanton
  { name: "Stanton", children: ["Aaron Halo", "Stanton"] },
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

  // Pyro
  {
    name: "Pyro",
    children: ["Pyro", "Stanton Gateway"],
  },
  {
    name: "Pyro I",
    children: ["Pyro I", "Akiro Cluster", "PYAM-FARSTAT-1-3"],
  },
  {
    name: "Pyro II - Monox",
    children: ["Monox", "Checkmate Station"],
  },
  {
    name: "Pyro III - Bloom",
    children: [
      "Bloom",
      "Orbituary",
      "Patch City",
      "Starlight Service Station",
      "PYAM-SUPVISR-3-4",
      "PYAM-FARSTAT-3-5",
    ],
  },
  {
    name: "Pyro V",
    children: [
      "Pyro V",
      "Adir",
      "Fairo",
      "Fuego",
      "Ignis",
      "Pyro IV",
      "Vatra",
      "Vuur",
      "Gaslight",
      "Rat's Nest",
      "Rod's Fuel 'N Supplies",
      "PYAM-FARSTAT-5-1",
      "PYAM-FARSTAT-5-3",
    ],
  },
  {
    name: "Pyro VI",
    children: [
      "Terminus",
      "Ruin Station",
      "Megumi Refueling",
      "Endgame",
      "PYAM-FARSTAT-6-2",
    ],
  },

  {
    name: "Pyro Asteroid Bases",
    children: [
      "RAB-Alpha",
      "RAB-Bravo",
      "RAB-Charlie",
      "RAB-Cook",
      "RAB-Delta",
      "RAB-Echo",
      "RAB-Foxtrot",
      "RAB-Gulf",
      "RAB-Helio",
      "RAB-Ignition",
      "RAB-Ion",
      "RAB-Jak",
      "RAB-Kilo",
      "RAB-Lamda",
      "RAB-Lynx",
      "RAB-Mat",
      "RAB-November",
      "RAB-Over",
      "RAB-Point",
      "RAB-Roth",
      "RAB-Tung",
      "RAB-Quagmire",
      "RAB-Sierra",
      "RAB-Ultra",
      "RAB-Victory",
      "RAB-Whiskey",
      "RAB-Xeno",
      "RAB-York",
      "RAB-Zeta",
    ],
  },
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
  "MISSION",
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
