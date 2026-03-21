<?php

declare(strict_types=1);

require __DIR__ . '/local-bootstrap.php';

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        local_json(405, ['error' => ['Method not allowed']]);
    }

    $payload = local_read_json();
    $admin = local_admin_load();
    $email = trim((string) ($payload['email'] ?? ''));
    $password = (string) ($payload['password'] ?? '');

    if ($email === '' || $password === '') {
        local_json(422, ['error' => ['Email dan password wajib diisi']]);
    }

    if (!hash_equals($admin['email'], $email) || !password_verify($password, $admin['password_hash'])) {
        local_json(401, ['error' => ['Email atau password admin lokal salah']]);
    }

    local_json(200, ['code' => 200, 'data' => ['token' => local_issue_token($admin)], 'error' => null]);
} catch (Throwable $error) {
    local_json(500, ['error' => [$error->getMessage()]]);
}
