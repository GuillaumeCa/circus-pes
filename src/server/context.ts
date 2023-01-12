import type { inferAsyncReturnType } from "@trpc/server";
import type { CreateNextContextOptions } from "@trpc/server/adapters/next";
import { unstable_getServerSession as getServerSession } from "next-auth";
import { authOptions as nextAuthOptions } from "../pages/api/auth/[...nextauth]";
import { prisma } from "./db/client";

/**
 * Creates context for an incoming request
 * @link https://trpc.io/docs/context
 */
export async function createContext(opts: CreateNextContextOptions) {
  const req = opts?.req;
  const res = opts?.res;

  const session =
    req && res && (await getServerSession(req, res, nextAuthOptions));

  return {
    session,
    prisma,
  };
}

export async function createStaticContext() {
  return {
    session: null,
    prisma,
  };
}

export type Context = inferAsyncReturnType<typeof createContext>;
