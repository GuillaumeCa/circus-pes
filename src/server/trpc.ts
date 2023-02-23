import { initTRPC, TRPCError } from "@trpc/server";
import SuperJSON from "superjson";
import { UserRole } from "../utils/user";
import { Context } from "./context";

const t = initTRPC.context<Context>().create({
  transformer: SuperJSON,
});

export function paginate<T>(cursor: number, pageSize: number) {
  return {
    pageQuery: {
      skip: cursor * pageSize,
      take: pageSize + 1,
    },
    createPage(responses: T[]) {
      let nextCursor: number | undefined;
      if (responses.length > pageSize) {
        nextCursor = cursor + 1;
        responses.pop();
      }

      return {
        responses,
        nextCursor,
      };
    },
  };
}

const withOptionalAuth = t.middleware(({ next, ctx }) => {
  return next({
    ctx: {
      session: ctx.session,
    },
  });
});

const isAuthed = t.middleware(({ next, ctx }) => {
  if (!ctx.session?.user?.email) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
    });
  }
  return next({
    ctx: {
      // Infers the `session` as non-nullable
      session: ctx.session,
    },
  });
});

export const withRoles = (roles: UserRole[]) =>
  t.middleware(({ next, ctx: { session } }) => {
    const role = session?.user?.role;
    if (!role || !roles.includes(role)) {
      throw new TRPCError({
        code: "FORBIDDEN",
      });
    }

    return next({
      ctx: {
        // Infers the `session` as non-nullable
        session,
      },
    });
  });

export const middleware = t.middleware;
export const router = t.router;

/**
 * public procedure (optional auth)
 */
export const publicProcedure = t.procedure.use(withOptionalAuth);

/**
 * Protected procedure (auth required)
 */
export const protectedProcedure = t.procedure.use(isAuthed);

/**
 * Allow only user with roles that can write
 */
export const writeProcedure = protectedProcedure.use(
  withRoles([UserRole.CONTRIBUTOR, UserRole.ADMIN])
);

/**
 * Allow only admin user
 */
export const adminProcedure = protectedProcedure.use(
  withRoles([UserRole.ADMIN])
);
