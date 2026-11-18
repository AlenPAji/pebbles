import "server-only";

import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

function environmentValue(name: string) {
  const value = process.env[name]?.trim();
  return value?.replace(/^(['"])(.*)\1$/, "$2").trim();
}

const bucket = environmentValue("S3_BUCKET_NAME");

const storageConfig = {
  region: environmentValue("AWS_REGION"),
  endpoint: environmentValue("AWS_ENDPOINT_URL_S3"),
  credentials: {
    accessKeyId: environmentValue("AWS_ACCESS_KEY_ID") ?? "",
    secretAccessKey: environmentValue("AWS_SECRET_ACCESS_KEY") ?? ""
  },
  forcePathStyle: true
};

function getStorageClient() {
  const missingSettings = Object.entries({
    S3_BUCKET_NAME: bucket,
    AWS_REGION: storageConfig.region,
    AWS_ENDPOINT_URL_S3: storageConfig.endpoint,
    AWS_ACCESS_KEY_ID: storageConfig.credentials.accessKeyId,
    AWS_SECRET_ACCESS_KEY: storageConfig.credentials.secretAccessKey
  }).filter(([, value]) => !value).map(([name]) => name);
  if (missingSettings.length) {
    throw new Error(`Neon Object Storage configuration is missing: ${missingSettings.join(", ")}`);
  }

  try {
    new URL(storageConfig.endpoint ?? "");
  } catch {
    throw new Error("Neon Object Storage endpoint is not a valid URL");
  }

  return new S3Client(storageConfig);
}

function getBucket() {
  if (!bucket) throw new Error("Neon Object Storage configuration is missing: S3_BUCKET_NAME");
  return bucket;
}

function storageError(error: unknown) {
  if (!(error instanceof Error)) return new Error("Neon Object Storage request failed");
  if (error.message.startsWith("Neon Object Storage ")) return error;
  const details = error as Error & {
    code?: string;
    cause?: { code?: string; name?: string };
    $metadata?: { httpStatusCode?: number };
  };
  const code = details.code ?? details.cause?.code ?? (details.name !== "Error" ? details.name : details.cause?.name) ?? "unknown";
  const status = details.$metadata?.httpStatusCode;
  const endpointHost = storageConfig.endpoint ? new URL(storageConfig.endpoint).hostname : "unknown";
  return new Error(`Neon Object Storage request failed (${code}${status ? `, HTTP ${status}` : ""} at ${endpointHost})`);
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
