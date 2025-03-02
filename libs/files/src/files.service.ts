import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  CreateBucketCommand,
  HeadBucketCommand,
  PutBucketPolicyCommand,
} from '@aws-sdk/client-s3';

@Injectable()
export class FilesService {
  private s3: S3Client;
  private bucketName: string;

  constructor(private readonly configService: ConfigService) {
    this.initializeClient();
    this.initializeBucket().catch((err) =>
      console.log('Bucket initialization failed', err),
    );
  }

  private initializeClient() {
    const useSSL = this.configService.get('MINIO_USE_SSL') === 'true';
    const endpoint = `${useSSL ? 'https://' : 'http://'}${this.configService.get('MINIO_ENDPOINT')}:${this.configService.get('MINIO_PORT')}`;

    this.s3 = new S3Client({
      region: 'us-east-1',
      endpoint: endpoint,
      credentials: {
        accessKeyId: this.configService.get('MINIO_ACCESS_KEY'),
        secretAccessKey: this.configService.get('MINIO_SECRET_KEY'),
      },
      forcePathStyle: true,
    });

    this.bucketName = this.configService.get('MINIO_BUCKET_NAME');
  }

  async initializeBucket() {
    try {
      await this.createBucketIfNotExists();
      console.log('Bucket initialization completed');
    } catch (error) {
      console.error('Bucket initialization failed', error.stack);
      throw error;
    }
  }

  async createBucketIfNotExists() {
    try {
      await this.s3.send(new HeadBucketCommand({ Bucket: this.bucketName }));
    } catch (error) {
      if (error.name === 'NotFound') {
        await this.s3.send(
          new CreateBucketCommand({
            Bucket: this.bucketName,
            ObjectLockEnabledForBucket: false,
          }),
        );
        await this.setBucketPolicy();
      } else {
        throw error;
      }
    }
  }

  private async setBucketPolicy() {
    const policy = {
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Principal: '*',
          Action: [
            's3:ListBucket',
            's3:HeadBucket',
            's3:CreateBucket',
            's3:PutObject',
            's3:GetObject',
            's3:DeleteObject',
          ],
          Resource: [
            `arn:aws:s3:::${this.bucketName}/*`,
            `arn:aws:s3:::${this.bucketName}`,
          ],
        },
      ],
    };

    await this.s3.send(
      new PutBucketPolicyCommand({
        Bucket: this.bucketName,
        Policy: JSON.stringify(policy),
      }),
    );
  }

  async uploadFile(file: Express.Multer.File): Promise<string> {
    await this.createBucketIfNotExists();

    const metadata = {
      originalname: file.originalname,
      uploadTime: new Date().toISOString(),
    };

    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucketName,
        Key: file.originalname,
        Body: file.buffer,
        ContentType: file.mimetype,
        ACL: 'public-read',
        Metadata: metadata,
      }),
    );

    return file.originalname;
  }

  async getFileUrl(key: string): Promise<string> {
    const useSSL = this.configService.get('MINIO_USE_SSL') === 'true';
    const protocol = useSSL ? 'https' : 'http';
    const endpoint = this.configService.get('MINIO_ENDPOINT');
    const port = this.configService.get('MINIO_PORT');
    return `${protocol}://${endpoint}:${port}/${this.bucketName}/${key}`;
  }

  async deleteFile(key: string): Promise<void> {
    await this.s3.send(
      new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      }),
    );
  }
}
