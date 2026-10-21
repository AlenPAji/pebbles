import "server-only";

import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const bucket = "products";

const storageConfig = {
  region: process.env.AWS_REGION,
  endpoint: process.env.AWS_ENDPOINT_URL_S3,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? ""
  }
};

function getStorageClient() {
  if (!storageConfig.region || !storageConfig.endpoint || !storageConfig.credentials.accessKeyId || !storageConfig.credentials.secretAccessKey) {
    throw new Error("Neon Object Storage credentials are not configured");
  }

  return new S3Client(storageConfig);
}

export async function uploadProductImage(key: string, body: Buffer, contentType: string) {
  await getStorageClient().send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: body,
    ContentType: contentType
  }));
}

export async function deleteProductImage(key: string) {
  await getStorageClient().send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}

export async function getProductImageUrl(key: string) {
  return getSignedUrl(
    getStorageClient(),
    new GetObjectCommand({ Bucket: bucket, Key: key }),
    { expiresIn: 3600 }
  );
}
