import { createClient } from "@supabase/supabase-js";
import { useQuery } from "react-query";

const supabaseUrl = "https://jcqtutfytxbhaewyxtoh.supabase.co";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY || "";
export const supabase = createClient(supabaseUrl, supabaseKey);

export function useAuth() {
  const {
    data: res,
    error,
    refetch,
  } = useQuery("session", () => supabase.auth.getSession());

  function logout() {
    supabase.auth.signOut().then(() => {
      refetch();
    });
  }

  return { session: res?.data.session, logout };
}
