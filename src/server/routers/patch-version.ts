import { Prisma } from "@prisma/client";
import { z } from "zod";
import { adminProcedure, publicProcedure, router } from "../trpc";
import { RouterOutput } from "./_app";

export type PatchVersionRouterOutput = RouterOutput["patchVersion"];

export const patchVersionRouter = router({
  getPatchVersions: publicProcedure.query(({ ctx }) => {
    return ctx.prisma.patchVersion.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: [
        {
          name: Prisma.SortOrder.desc,
        },
      ],
      where: {
        visible: true,
      },
    });
  }),

  getAllPatchVersions: adminProcedure.query(({ ctx }) => {
    return ctx.prisma.patchVersion.findMany({
      select: {
        id: true,
        name: true,
        visible: true,
      },
      orderBy: [
        {
          visible: Prisma.SortOrder.desc,
        },
        {
          name: Prisma.SortOrder.desc,
        },
      ],
    });
  }),

  create: adminProcedure
    .input(
      z.object({
        name: z.string(),
      })
    )
    .mutation(async ({ input: { name }, ctx }) => {
      await ctx.prisma.patchVersion.create({
        data: {
          name,
          visible: true,
        },
      });
    }),

  updateVisibility: adminProcedure
    .input(
      z.object({
        id: z.string(),
        visible: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input: { visible, id } }) => {
      await ctx.prisma.patchVersion.update({
        data: {
          visible,
        },
        where: {
          id,
        },
      });
    }),
});
