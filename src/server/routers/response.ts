import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { UserRole } from "../../utils/user";
import { publicProcedure, router, writeProcedure } from "../trpc";
import { RouterOutput } from "./_app";

export type ResponseRouterOutput = RouterOutput["response"];

export const RESPONSES_PAGE_SIZE = 5;

export const responseRouter = router({
  getForItem: publicProcedure
    .input(
      z.object({ itemId: z.string(), cursor: z.number().min(0).default(0) })
    )
    .query(async ({ ctx, input: { itemId, cursor: page } }) => {
      const isUserAdmin = ctx.session?.user.role === UserRole.ADMIN;
      const responses = await ctx.prisma.response.findMany({
        where: {
          AND: [
            {
              itemId,
            },
            {
              OR: [
                {
                  isPublic: isUserAdmin ? undefined : true,
                },
                ctx.session
                  ? {
                      userId: ctx.session?.user.id,
                      isPublic: false,
                    }
                  : {},
              ],
            },
          ],
        },
        skip: page * RESPONSES_PAGE_SIZE,
        take: RESPONSES_PAGE_SIZE + 1,
        orderBy: {
          createdAt: "desc",
        },
        include: {
          user: true,
        },
      });

      const nextCursor =
        responses.length <= RESPONSES_PAGE_SIZE ? undefined : page + 1;
      console.log(responses.length);
      return {
        responses,
        nextCursor,
      };
    }),

  create: writeProcedure
    .input(
      z.object({
        itemId: z.string(),
        isFound: z.boolean(),
        comment: z.string(),
      })
    )
    .mutation(async ({ ctx, input: { comment, isFound, itemId } }) => {
      await ctx.prisma.response.create({
        data: {
          comment,
          isFound,
          itemId,
          userId: ctx.session.user.id,
          image: "",
        },
      });
    }),

  delete: writeProcedure
    .input(z.string())
    .mutation(async ({ ctx, input: id }) => {
      if (ctx.session.user.role !== UserRole.ADMIN) {
        const response = await ctx.prisma.response.findFirst({
          where: { userId: ctx.session.user.id, id },
        });
        if (!response) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "cannot delete this response",
          });
        }
      }

      await ctx.prisma.response.delete({ where: { id } });
    }),
});
