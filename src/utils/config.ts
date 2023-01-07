export const IMAGE_BUCKET_NAME =
  process.env.NEXT_PUBLIC_MINIO_IMAGE_BUCKET_NAME || "circuspes-images";
export const STORAGE_BASE_URL = `https://${
  process.env.NEXT_PUBLIC_MINIO_ENDPOINT || ""
}/${IMAGE_BUCKET_NAME}/`;
