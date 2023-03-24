import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { minioClient } from "../../lib/minio";
import {
  formatPreviewItemImageKey,
  formatPreviewResponseImageKey,
  IMAGE_BUCKET_NAME
} from "../../utils/storage";
import { stream2buffer } from "../../utils/stream";
import { UserRole } from "../../utils/user";
import {
  getItemById,
  getItemLocations,
  getItemsByUser,
  getItemsQuery,
  getShardsForRegion as getItemShards,
  sortOptions
} from "../db/item";
import {
  createAndStorePreviewImage,
  createImageUploadUrl,
  isImageValid
} from "../storage";
import {
  adminProcedure,
  paginate,
  protectedProcedure,
  publicProcedure,
  router,
  writeProcedure
} from "../trpc";
import { RouterInput, RouterOutput } from "./_app";

export type ItemRouterInput = RouterInput["item"];
export type ItemRouterOutput = RouterOutput["item"];

const ITEMS_PAGE_SIZE = 20;
const USER_ITEMS_PAGE_SIZE = 20;

const itemFormSchema = z.object({
  patchId: z.string(),
  shardId: z
    .string()
    .regex(
      /(US|EU|AP)(E|S|W|SE)[0-9][A-Z]-[0-9]{3}/,
      "identifier format must be: EUE1A-000"
    ),
  description: z
    .string()
    .min(1, "field must not be empty")
    .max(255, "description must have a max length of 255"),
  location: z.string().min(1, "field must not be empty"),
});

const regionSchema = z.enum(["EU", "US", "APE1", "APSE2"]).optional();
export const itemFilterSchema = z
  .object({
    region: regionSchema,
    shard: z.string().optional(),
    location: z.string().optional(),
  })
  .default({});

export const itemRouter = router({
  getItems: publicProcedure
    .input(
      z.object({
        patchVersion: z.string(),
        sortBy: z.enum(sortOptions),
        filter: itemFilterSchema,
        cursor: z.number().min(0).default(0),
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

        const { pageQuery, createPage } = paginate(
          input.cursor,
          ITEMS_PAGE_SIZE
        );

        const userId = ctx.session?.user?.id;
        const items = await getItemsQuery(
          ctx.prisma,
          input.patchVersion,
          input.sortBy,
          input.filter,
          pageQuery,
          userId,
          true,
          true
        );

        return createPage(items);
      } catch (e) {
        console.error("could not query items", e);
      }

      return { responses: [], nextCursor: 0 };
    }),

  shards: publicProcedure
    .input(
      z.object({
        patchVersion: z.string(),
        region: regionSchema,
      })
    )
    .query(({ ctx, input }) => {
      const userId = ctx.session?.user?.id;

      return getItemShards(
        ctx.prisma,
        input.patchVersion,
        input.region,
        userId,
        true
      );
    }),

  locations: publicProcedure
    .input(
      z.object({
        patchVersion: z.string(),
        region: regionSchema,
        shard: z.string().optional(),
      })
    )
    .query(({ ctx, input }) => {
      const userId = ctx.session?.user?.id;

      return getItemLocations(
        ctx.prisma,
        input.patchVersion,
        input.region,
        input.shard,
        userId,
        true
      );
    }),

  byUser: protectedProcedure
    .input(
      z.object({
        patchVersionId: z.string(),
        cursor: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input: { patchVersionId, cursor } }) => {
      const { createPage, pageQuery } = paginate(cursor, USER_ITEMS_PAGE_SIZE);
      const items = await getItemsByUser(
        ctx.prisma,
        ctx.session.user.id,
        patchVersionId,
        pageQuery
      );

      return createPage(items);
    }),

  getAllItems: adminProcedure
    .input(
      z.object({
        patchVersion: z.string(),
        sortBy: z.enum(["recent", "like"]),
        public: z.boolean().optional(),
        filter: itemFilterSchema,
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

        const userId = ctx.session.user.id;

        return getItemsQuery(
          ctx.prisma,
          input.patchVersion,
          input.sortBy,
          input.filter,
          undefined,
          userId,
          input.public
        );
      } catch (e) {
        console.error("could not query items", e);
      }
    }),

  pendingCount: adminProcedure.query(async ({ ctx }) => {
    return ctx.prisma.item.count({
      where: { public: false, patchVersion: { visible: true } },
    });
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
    .input(itemFormSchema)
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

  edit: writeProcedure
    .input(
      itemFormSchema.merge(
        z.object({
          id: z.string(),
        })
      )
    )
    .mutation(
      async ({
        ctx,
        input: { patchId, id, description, location, shardId },
      }) => {
        const user = ctx.session.user;

        const patch = await ctx.prisma.patchVersion.findFirst({
          where: { id: patchId },
        });
        if (!patch) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "invalid patch version",
          });
        }

        const item = await ctx.prisma.item.findFirst({ where: { id } });
        if (!item) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "cannot find item to edit",
          });
        }
        if (item.public && user.role !== UserRole.ADMIN) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "cannot edit an item that is validated",
          });
        }

        if (
          user.role !== UserRole.ADMIN &&
          !patch.visible &&
          user.id !== item.userId
        ) {
          throw new TRPCError({
            code: "FORBIDDEN",
          });
        }

        return await ctx.prisma.item.update({
          data: {
            description,
            patchVersionId: patchId,
            location,
            shardId,
            public: user.role === UserRole.ADMIN ? item.public : false,
          },
          where: {
            id,
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

      if (
        item.public &&
        ctx.session.user.role !== UserRole.ADMIN &&
        item.image
      ) {
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
      return ctx.prisma
        .$transaction(async (tx) => {
          const item = await tx.item.findFirst({
            where: { id: input.itemId, userId: ctx.session.user.id },
          });

          if (!item) {
            console.error("could not find the item to update");
            throw new TRPCError({ code: "NOT_FOUND" });
          }

          // check if the item already has an imaage set
          if (
            item.public &&
            ctx.session.user.role !== UserRole.ADMIN &&
            item.image
          ) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "image already exist",
            });
          }

          await tx.item.update({
            data: {
              image: input.image,
              public: ctx.session.user.role === UserRole.ADMIN, // make item public by default only for admins
            },
            where: {
              id: input.itemId,
            },
          });

          // retrieve the uploaded image
          const readableStream = await minioClient.getObject(
            IMAGE_BUCKET_NAME,
            input.image
          );

          const imgBuffer = await stream2buffer(readableStream);

          // check if uploaded image has the correct file type, otherwise delete it and the item entity
          const isValid = await isImageValid(imgBuffer);
          if (!isValid) {
            await tx.item.delete({ where: { id: input.itemId } });
            await minioClient.removeObject(IMAGE_BUCKET_NAME, input.image);

            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "invalid file type",
            });
          }

          await createAndStorePreviewImage(
            imgBuffer,
            formatPreviewItemImageKey(item.patchVersionId, item.id)
          );
        })
        .catch((err) => {
          if (err instanceof TRPCError) {
            throw err;
          }
          console.error("Failed to set the image for the item", err);
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
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

        const deletedItem = await tx.item.delete({
          where: {
            id,
          },
          select: {
            id: true,
          },
        });

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
