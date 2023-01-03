import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY || "";
export const supabase = createClient(supabaseUrl, supabaseKey);

// export function useAuth() {
//   const { data } = useSession();

// const {
//   data: res,
//   error,
//   refetch,
// } = useQuery("session", () => supabase.auth.getSession());
// const userId = res?.data.session?.user.id;
// const { data: user } = useQuery(
//   ["user", userId],
//   ({ queryKey: [_, id] }) => getUser(id!),
//   {
//     enabled: !!userId,
//   }
// );

//   function signIn() {
//     supabase.auth.signInWithOAuth({
//       provider: "discord",
//     });
//   }

//   function hasWriteAccess() {
//     return [UserRole.ADMIN, UserRole.CONTRIBUTOR].includes(user?.role ?? -1);
//   }

//   return { session: res?.data.session, user, hasWriteAccess, logout, signIn };
// }
