import { z } from "zod";
import { supabase } from "../lib/supabase";
import { SortOption } from "../pages";

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

const MAX_IMAGE_FILE_SIZE = 5e6; // 5M bytes

export const itemFormSchema = z.object({
  gameVersion: z
    .string()
    .regex(/(PTU|LIVE).[0-9]+/, "Le format doit être PTU.00000 ou LIVE.00000"),
  shardId: z
    .string()
    .regex(
      /(US|EU|AP)()[0-9][A-Z]-[0-9]{3}/,
      "L'identifiant doit être au format EUE1A-000"
    ),
  description: z
    .string()
    .min(1, "Le champ ne doit pas être vide")
    .max(255, "La description ne doit pas dépasser 255 caractères"),
  location: z.string().min(1, "Le champ ne doit pas être vide"),
  image:
    typeof window === "undefined"
      ? z.null()
      : z
          .instanceof(FileList, { message: "Une image est requise" })
          .refine((f: FileList) => {
            return f && f.length > 0 && f[0].size <= MAX_IMAGE_FILE_SIZE;
          }, "L'image est trop grosse, elle doit faire moins de 5 Mo"),
});

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
