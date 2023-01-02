import { supabase } from "../lib/supabase";

interface LikesEntity {
  user_id: string;
  item_id: number;
}

export function unlikeItem(user_id: string, item_id: number) {
  return supabase.from("likes").delete().match({ user_id, item_id });
}

export function likeItem(user_id: string, item_id: number) {
  return supabase.from("likes").insert({
    user_id,
    item_id,
  });
}
