import { Prisma } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { minioClient } from "../../lib/minio";
import { IMAGE_BUCKET_NAME } from "../../utils/config";
import { UserRole } from "../../utils/user";
import {
  protectedProcedure,
  publicProcedure,
  router,
  writeProcedure,
} from "../trpc";
import { RouterInput } from "./_app";

export interface LocationInfo {
  id: string;
  patchVersion: string;
  shardId: string;
  location: string;
  description: string;
  image?: string;
  userId?: string;
  userImage?: string;
  userName?: string;
  likesCount: number;
  hasLiked?: number;
  createdAt: number;
}

export type ItemRouterInput = RouterInput["item"];

export const itemRouter = router({
  getItems: publicProcedure
    .input(
      z.object({
        patchVersion: z.string(),
        sortBy: z.enum(["recent", "like"]),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const versionCount = await prisma?.patchVersion.count({
          where: { id: input.patchVersion },
        });

        if (!versionCount) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "invalid patch version: " + input.patchVersion,
          });
        }

        const userId = ctx.session?.user?.id;
        const res = await prisma!.$queryRaw<LocationInfo[]>`
      select 
        i.id,
        pv.name as "patchVersion",
        i.description,
        i.location,
        i."shardId",
        i.public,
        i."createdAt",
        i."userId",
        i.image,
        u.image as "userImage",
        u.name as "userName",
        count(l."itemId")::int as "likesCount"
        ${
          userId
            ? Prisma.sql`, (select count(*)::int from "like" l1 where l1."itemId" = i.id and l1."userId" = ${userId}) as "hasLiked"`
            : Prisma.empty
        }
      from item i
      left join patch_version pv on pv.id = i."patchVersionId"
      left join "like" l on l."itemId" = i.id
      left join "user" u on u.id = i."userId"
      where i."patchVersionId" = ${input.patchVersion}
      group by (i.id, u.id, pv.id)
      order by ${input.sortBy === "recent" ? "i.createdAt" : "likesCount"} asc
    `;

        return res;
      } catch (e) {
        console.error("could not query items", e);
      }
    }),

  createItem: writeProcedure
    .input(
      z.object({
        patchId: z.string(),
        shardId: z
          .string()
          .regex(
            /(US|EU|AP)(E|S|W)[0-9][A-Z]-[0-9]{3}/,
            "L'identifiant doit être au format EUE1A-000"
          ),
        description: z
          .string()
          .min(1, "Le champ ne doit pas être vide")
          .max(255, "La description ne doit pas dépasser 255 caractères"),
        location: z.string().min(1, "Le champ ne doit pas être vide"),
      })
    )
    .mutation(
      async ({ input: { description, patchId, location, shardId }, ctx }) => {
        return await prisma?.item.create({
          data: {
            description,
            patchVersionId: patchId,
            location,
            shardId,
            userId: ctx.session.user.id,
            public: false,
          },
          select: {
            id: true,
          },
        });
      }
    ),

  setItemImage: writeProcedure
    .input(
      z.object({
        itemId: z.string(),
        image: z.string(),
      })
    )
    .mutation(
      async ({
        input,
        ctx: {
          session: { user },
        },
      }) => {
        if (user.role === UserRole.INVITED) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }

        const item = await prisma!.item.findFirst({
          where: { id: input.itemId, userId: user.id },
        });

        if (!item) {
          console.error("could not find the item to update");
          throw new TRPCError({ code: "NOT_FOUND" });
        }

        await prisma?.item.update({
          data: {
            image: input.image,
          },
          where: {
            id: input.itemId,
          },
        });
      }
    ),

  deleteItem: writeProcedure.input(z.string()).mutation(
    async ({
      input: id,
      ctx: {
        session: { user },
      },
    }) => {
      return await prisma?.$transaction(async (tx) => {
        const item = await tx.item.findFirst({ where: { id } });
        if (!item) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "cannot find item",
          });
        }

        if (user.role === UserRole.CONTRIBUTOR && item?.userId !== user.id) {
          console.error(
            "user with role contributor can only delete their item"
          );
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "user with role contributor can only delete their item",
          });
        }

        const deletedItem = await tx.item.delete({
          where: {
            id,
          },
          select: {
            id: true,
          },
        });

        if (item.image) {
          await minioClient.removeObject(IMAGE_BUCKET_NAME, item.image);
        }

        return deletedItem;
      });
    }
  ),

  like: protectedProcedure.input(z.string()).mutation(
    async ({
      input: itemId,
      ctx: {
        session: { user },
      },
    }) => {
      return await prisma?.like.create({
        data: {
          userId: user.id,
          itemId,
        },
      });
    }
  ),

  unLike: protectedProcedure.input(z.string()).mutation(
    async ({
      input: itemId,
      ctx: {
        session: { user },
      },
    }) => {
      return await prisma?.like.delete({
        where: {
          userId_itemId: {
            userId: user.id,
            itemId,
          },
        },
      });
    }
  ),
});
