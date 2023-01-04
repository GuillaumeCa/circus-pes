import { Prisma } from "@prisma/client";
import { z } from "zod";
import { UserRole } from "../../utils/user";
import { adminProcedure, publicProcedure, router } from "../trpc";
import { RouterOutput } from "./_app";

export type PatchVersionRouterOutput = RouterOutput["patchVersion"];

export const patchVersionRouter = router({
  getPatchVersions: publicProcedure.query(({ ctx }) => {
    const isAdmin = ctx.session?.user.role === UserRole.ADMIN;

    return prisma!.patchVersion.findMany({
      select: {
        id: true,
        name: true,
        visible: isAdmin,
      },
      orderBy: {
        visible: Prisma.SortOrder.desc,
      },
      where: isAdmin
        ? undefined
        : {
            visible: {
              equals: true,
            },
          },
    });
  }),

  create: adminProcedure
    .input(
      z.object({
        name: z.string(),
      })
    )
    .mutation(async ({ input: { name } }) => {
      await prisma?.patchVersion.create({
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
    .mutation(async ({ input: { visible, id } }) => {
      await prisma?.patchVersion.update({
        data: {
          visible,
        },
        where: {
          id,
        },
      });
    }),
});
