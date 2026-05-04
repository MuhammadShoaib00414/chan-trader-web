<?php

namespace App\Support;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;

class ResizedImageStore
{
    /**
     * Resize an uploaded raster image to an exact cover frame and store it.
     */
    public static function store(
        UploadedFile $file,
        string $directory,
        string $disk = 'public',
        int $targetWidth = 400,
        int $targetHeight = 264,
    ): string {
        $mime = strtolower((string) $file->getMimeType());
        $extension = self::extensionForMime($mime);
        $sourcePath = $file->getRealPath();

        if (! $sourcePath) {
            throw new RuntimeException('Unable to read the uploaded image.');
        }

        $binary = file_get_contents($sourcePath);
        if ($binary === false) {
            throw new RuntimeException('Unable to read the uploaded image.');
        }

        $dimensions = getimagesize($sourcePath);
        if ($dimensions === false) {
            throw new RuntimeException('Unable to determine the uploaded image dimensions.');
        }

        [$sourceWidth, $sourceHeight] = $dimensions;
        $sourceImage = imagecreatefromstring($binary);

        if (! $sourceImage) {
            throw new RuntimeException('Unable to process the uploaded image.');
        }

        $canvas = imagecreatetruecolor($targetWidth, $targetHeight);

        if (in_array($mime, ['image/png', 'image/webp', 'image/gif'], true)) {
            imagealphablending($canvas, false);
            imagesavealpha($canvas, true);
            $transparent = imagecolorallocatealpha($canvas, 0, 0, 0, 127);
            imagefilledrectangle($canvas, 0, 0, $targetWidth, $targetHeight, $transparent);
        } else {
            $background = imagecolorallocate($canvas, 255, 255, 255);
            imagefilledrectangle($canvas, 0, 0, $targetWidth, $targetHeight, $background);
        }

        $scale = max($targetWidth / $sourceWidth, $targetHeight / $sourceHeight);
        $resizedWidth = (int) ceil($sourceWidth * $scale);
        $resizedHeight = (int) ceil($sourceHeight * $scale);
        $offsetX = (int) floor(($targetWidth - $resizedWidth) / 2);
        $offsetY = (int) floor(($targetHeight - $resizedHeight) / 2);

        imagecopyresampled(
            $canvas,
            $sourceImage,
            $offsetX,
            $offsetY,
            0,
            0,
            $resizedWidth,
            $resizedHeight,
            $sourceWidth,
            $sourceHeight,
        );

        $path = trim($directory, '/').'/'.Str::uuid().'.'.$extension;

        ob_start();

        $stored = match ($mime) {
            'image/jpeg', 'image/jpg' => imagejpeg($canvas, null, 85),
            'image/png' => imagepng($canvas, null, 6),
            'image/webp' => imagewebp($canvas, null, 85),
            'image/gif' => imagegif($canvas),
            default => false,
        };

        $encoded = ob_get_clean();

        imagedestroy($sourceImage);
        imagedestroy($canvas);

        if (! $stored || $encoded === false) {
            throw new RuntimeException('Unable to encode the uploaded image.');
        }

        Storage::disk($disk)->put($path, $encoded);

        return $path;
    }

    public static function publicUrl(string $path): string
    {
        return '/storage/'.ltrim($path, '/');
    }

    public static function deletePublicPath(?string $path, string $disk = 'public'): void
    {
        if (! $path) {
            return;
        }

        $relativePath = str_starts_with($path, '/storage/')
            ? substr($path, strlen('/storage/'))
            : ltrim($path, '/');

        if ($relativePath !== '') {
            Storage::disk($disk)->delete($relativePath);
        }
    }

    private static function extensionForMime(string $mime): string
    {
        return match ($mime) {
            'image/jpeg', 'image/jpg' => 'jpg',
            'image/png' => 'png',
            'image/webp' => 'webp',
            'image/gif' => 'gif',
            default => throw new RuntimeException("Unsupported image type [{$mime}]."),
        };
    }
}
