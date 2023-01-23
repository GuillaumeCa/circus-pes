import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { UserRole } from "../../utils/user";
import { publicProcedure, router, writeProcedure } from "../trpc";

export const responseRouter = router({
  getForItem: publicProcedure
    .input(z.string())
    .query(async ({ ctx, input: id }) => {
      return await ctx.prisma.response.findMany({
        where: { itemId: id },
        orderBy: {
          createdAt: "desc",
        },
        include: {
          user: true,
        },
      });
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
