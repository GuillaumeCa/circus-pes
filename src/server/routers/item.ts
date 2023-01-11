import { TRPCError } from "@trpc/server";
import { fileTypeFromBuffer } from "file-type";
import sharp from "sharp";
import { z } from "zod";

import { minioClient } from "../../lib/minio";
import {
  formatPreviewImageKey,
  IMAGE_BUCKET_NAME,
  MAX_IMAGE_UPLOAD_SIZE,
  MIN_IMAGE_UPLOAD_SIZE,
  PRESIGNED_UPLOAD_IMAGE_EXPIRATION_DURATION,
} from "../../utils/storage";
import { stream2buffer } from "../../utils/stream";
import { UserRole } from "../../utils/user";
import { getItemById, getItemsQuery } from "../db/item";
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
      const policy = minioClient.newPostPolicy();
      policy.setBucket(IMAGE_BUCKET_NAME);
      policy.setKey(`${item.patchVersionId}/${item.id}.${input.ext}`);

      var expires = new Date();
      expires.setSeconds(PRESIGNED_UPLOAD_IMAGE_EXPIRATION_DURATION); // expires in 2min
      policy.setExpires(expires);
      policy.setContentType("image/" + input.ext);
      policy.setContentLengthRange(
        MIN_IMAGE_UPLOAD_SIZE,
        MAX_IMAGE_UPLOAD_SIZE
      ); // up to 5MB

      return await minioClient.presignedPostPolicy(policy);
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
      const fileType = await fileTypeFromBuffer(imgBuffer);
      if (!fileType || !["jpg", "jpeg", "png"].includes(fileType.ext)) {
        await minioClient.removeObject(IMAGE_BUCKET_NAME, input.image);
        await ctx.prisma.item.delete({ where: { id: input.itemId } });

        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "invalid file type",
        });
      }

      // create preview image
      const previewImgBuffer = await sharp(imgBuffer)
        .resize({ width: 500 })
        .toFormat("webp")
        .toBuffer();

      await minioClient.putObject(
        IMAGE_BUCKET_NAME,
        formatPreviewImageKey(item.patchVersionId, item.id),
        previewImgBuffer
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
          await minioClient.removeObject(
            IMAGE_BUCKET_NAME,
            formatPreviewImageKey(item.patchVersionId, item.id)
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
