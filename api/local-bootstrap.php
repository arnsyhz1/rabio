<?php

declare(strict_types=1);

function local_json(int $status, array $payload): never
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function local_read_json(): array
{
    $raw = file_get_contents('php://input');
    if ($raw === false || $raw === '') {
        return [];
    }

    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : [];
}

function local_admin_path(): string
{
    return dirname(__DIR__) . '/data/local-admin.json';
}

function local_default_admin(): array
{
    return [
        'name' => 'Admin Lokal',
        'email' => 'admin@rabio.local',
        'password_hash' => '$2y$12$1cHmHydhNCyORolxdbpemuXMG3NAg.teIDe2Mt7yD3c1BiTgK7R62',
        'access_key' => 'RABIO-USER-LOCAL-KEY',
        'is_filter' => false,
        'can_reply' => true,
        'can_edit' => true,
        'can_delete' => true,
        'updated_at' => '2026-03-21T00:00:00+00:00',
    ];
}

function local_admin_load(): array
{
    $path = local_admin_path();
    if (!file_exists($path)) {
        local_admin_save(local_default_admin());
    }

    $raw = file_get_contents($path);
    $decoded = json_decode($raw ?: '', true);
    return is_array($decoded) ? $decoded : local_default_admin();
}

function local_admin_save(array $data): void
{
    $path = local_admin_path();
    $payload = array_merge(local_default_admin(), $data, [
        'updated_at' => gmdate(DATE_ATOM),
    ]);

    file_put_contents($path, json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
}

function local_admin_public(array $admin): array
{
    return [
        'name' => $admin['name'],
        'email' => $admin['email'],
        'access_key' => $admin['access_key'],
        'is_filter' => (bool) $admin['is_filter'],
        'can_reply' => (bool) $admin['can_reply'],
        'can_edit' => (bool) $admin['can_edit'],
        'can_delete' => (bool) $admin['can_delete'],
        'role' => 'admin',
    ];
}

function local_token_secret(): string
{
    return hash('sha256', __FILE__ . '|rabio-local-admin');
}

function local_base64url_encode(string $value): string
{
    return rtrim(strtr(base64_encode($value), '+/', '-_'), '=');
}

function local_base64url_decode(string $value): string
{
    $padding = strlen($value) % 4;
    if ($padding > 0) {
        $value .= str_repeat('=', 4 - $padding);
    }

    return (string) base64_decode(strtr($value, '-_', '+/'));
}

function local_issue_token(array $admin): string
{
    $header = local_base64url_encode(json_encode(['alg' => 'HS256', 'typ' => 'JWT']) ?: '{}');
    $payload = local_base64url_encode(json_encode([
        'sub' => $admin['email'],
        'name' => $admin['name'],
        'role' => 'admin',
        'exp' => time() + 86400,
    ]) ?: '{}');

    $signature = hash_hmac('sha256', $header . '.' . $payload, local_token_secret(), true);
    return $header . '.' . $payload . '.' . local_base64url_encode($signature);
}

function local_verify_token(?string $token): array
{
    if (!is_string($token) || substr_count($token, '.') !== 2) {
        throw new RuntimeException('Unauthorized');
    }

    [$header, $payload, $signature] = explode('.', $token);
    $expected = local_base64url_encode(hash_hmac('sha256', $header . '.' . $payload, local_token_secret(), true));
    if (!hash_equals($expected, $signature)) {
        throw new RuntimeException('Unauthorized');
    }

    $decoded = json_decode(local_base64url_decode($payload), true);
    if (!is_array($decoded) || (int) ($decoded['exp'] ?? 0) < time()) {
        throw new RuntimeException('Session expired');
    }

    return $decoded;
}

function local_authorization_token(): ?string
{
    $header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if (!is_string($header) || stripos($header, 'Bearer ') !== 0) {
        return null;
    }

    return trim(substr($header, 7));
}

function local_require_admin(): array
{
    $claims = local_verify_token(local_authorization_token());
    $admin = local_admin_load();
    if (($claims['sub'] ?? '') !== $admin['email']) {
        throw new RuntimeException('Unauthorized');
    }

    return $admin;
}

function local_require_access_key(): array
{
    $accessKey = $_SERVER['HTTP_X_ACCESS_KEY'] ?? '';
    $admin = local_admin_load();
    if (!is_string($accessKey) || $accessKey === '' || !hash_equals($admin['access_key'], $accessKey)) {
        throw new RuntimeException('Access key invalid');
    }

    return $admin;
}
