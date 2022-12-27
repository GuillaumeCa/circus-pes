import { supabase } from "../lib/supabase";

export interface LocationInfo {
  id: number;
  gameVersion: string;
  shardId: string;
  location: string;
  description: string;
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
