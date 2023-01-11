import { Prisma } from "@prisma/client";
import { TRPCError } from "@trpc/server";
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
          visible: false,
        },
      });
    }),

  delete: adminProcedure
    .input(z.string())
    .mutation(async ({ ctx, input: id }) => {
      const nbItemsForVersion = await ctx.prisma.item.count({
        where: { patchVersionId: id },
      });
      if (nbItemsForVersion > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "cannot delete version which has items",
        });
      }

      await ctx.prisma.patchVersion.delete({ where: { id } });
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
