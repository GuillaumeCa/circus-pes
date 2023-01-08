export const MIN_IMAGE_UPLOAD_SIZE = 1024; // 1KB;
export const MAX_IMAGE_UPLOAD_SIZE = 5e6; // 5MB
export const PRESIGNED_UPLOAD_IMAGE_EXPIRATION_DURATION = 5 * 60; // 5min

export const formatPreviewImageUrl = (patchId: string, itemId: string) =>
  STORAGE_BASE_URL + formatPreviewImageKey(patchId, itemId);

export const formatPreviewImageKey = (patchId: string, itemId: string) =>
  `${patchId}/${itemId}_preview.webp`;

export const formatImageUrl = (imageKey: string) => STORAGE_BASE_URL + imageKey;

export const IMAGE_BUCKET_NAME =
  process.env.NEXT_PUBLIC_MINIO_IMAGE_BUCKET_NAME || "circuspes-images";
export const STORAGE_BASE_URL = `https://${
  process.env.NEXT_PUBLIC_MINIO_ENDPOINT || ""
}/${IMAGE_BUCKET_NAME}/`;
