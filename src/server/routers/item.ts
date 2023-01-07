import { Prisma } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { minioClient } from "../../lib/minio";
import { IMAGE_BUCKET_NAME } from "../../utils/config";
import { UserRole } from "../../utils/user";
import type { MyPrismaClient } from "../db/client";
import {
  adminProcedure,
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
  public: boolean;
}

export type ItemRouterInput = RouterInput["item"];

function getItemsQuery(
  prismaClient: MyPrismaClient,
  patchVersionId: string,
  sortBy: "recent" | "like",
  userId?: string,
  filterPublic?: boolean,
  showPrivateForCurrentUser = false
) {
  return prismaClient.$queryRaw<LocationInfo[]>`
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
  where i."patchVersionId" = ${patchVersionId} ${
    filterPublic === undefined
      ? Prisma.empty
      : showPrivateForCurrentUser
      ? Prisma.sql`and (i.public = ${filterPublic} or (i."userId" = ${userId} and i.public = false))`
      : Prisma.sql`and (i.public = ${filterPublic})`
  }
  group by (i.id, u.id, pv.id)
  order by ${
    sortBy === "recent" ? Prisma.sql`i."createdAt"` : Prisma.sql`"likesCount"`
  } desc
`;
}

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
        const versionCount = await ctx.prisma.patchVersion.count({
          where: { id: input.patchVersion },
        });

        if (!versionCount) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "invalid patch version: " + input.patchVersion,
          });
        }

        const userId = ctx.session?.user?.id;
        return getItemsQuery(
          ctx.prisma,
          input.patchVersion,
          input.sortBy,
          userId,
          true,
          true
        );
      } catch (e) {
        console.error("could not query items", e);
      }
    }),

  getAllItems: adminProcedure
    .input(
      z.object({
        patchVersion: z.string(),
        sortBy: z.enum(["recent", "like"]),
        public: z.boolean().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const versionCount = await ctx.prisma.patchVersion.count({
          where: { id: input.patchVersion },
        });

        if (!versionCount) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "invalid patch version: " + input.patchVersion,
          });
        }

        const userId = ctx.session?.user?.id;

        return getItemsQuery(
          ctx.prisma,
          input.patchVersion,
          input.sortBy,
          userId,
          input.public
        );
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
        return await ctx.prisma?.item.create({
          data: {
            description,
            patchVersionId: patchId,
            location,
            shardId,
            userId: ctx.session.user.id,
            public: ctx.session.user.role === UserRole.ADMIN, // make item public by default only for admins
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
    .mutation(async ({ input, ctx }) => {
      if (ctx.session.user.role === UserRole.INVITED) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const item = await ctx.prisma.item.findFirst({
        where: { id: input.itemId, userId: ctx.session.user.id },
      });

      if (!item) {
        console.error("could not find the item to update");
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      await ctx.prisma.item.update({
        data: {
          image: input.image,
        },
        where: {
          id: input.itemId,
        },
      });
    }),

  deleteItem: writeProcedure
    .input(z.string())
    .mutation(async ({ input: id, ctx }) => {
      return await ctx.prisma.$transaction(async (tx) => {
        const item = await tx.item.findFirst({ where: { id } });
        if (!item) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "cannot find item",
          });
        }

        if (
          ctx.session.user.role === UserRole.CONTRIBUTOR &&
          item?.userId !== ctx.session.user.id
        ) {
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
    }),

  like: protectedProcedure
    .input(z.string())
    .mutation(async ({ input: itemId, ctx }) => {
      return await ctx.prisma.like.create({
        data: {
          userId: ctx.session.user.id,
          itemId,
        },
      });
    }),

  unLike: protectedProcedure
    .input(z.string())
    .mutation(async ({ input: itemId, ctx }) => {
      return await ctx.prisma.like.delete({
        where: {
          userId_itemId: {
            userId: ctx.session.user.id,
            itemId,
          },
        },
      });
    }),

  updateVisibility: adminProcedure
    .input(
      z.object({
        itemId: z.string(),
        public: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.item.update({
        data: {
          public: input.public,
        },
        where: {
          id: input.itemId,
        },
      });
    }),
});
