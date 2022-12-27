import { supabase } from "../lib/supabase";

export enum UserRole {
  INVITED,
  CONTRIBUTOR,
  ADMIN,
}

export interface User {
  id: string;
  name: string;
  avatar_url: string;
  role: UserRole;
}

const USER_TABLE = "users";

export async function getUsers() {
  try {
    const { data } = await supabase.from(USER_TABLE).select<"*", User>();

    return data;
  } catch (error: any) {
    throw new Error("failed to retrieve users: " + error.message);
  }
}

export async function getUser(id: string) {
  try {
    const { data } = await supabase
      .from(USER_TABLE)
      .select<"*", User>()
      .eq("id", id)
      .single();

    return data;
  } catch (error: any) {
    throw new Error("failed to retrieve users: " + error.message);
  }
}

export function updateRole(id: string, role: UserRole) {
  return supabase.from(USER_TABLE).update({ role }).eq("id", id);
}
