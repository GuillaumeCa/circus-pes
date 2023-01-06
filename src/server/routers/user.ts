import { z } from "zod";
import { adminProcedure, router } from "../trpc";
import { RouterOutput } from "./_app";

export type UserRouterOutput = RouterOutput["user"];

export const userRouter = router({
  getUsers: adminProcedure.query(async ({ ctx }) => {
    return await ctx.prisma.user.findMany();
  }),

  updateRole: adminProcedure
    .input(
      z.object({
        userId: z.string(),
        role: z.number().min(0).max(2),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.prisma.user.update({
        data: {
          role: input.role,
        },
        where: {
          id: input.userId,
        },
      });
    }),
});
