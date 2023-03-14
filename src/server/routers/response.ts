import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { minioClient } from "../../lib/minio";
import {
  formatPreviewResponseImageKey,
  IMAGE_BUCKET_NAME,
} from "../../utils/storage";
import { stream2buffer } from "../../utils/stream";
import { UserRole } from "../../utils/user";
import {
  createAndStorePreviewImage,
  createImageUploadUrl,
  isImageValid,
} from "../storage";
import {
  adminProcedure,
  paginate,
  publicProcedure,
  router,
  writeProcedure,
} from "../trpc";
import { RouterOutput } from "./_app";

export type ResponseRouterOutput = RouterOutput["response"];

const RESPONSES_PAGE_SIZE = 5;
const ADMIN_RESPONSE_PAGE_SIZE = 10;

export const responseRouter = router({
  getForItem: publicProcedure
    .input(
      z.object({ itemId: z.string(), cursor: z.number().min(0).default(0) })
    )
    .query(async ({ ctx, input: { itemId, cursor: page } }) => {
      const { pageQuery, createPage } = paginate(page, RESPONSES_PAGE_SIZE);
      const isUserAdmin = ctx.session?.user.role === UserRole.ADMIN;
      const responses = await ctx.prisma.response.findMany({
        where: {
          AND: [
            {
              itemId,
            },
            isUserAdmin
              ? {}
              : {
                  OR: [
                    ctx.session
                      ? {
                          public: false,
                          userId: ctx.session?.user.id,
                        }
                      : {},
                    {
                      public: true,
                    },
                  ],
                },
          ],
        },
        ...pageQuery,
        orderBy: {
          createdAt: "desc",
        },
        include: {
          user: {
            select: {
              image: true,
              name: true,
            },
          },
        },
      });

      return createPage(responses);
    }),

  getAdminResponses: adminProcedure
    .input(
      z.object({
        public: z.boolean().default(false).optional(),
        cursor: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const { pageQuery, createPage } = paginate(
        input.cursor,
        ADMIN_RESPONSE_PAGE_SIZE
      );
      const responses = await ctx.prisma.response.findMany({
        where: {
          public: input.public,
        },
        include: {
          item: {
            select: {
              image: true,
              description: true,
              location: true,
              patchVersionId: true,
              shardId: true,
              createdAt: true,
              updatedAt: true,
              user: {
                select: {
                  name: true,
                  image: true,
                },
              },
            },
          },
          user: {
            select: {
              image: true,
              name: true,
            },
          },
        },
        ...pageQuery,
        orderBy: {
          createdAt: "desc",
        },
      });

      return createPage(responses);
    }),

  pendingCount: adminProcedure.query(async ({ ctx }) => {
    return ctx.prisma.response.count({ where: { public: false } });
  }),

  create: writeProcedure
    .input(
      z.object({
        itemId: z.string(),
        isFound: z.boolean(),
        comment: z.string(),
        withImage: z.boolean(),
      })
    )
    .mutation(
      async ({ ctx, input: { comment, isFound, itemId, withImage } }) => {
        const isUserAdmin = ctx.session.user.role === UserRole.ADMIN;
        return await ctx.prisma.response.create({
          data: {
            comment,
            isFound,
            itemId,
            userId: ctx.session.user.id,
            public: isUserAdmin && !withImage ? true : false,
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
        id: z.string(),
        ext: z.enum(["jpg", "jpeg", "png"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const response = await ctx.prisma.response.findFirst({
        where: { id: input.id },
      });
      if (!response) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "cannot find response",
        });
      }

      if (response.image) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "image already exist for response",
        });
      }

      return createImageUploadUrl(
        `response/${response.id}.${input.ext}`,
        input.ext
      );
    }),

  setImage: writeProcedure
    .input(
      z.object({
        id: z.string(),
        image: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return ctx.prisma
        .$transaction(async (tx) => {
          const response = await tx.response.findFirst({
            where: { id: input.id, userId: ctx.session.user.id },
          });

          if (!response) {
            console.error("could not find the response to update");
            throw new TRPCError({ code: "NOT_FOUND" });
          }

          // check if the item already has an image set
          if (response.image) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "image already exist",
            });
          }

          await tx.response.update({
            data: {
              image: input.image,
              public: ctx.session.user.role === UserRole.ADMIN, // make item public by default only for admins
            },
            where: {
              id: input.id,
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
            await minioClient.removeObject(IMAGE_BUCKET_NAME, input.image);
            await tx.response.delete({ where: { id: input.id } });

            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "invalid file type",
            });
          }

          await createAndStorePreviewImage(
            imgBuffer,
            formatPreviewResponseImageKey(response.id)
          );
        })
        .catch((err) => {
          if (err instanceof TRPCError) {
            throw err;
          }
          console.error("Failed to set the image for the response", err);
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        });
    }),

  delete: writeProcedure
    .input(z.string())
    .mutation(async ({ ctx, input: id }) => {
      return await ctx.prisma.$transaction(async (tx) => {
        const response = await tx.response.findFirst({
          where: { id },
        });
        if (!response) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "cannot find this response",
          });
        }

        const user = ctx.session.user;
        if (user.role !== UserRole.ADMIN && user.id !== response.userId) {
          console.error(
            "user with role contributor can only delete their item"
          );
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "user with role contributor can only delete their item",
          });
        }

        const deletedResponse = await tx.response.delete({ where: { id } });

        if (response.image) {
          await minioClient.removeObject(IMAGE_BUCKET_NAME, response.image);
          await minioClient.removeObject(
            IMAGE_BUCKET_NAME,
            formatPreviewResponseImageKey(response.id)
          );
        }

        return deletedResponse;
      });
    }),

  updateVisibility: adminProcedure
    .input(
      z.object({
        id: z.string(),
        public: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.response.update({
        data: {
          public: input.public,
        },
        where: {
          id: input.id,
        },
      });
    }),
});
