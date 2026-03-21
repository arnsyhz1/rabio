<?php

declare(strict_types=1);

require __DIR__ . '/local-bootstrap.php';

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
        local_json(405, ['error' => ['Method not allowed']]);
    }

    $admin = local_require_access_key();
    local_json(200, ['code' => 200, 'data' => [
        'name' => $admin['name'],
        'access_key' => $admin['access_key'],
        'is_filter' => (bool) $admin['is_filter'],
        'can_reply' => (bool) $admin['can_reply'],
        'can_edit' => (bool) $admin['can_edit'],
        'can_delete' => (bool) $admin['can_delete'],
    ], 'error' => null]);
} catch (Throwable $error) {
    local_json(401, ['error' => [$error->getMessage()]]);
}
