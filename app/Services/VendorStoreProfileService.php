<?php

namespace App\Services;

use App\Models\Store;
use App\Support\ResizedImageStore;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;

class VendorStoreProfileService
{
    public function resolveOwnedStore(int $userId): ?Store
    {
        return Store::query()
            ->where('owner_id', $userId)
            ->orderBy('id')
            ->first();
    }

    /**
     * @return array<string, mixed>
     */
    public function syncImages(Request $request, Store $store): array
    {
        $updates = [];

        if ($request->boolean('remove_logo') && $store->logo) {
            ResizedImageStore::deletePublicPath($store->logo);
            $updates['logo'] = null;
        }

        if ($request->boolean('remove_banner') && $store->banner) {
            ResizedImageStore::deletePublicPath($store->banner);
            $updates['banner'] = null;
        }

        if ($request->hasFile('logo')) {
            if ($store->logo) {
                ResizedImageStore::deletePublicPath($store->logo);
            }
            $updates['logo'] = $this->storeImage($request->file('logo'), $store, 'logo');
        }

        if ($request->hasFile('banner')) {
            if ($store->banner) {
                ResizedImageStore::deletePublicPath($store->banner);
            }
            $updates['banner'] = $this->storeImage($request->file('banner'), $store, 'banner');
        }

        if ($updates !== []) {
            $store->update($updates);
        }

        return [
            'id' => $store->id,
            'name' => $store->name,
            'logo' => $store->fresh()->logo,
            'banner' => $store->fresh()->banner,
        ];
    }

    private function storeImage(UploadedFile $file, Store $store, string $type): string
    {
        [$width, $height] = $type === 'logo' ? [400, 400] : [1200, 400];
        $path = ResizedImageStore::store(
            $file,
            "stores/{$store->id}/{$type}",
            'public',
            $width,
            $height,
        );

        return ResizedImageStore::publicUrl($path);
    }
}
