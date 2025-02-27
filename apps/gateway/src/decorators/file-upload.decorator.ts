import { UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { BadRequestException } from '@nestjs/common';

export const FileUpload = () => {
  return (
    target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) => {
    UseInterceptors(
      FileInterceptor('file', {
        fileFilter: (req, file, callback) => {
          const allowedMimeTypes = [
            'image/',
            'application/pdf',
            'video/',
            'audio/',
          ];

          const isAllowed = allowedMimeTypes.some((type) =>
            file.mimetype.startsWith(type),
          );

          if (!isAllowed) {
            return callback(
              new BadRequestException(
                'Invalid file type. Only image, pdf, video, and audio files are allowed.',
              ),
              false,
            );
          }

          callback(null, true);
        },
        limits: { fileSize: 5 * 1024 * 1024 },
      }),
    )(target, propertyKey, descriptor);
  };
};
