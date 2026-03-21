<?php

declare(strict_types=1);

require __DIR__ . '/local-bootstrap.php';

try {
    $admin = local_require_admin();

    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        local_json(200, ['code' => 200, 'data' => local_admin_public($admin), 'error' => null]);
    }

    if ($_SERVER['REQUEST_METHOD'] === 'PATCH') {
        $payload = local_read_json();
        $updated = $admin;

        if (array_key_exists('name', $payload)) {
            $name = trim((string) $payload['name']);
            if ($name !== '') {
                $updated['name'] = $name;
            }
        }

        if (array_key_exists('filter', $payload)) {
            $updated['is_filter'] = (bool) $payload['filter'];
        }

        foreach (['can_reply', 'can_edit', 'can_delete'] as $field) {
            if (array_key_exists($field, $payload)) {
                $updated[$field] = (bool) $payload[$field];
            }
        }

        if (array_key_exists('old_password', $payload) || array_key_exists('new_password', $payload)) {
            $oldPassword = (string) ($payload['old_password'] ?? '');
            $newPassword = (string) ($payload['new_password'] ?? '');
            if (!password_verify($oldPassword, $admin['password_hash'])) {
                local_json(422, ['code' => 422, 'data' => ['status' => false], 'error' => ['Password lama tidak cocok']]);
            }

            if (strlen($newPassword) < 8) {
                local_json(422, ['code' => 422, 'data' => ['status' => false], 'error' => ['Password baru minimal 8 karakter']]);
            }

            $updated['password_hash'] = password_hash($newPassword, PASSWORD_DEFAULT);
        }

        local_admin_save($updated);
        local_json(200, ['code' => 200, 'data' => ['status' => true], 'error' => null]);
    }

    local_json(405, ['error' => ['Method not allowed']]);
} catch (Throwable $error) {
    local_json(401, ['error' => [$error->getMessage()]]);
}
