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
import { publicProcedure, router, writeProcedure } from "../trpc";
import { RouterOutput } from "./_app";

export type ResponseRouterOutput = RouterOutput["response"];

export const RESPONSES_PAGE_SIZE = 5;

export const responseRouter = router({
  getForItem: publicProcedure
    .input(
      z.object({ itemId: z.string(), cursor: z.number().min(0).default(0) })
    )
    .query(async ({ ctx, input: { itemId, cursor: page } }) => {
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
                          isPublic: false,
                          userId: ctx.session?.user.id,
                        }
                      : {},
                    {
                      isPublic: true,
                    },
                  ],
                },
          ],
        },
        skip: page * RESPONSES_PAGE_SIZE,
        take: RESPONSES_PAGE_SIZE + 1,
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

      const nextCursor =
        responses.length <= RESPONSES_PAGE_SIZE ? undefined : page + 1;
      return {
        responses,
        nextCursor,
      };
    }),

  create: writeProcedure
    .input(
      z.object({
        itemId: z.string(),
        isFound: z.boolean(),
        comment: z.string(),
      })
    )
    .mutation(async ({ ctx, input: { comment, isFound, itemId } }) => {
      return await ctx.prisma.response.create({
        data: {
          comment,
          isFound,
          itemId,
          userId: ctx.session.user.id,
        },
      });
    }),

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
      const response = await ctx.prisma.response.findFirst({
        where: { id: input.id, userId: ctx.session.user.id },
      });

      if (!response) {
        console.error("could not find the response to update");
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      // check if the item already has an imaage set
      if (response.image) {
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
        await ctx.prisma.response.delete({ where: { id: input.id } });

        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "invalid file type",
        });
      }

      await createAndStorePreviewImage(
        imgBuffer,
        formatPreviewResponseImageKey(response.id)
      );

      await ctx.prisma.response.update({
        data: {
          image: input.image,
          isPublic: ctx.session.user.role === UserRole.ADMIN, // make item public by default only for admins
        },
        where: {
          id: input.id,
        },
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
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "cannot delete this response",
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
});
