import { supabase } from "../lib/supabase";

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

export interface LocationInfo {
  id: number;
  gameVersion: string;
  shardId: string;
  location: string;
  description: string;
  item_capture_url: string;
  users_id?: string;
  users_avatar_url?: string;
  users_name?: string;
  likes_cnt: number;
  has_liked: number;
  created_at: number;
}

export function getItems() {
  return supabase.from("items_users_likes").select<"*", LocationInfo>();
}

export async function deleteItem(item: ItemsEntity) {
  await supabase.from("items").delete().eq("id", item.id);
  await supabase.storage.from("items-capture").remove([item.item_capture_url]);
}

export function getItemImageUrl(imagePath: string) {
  return supabase.storage.from("items-capture").getPublicUrl(imagePath).data
    .publicUrl;
}
