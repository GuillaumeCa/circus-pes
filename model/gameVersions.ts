import { useQuery } from "react-query";
import { supabase } from "../lib/supabase";

export interface GameVersionEntity {
  id: number;
  name: string;
  visible: boolean;
  created_at: number;
}

export function createGameVersion(name: string) {
  return supabase.from("game_versions").insert({
    name,
  });
}

export function getGameVersions() {
  return supabase
    .from("game_versions")
    .select<"*", GameVersionEntity>()
    .order("created_at", { ascending: false });
}

export function useGameVersions() {
  return useQuery("gameVersions", async () => {
    const { data, error } = await getGameVersions();
    if (error) {
      throw new Error("Failed to fetch game versions: " + error.message);
    }
    return data;
  });
}
