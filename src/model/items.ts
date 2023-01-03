import { supabase } from "../lib/supabase";
import { SortOption } from "../pages";
import { LocationInfo } from "../server/routers/item";

export interface ItemsEntity {
  id: number;
  gameVersion: string;
  shardId: string;
  location: string;
  description: string;
  item_capture_url: string;
  user_id?: string;
  created_at: number;
}

export const LOCATIONS = [
  "Crusader",
  "Cellin",
  "Yela",
  "Daymar",
  "CRU-L1",
  "CRU-L2",
  "CRU-L3",
  "CRU-L4",
  "CRU-L5",
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
  "ArCorp",
  "Wala",
  "Lyria",
  "ARC-L1",
  "ARC-L2",
  "ARC-L3",
  "ARC-L4",
  "ARC-L5",
  "Microtech",
  "Calliope",
  "Clio",
  "Euterpe",
  "MIC-L1",
  "MIC-L2",
  "MIC-L3",
  "MIC-L4",
  "MIC-L5",
  "Aaron Halo",
  "Stanton",
];

export function getItems(sortOpt: SortOption) {
  return supabase
    .from("items_users_likes")
    .select<"*", LocationInfo>()
    .order(sortOpt === "recent" ? "created_at" : "likes_cnt", {
      ascending: false,
    });
}

export async function deleteItem(item: ItemsEntity) {
  await supabase.from("items").delete().eq("id", item.id);
  if (item.item_capture_url) {
    await supabase.storage
      .from("items-capture")
      .remove([item.item_capture_url]);
  }
}

export function getItemImageUrl(imagePath: string) {
  return supabase.storage.from("items-capture").getPublicUrl(imagePath).data
    .publicUrl;
}
