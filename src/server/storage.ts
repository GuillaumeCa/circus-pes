import { fileTypeFromBuffer } from "file-type";
import sharp from "sharp";
import { minioClient } from "../lib/minio";
import {
  IMAGE_BUCKET_NAME,
  MAX_IMAGE_UPLOAD_SIZE,
  MIN_IMAGE_UPLOAD_SIZE,
  PRESIGNED_UPLOAD_IMAGE_EXPIRATION_DURATION,
} from "../utils/storage";

export function createImageUploadUrl(
  key: string,
  imageExt: string,
  uploadExpiration = PRESIGNED_UPLOAD_IMAGE_EXPIRATION_DURATION
) {
  const policy = minioClient.newPostPolicy();
  policy.setBucket(IMAGE_BUCKET_NAME);
  policy.setKey(key);

  var expires = new Date();
  expires.setSeconds(uploadExpiration); // expires in 2min
  policy.setExpires(expires);
  policy.setContentType("image/" + imageExt);
  policy.setContentLengthRange(MIN_IMAGE_UPLOAD_SIZE, MAX_IMAGE_UPLOAD_SIZE); // up to 5MB

  return minioClient.presignedPostPolicy(policy);
}

export async function isImageValid(imgBuffer: Buffer) {
  const fileType = await fileTypeFromBuffer(imgBuffer);
  const isValid = fileType && ["jpg", "jpeg", "png"].includes(fileType.ext);
  if (!isValid) {
    console.error("File type not valid: ", fileType?.ext);
  }
  return isValid;
}

export async function createAndStorePreviewImage(
  imgBuffer: Buffer,
  imagePreviewKey: string
) {
  const previewFormat = "webp";
  // create preview image
  const previewImgBuffer = await sharp(imgBuffer)
    .resize({ width: 1000 })
    .toFormat(previewFormat)
    .toBuffer();

  await minioClient.putObject(
    IMAGE_BUCKET_NAME,
    imagePreviewKey,
    previewImgBuffer,
    {
      "content-type": "image/" + previewFormat,
      "cache-control": "public, max-age=1296000", // cache for 15 days
    }
  );
}
