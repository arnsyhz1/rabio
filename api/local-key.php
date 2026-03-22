<?php

declare(strict_types=1);

require __DIR__ . '/local-bootstrap.php';

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
        local_json(405, ['error' => ['Method not allowed']]);
    }

    $admin = local_require_admin();
    $admin['access_key'] = 'RABIO-' . strtoupper(bin2hex(random_bytes(8)));
    local_admin_save($admin);

    local_json(200, ['code' => 200, 'data' => ['status' => true], 'error' => null]);
} catch (Throwable $error) {
    local_json(401, ['error' => [$error->getMessage()]]);
}
