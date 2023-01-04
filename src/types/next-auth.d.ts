import { User as MyUser } from "@prisma/client";
import "next-auth";
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      id: string;
      discriminator: string;
      role: number;
    } & DefaultSession["user"];
  }

  interface User extends MyUser {}
}
