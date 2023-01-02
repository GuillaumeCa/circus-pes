import { createClient } from "@supabase/supabase-js";
import { useQuery } from "react-query";
import { getUser, UserRole } from "../model/users";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY || "";
export const supabase = createClient(supabaseUrl, supabaseKey);

export function useAuth() {
  const {
    data: res,
    error,
    refetch,
  } = useQuery("session", () => supabase.auth.getSession());
  const userId = res?.data.session?.user.id;
  const { data: user } = useQuery(
    ["user", userId],
    ({ queryKey: [_, id] }) => getUser(id!),
    {
      enabled: !!userId,
    }
  );

  function logout() {
    supabase.auth.signOut().then(() => {
      refetch();
    });
  }

  function signIn() {
    supabase.auth.signInWithOAuth({
      provider: "discord",
    });
  }

  function hasWriteAccess() {
    return [UserRole.ADMIN, UserRole.CONTRIBUTOR].includes(user?.role ?? -1);
  }

  return { session: res?.data.session, user, hasWriteAccess, logout, signIn };
}
