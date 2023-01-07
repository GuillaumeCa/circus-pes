import { z } from "zod";
import { minioClient } from "../../lib/minio";
import { IMAGE_BUCKET_NAME } from "../../utils/config";
import { router, writeProcedure } from "../trpc";

export const storageRouter = router({
  presignedUrl: writeProcedure
    .input(z.string())
    .mutation(async ({ input: key }) => {
      return await minioClient.presignedPutObject(
        IMAGE_BUCKET_NAME,
        key,
        2 * 60
      );
    }),
});
