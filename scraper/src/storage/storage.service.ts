import { S3, PutObjectCommand } from "@aws-sdk/client-s3";

const bucket = "rag-knowledge-assets-development";
const region = "us-east-1";

export async function uploadScrapedImage(buffer: Buffer, key: string) {
  const contentType = "image/png";

  if (!buffer || !buffer.length) {
    throw new Error("Invalid buffer received");
  }

  const s3 = new S3({
    region,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  });

  await s3.send(command);

  return {
    bucket,
    key,
  };
}
