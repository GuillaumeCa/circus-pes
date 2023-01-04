export const IMAGE_BUCKET_NAME =
  process.env.MINIO_IMAGE_BUCKET_NAME || "circuspes-images";
export const STORAGE_BASE_URL = `https://${
  process.env.NEXT_PUBLIC_MINIO_ENDPOINT || "localhost"
}:9000/${IMAGE_BUCKET_NAME}/`;
