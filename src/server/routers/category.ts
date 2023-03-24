import { z } from "zod";
import { adminProcedure, publicProcedure, router } from "../trpc";

export const categoryRouter = router({
  getAll: publicProcedure.query(async ({ ctx }) => {
    return ctx.prisma.category.findMany();
  }),

  create: adminProcedure
    .input(
      z.object({
        name: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.category.create({
        data: {
          name: input.name,
        },
      });
    }),
});
