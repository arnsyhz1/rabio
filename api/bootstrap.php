<?php

declare(strict_types=1);

function profile_json(int $status, array $payload): never
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function profile_config(): array
{
    $configPath = __DIR__ . '/config.php';
    if (file_exists($configPath)) {
        $config = require $configPath;
        if (is_array($config)) {
            return $config;
        }
    }

    return [
        'host' => getenv('RABIO_DB_HOST') ?: '127.0.0.1',
        'port' => (int) (getenv('RABIO_DB_PORT') ?: 3306),
        'database' => getenv('RABIO_DB_NAME') ?: '',
        'username' => getenv('RABIO_DB_USER') ?: '',
        'password' => getenv('RABIO_DB_PASS') ?: '',
        'charset' => getenv('RABIO_DB_CHARSET') ?: 'utf8mb4',
    ];
}

function profile_pdo(): PDO
{
    $config = profile_config();
    if ($config['database'] === '' || $config['username'] === '') {
        throw new RuntimeException('Database configuration is missing. Copy api/config.example.php to api/config.php or set RABIO_DB_* env vars.');
    }

    $dsn = sprintf(
        'mysql:host=%s;port=%d;dbname=%s;charset=%s',
        $config['host'],
        $config['port'],
        $config['database'],
        $config['charset']
    );

    return new PDO($dsn, $config['username'], $config['password'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
}

function profile_read_json(): array
{
    $raw = file_get_contents('php://input');
    if ($raw === false || $raw === '') {
        return [];
    }

    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : [];
}
