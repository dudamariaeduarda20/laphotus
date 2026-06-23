import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "eu-west-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

const BUCKET = process.env.AWS_S3_BUCKET || "laphotus-dev";

/**
 * Upload file to S3. In dev: use localstack or mock. In prod: real S3 bucket.
 * Returns: { key, fileSize, url }
 */
export async function uploadToS3(
  key: string,
  buffer: Buffer,
  contentType: string = "image/jpeg"
): Promise<{ key: string; fileSize: number; url: string }> {
  try {
    const cmd = new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      ACL: "private", // Require signed URL to access
    });

    await s3Client.send(cmd);

    // Generate signed URL (1 week validity for testing)
    const signedUrl = await getSignedUrl(
      s3Client,
      new GetObjectCommand({ Bucket: BUCKET, Key: key }),
      { expiresIn: 7 * 24 * 60 * 60 }
    );

    return {
      key,
      fileSize: buffer.length,
      url: signedUrl,
    };
  } catch (error) {
    console.error("S3 upload error:", error);
    throw new Error(
      `S3 upload failed: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Generate signed download URL for a key.
 * Used by /api/download/[photoId] after payment verification.
 */
export async function getS3SignedUrl(key: string, expiresIn = 3600) {
  try {
    return await getSignedUrl(
      s3Client,
      new GetObjectCommand({ Bucket: BUCKET, Key: key }),
      { expiresIn }
    );
  } catch (error) {
    console.error("S3 signed URL error:", error);
    throw error;
  }
}

/**
 * Mock S3 for dev (localstack or in-memory fallback).
 * Returns placeholder URL if AWS creds missing.
 */
export function isMockMode(): boolean {
  return !process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY;
}
