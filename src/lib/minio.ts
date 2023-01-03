import * as Minio from "minio";

export const minioClient = new Minio.Client({
  endPoint: process.env.NEXT_PUBLIC_MINIO_ENDPOINT || "",
  port: 9000,
  useSSL: true,
  accessKey: process.env.MINIO_ACCESS_KEY || "",
  secretKey: process.env.MINIO_SECRET_KEY || "",
});
