import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

let s3Client: S3Client | null = null;

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing environment variable: ${name}`);
  return v;
}

function getS3Client(): S3Client {
  if (s3Client) return s3Client;

  const region = requireEnv("AWS_REGION");

  // For local/dev, you can provide explicit creds via env vars.
  // In production (ECS/EC2/Lambda), you may omit creds and rely on IAM roles.
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

  s3Client = new S3Client({
    region,
    ...(accessKeyId && secretAccessKey
      ? { credentials: { accessKeyId, secretAccessKey } }
      : {}),
  });

  return s3Client;
}

export type CreatePresignedPutUrlInput = {
  key: string;
  contentType?: string;
  expiresInSeconds?: number;
};

export async function createPresignedPutUrl(input: CreatePresignedPutUrlInput) {
  const bucket = requireEnv("AWS_S3_BUCKET");
  const client = getS3Client();

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: input.key,
    ContentType: input.contentType ?? "application/octet-stream",
  });

  const url = await getSignedUrl(client, command, {
    expiresIn: input.expiresInSeconds ?? 900,
  });

  return { url, bucket, key: input.key };
}

export type UploadBufferToS3Input = {
  key: string;
  body: Buffer | Uint8Array;
  contentType?: string;
};

export async function uploadBufferToS3(input: UploadBufferToS3Input) {
  const bucket = requireEnv("AWS_S3_BUCKET");
  const client = getS3Client();

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: input.key,
    Body: input.body,
    ContentType: input.contentType,
  });

  const res = await client.send(command);
  return { bucket, key: input.key, etag: res.ETag };
}

