import "server-only";

import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const bucket = process.env.S3_BUCKET_NAME;

const storageConfig = {
  region: process.env.AWS_REGION,
  endpoint: process.env.AWS_ENDPOINT_URL_S3,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? ""
  },
  forcePathStyle: true
};

function getStorageClient() {
  if (!getBucket() || !storageConfig.region || !storageConfig.endpoint || !storageConfig.credentials.accessKeyId || !storageConfig.credentials.secretAccessKey) {
    throw new Error("Neon Object Storage credentials are not configured");
  }

  return new S3Client(storageConfig);
}

function getBucket() {
  if (!bucket) throw new Error("Neon Object Storage bucket is not configured");
  return bucket;
}

function storageError(error: unknown) {
  if (!(error instanceof Error)) return new Error("Neon Object Storage request failed");
  const details = error as Error & { code?: string; name?: string };
  const endpointHost = storageConfig.endpoint ? new URL(storageConfig.endpoint).hostname : "unknown";
  return new Error(`Neon Object Storage request failed (${details.code ?? details.name ?? "unknown"} at ${endpointHost})`);
}

export async function uploadProductImage(key: string, body: Buffer, contentType: string) {
  try {
    await getStorageClient().send(new PutObjectCommand({
      Bucket: getBucket(),
      Key: key,
      Body: body,
      ContentType: contentType
    }));
  } catch (error) {
    throw storageError(error);
  }
}

export async function deleteProductImage(key: string) {
  await getStorageClient().send(new DeleteObjectCommand({ Bucket: getBucket(), Key: key }));
}

export async function getProductImageUrl(key: string) {
  return getSignedUrl(
    getStorageClient(),
    new GetObjectCommand({ Bucket: getBucket(), Key: key }),
    { expiresIn: 3600 }
  );
}
