import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { minioClient } from "../../lib/minio";
import {
  formatPreviewItemImageKey,
  formatPreviewResponseImageKey,
  IMAGE_BUCKET_NAME,
} from "../../utils/storage";
import { stream2buffer } from "../../utils/stream";
import { UserRole } from "../../utils/user";
import { getItemById, getItemsQuery, sortOptions } from "../db/item";
import {
  createAndStorePreviewImage,
  createImageUploadUrl,
  isImageValid,
} from "../storage";
import {
  adminProcedure,
  protectedProcedure,
  publicProcedure,
  router,
  writeProcedure,
} from "../trpc";
import { RouterInput } from "./_app";

export type ItemRouterInput = RouterInput["item"];

export const itemRouter = router({
  getItems: publicProcedure
    .input(
      z.object({
        patchVersion: z.string(),
        sortBy: z.enum(sortOptions),
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

  byId: publicProcedure
    .input(z.string().optional())
    .query(async ({ ctx, input: id }) => {
      if (!id) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const items = await getItemById(ctx.prisma, id, ctx.session?.user.id);
      if (items.length > 0) {
        return items[0];
      }

      throw new TRPCError({ code: "NOT_FOUND" });
    }),

  create: writeProcedure
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
        const patch = await ctx.prisma.patchVersion.findFirst({
          where: { id: patchId },
        });
        if (!patch) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "invalid patch version",
          });
        }

        if (ctx.session.user.role !== UserRole.ADMIN && !patch.visible) {
          throw new TRPCError({
            code: "FORBIDDEN",
          });
        }

        return await ctx.prisma.item.create({
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

  imageUploadUrl: writeProcedure
    .input(
      z.object({
        itemId: z.string(),
        ext: z.enum(["jpg", "jpeg", "png"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const item = await ctx.prisma.item.findFirst({
        where: { id: input.itemId },
      });
      if (!item) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "cannot find item",
        });
      }

      if (item.image) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "image already exist",
        });
      }

      return createImageUploadUrl(
        `${item.patchVersionId}/${item.id}.${input.ext}`,
        input.ext
      );
    }),

  setItemImage: writeProcedure
    .input(
      z.object({
        itemId: z.string(),
        image: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const item = await ctx.prisma.item.findFirst({
        where: { id: input.itemId, userId: ctx.session.user.id },
      });

      if (!item) {
        console.error("could not find the item to update");
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      // check if the item already has an imaage set
      if (item.image) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "image already exist",
        });
      }

      // retrieve the uploaded image
      const readableStream = await minioClient.getObject(
        IMAGE_BUCKET_NAME,
        input.image
      );

      const imgBuffer = await stream2buffer(readableStream);

      // check if uploaded image has the correct file type, otherwise delete it and the item entity
      const isValid = await isImageValid(imgBuffer);
      if (!isValid) {
        await minioClient.removeObject(IMAGE_BUCKET_NAME, input.image);
        await ctx.prisma.item.delete({ where: { id: input.itemId } });

        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "invalid file type",
        });
      }

      await createAndStorePreviewImage(
        imgBuffer,
        formatPreviewItemImageKey(item.patchVersionId, item.id)
      );

      await ctx.prisma.item.update({
        data: {
          image: input.image,
          public: ctx.session.user.role === UserRole.ADMIN, // make item public by default only for admins
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

        const user = ctx.session.user;
        if (user.role === UserRole.CONTRIBUTOR && item?.userId !== user.id) {
          console.error(
            "user with role contributor can only delete their item"
          );
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "user with role contributor can only delete their item",
          });
        }

        const responses = await tx.response.findMany({ where: { itemId: id } });

        await Promise.all(
          responses.map(async (r) => {
            if (r.image) {
              await minioClient.removeObject(IMAGE_BUCKET_NAME, r.image);
              await minioClient.removeObject(
                IMAGE_BUCKET_NAME,
                formatPreviewResponseImageKey(r.id)
              );
            }
          })
        );

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
          await minioClient.removeObject(
            IMAGE_BUCKET_NAME,
            formatPreviewItemImageKey(item.patchVersionId, item.id)
          );
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
