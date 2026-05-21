<?php

return [
    'enabled' => env('FCM_ENABLED', false),
    'project_id' => env('FCM_PROJECT_ID'),
    'credentials_path' => env('FCM_CREDENTIALS_PATH', storage_path('app/firebase-credentials.json')),
];
