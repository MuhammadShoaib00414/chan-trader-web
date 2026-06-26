<?php

return [
    'enabled' => env('FCM_ENABLED', false),
    'project_id' => env('FCM_PROJECT_ID'),
    'credentials_path' => (function () {
        $path = env('FCM_CREDENTIALS_PATH');
        if (! $path) {
            return storage_path('app/firebase-credentials.json');
        }
        // Resolve relative paths from the project root so they work regardless of web server CWD
        if (! str_starts_with($path, '/') && ! preg_match('/^[a-zA-Z]:[\\/\\\\]/', $path)) {
            return base_path($path);
        }
        return $path;
    })(),
];
