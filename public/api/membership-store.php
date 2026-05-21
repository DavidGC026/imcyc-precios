<?php

/**
 * Registro local de órdenes de membresía (/precios):
 * estado del pedido, cliente, referencia Openpay y payload para consultas/webhook.
 *
 * Configuración: /var/www/sources/openpay/precios-mysql.env (ver precios-mysql.env.example)
 */

function membership_mysql_env_paths(): array {
    $dir = '/var/www/sources/openpay';
    return [
        $dir . '/precios-mysql.env',
        __DIR__ . '/precios-mysql.env',
    ];
}

function membership_load_env_file(string $path): void {
    if (!file_exists($path) || !is_readable($path)) {
        return;
    }

    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    if ($lines === false) {
        return;
    }

    foreach ($lines as $line) {
        $line = trim($line);
        if ($line === '' || strpos($line, '#') === 0 || strpos($line, '=') === false) {
            continue;
        }

        [$key, $value] = explode('=', $line, 2);
        $key = trim($key);
        $value = trim($value);
        $value = trim($value, "\"'");

        if ($key === '' || strpos($key, 'MEMBERSHIP_DB_') !== 0) {
            continue;
        }

        $_ENV[$key] = $value;
        $_SERVER[$key] = $value;
        putenv($key . '=' . $value);
    }
}

function membership_db_config(): array {
    static $config = null;
    if ($config !== null) {
        return $config;
    }

    foreach (membership_mysql_env_paths() as $path) {
        membership_load_env_file($path);
    }

    $host = trim((string) (getenv('MEMBERSHIP_DB_HOST') ?: '127.0.0.1'));
    $name = trim((string) (getenv('MEMBERSHIP_DB_NAME') ?: ''));
    $user = trim((string) (getenv('MEMBERSHIP_DB_USER') ?: ''));
    $pass = (string) (getenv('MEMBERSHIP_DB_PASSWORD') ?: '');

    if ($name === '' || $user === '') {
        throw new RuntimeException(
            'Falta configuración MySQL de membresías. Cree /var/www/sources/openpay/precios-mysql.env '
            . '(ver precios-mysql.env.example).'
        );
    }

    $config = [
        'host' => $host,
        'name' => $name,
        'user' => $user,
        'pass' => $pass,
    ];

    return $config;
}

function membership_pdo(): PDO {
    static $pdo = null;
    if ($pdo instanceof PDO) {
        return $pdo;
    }

    $cfg = membership_db_config();
    $dsn = sprintf(
        'mysql:host=%s;dbname=%s;charset=utf8mb4',
        $cfg['host'],
        $cfg['name']
    );

    $pdo = new PDO($dsn, $cfg['user'], $cfg['pass'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);

    return $pdo;
}

function save_membership_order(array $row): void {
    $pdo = membership_pdo();
    $now = date('Y-m-d H:i:s');
    $stmt = $pdo->prepare('
        INSERT INTO membership_orders (
            order_id, plan_key, customer_name, customer_email, amount,
            payment_method, billing_mode, status, provider_status,
            openpay_customer_id, openpay_subscription_id, payment_payload,
            created_at, updated_at
        ) VALUES (
            :order_id, :plan_key, :customer_name, :customer_email, :amount,
            :payment_method, :billing_mode, :status, :provider_status,
            :openpay_customer_id, :openpay_subscription_id, :payment_payload,
            :created_at, :updated_at
        )
        ON DUPLICATE KEY UPDATE
            status = VALUES(status),
            provider_status = VALUES(provider_status),
            payment_payload = VALUES(payment_payload),
            updated_at = VALUES(updated_at)
    ');
    $stmt->execute([
        ':order_id' => $row['order_id'],
        ':plan_key' => $row['plan_key'],
        ':customer_name' => $row['customer_name'],
        ':customer_email' => $row['customer_email'],
        ':amount' => $row['amount'],
        ':payment_method' => $row['payment_method'],
        ':billing_mode' => $row['billing_mode'] ?? null,
        ':status' => $row['status'],
        ':provider_status' => $row['provider_status'] ?? null,
        ':openpay_customer_id' => $row['openpay_customer_id'] ?? null,
        ':openpay_subscription_id' => $row['openpay_subscription_id'] ?? null,
        ':payment_payload' => isset($row['payment_payload']) ? json_encode($row['payment_payload'], JSON_UNESCAPED_UNICODE) : null,
        ':created_at' => $row['created_at'] ?? $now,
        ':updated_at' => $now,
    ]);
}

function get_membership_order(string $orderId): ?array {
    $pdo = membership_pdo();
    $stmt = $pdo->prepare('SELECT * FROM membership_orders WHERE order_id = ? LIMIT 1');
    $stmt->execute([$orderId]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$row) {
        return null;
    }
    if (!empty($row['payment_payload'])) {
        $row['payment_payload'] = json_decode($row['payment_payload'], true);
    }
    return $row;
}

function list_cancellable_membership_subscriptions(string $email): array {
    $email = trim($email);
    if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        return [];
    }

    $pdo = membership_pdo();
    $stmt = $pdo->prepare('
        SELECT order_id, plan_key, customer_name, customer_email, amount, status,
               openpay_customer_id, openpay_subscription_id, created_at
        FROM membership_orders
        WHERE LOWER(customer_email) = LOWER(?)
          AND openpay_subscription_id IS NOT NULL
          AND TRIM(openpay_subscription_id) <> ""
          AND openpay_customer_id IS NOT NULL
          AND TRIM(openpay_customer_id) <> ""
          AND status NOT IN ("cancelado", "rechazado")
        ORDER BY created_at DESC
        LIMIT 20
    ');
    $stmt->execute([$email]);

    return $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
}

function find_membership_subscription_for_cancel(string $email, string $subscriptionRef): ?array {
    $email = trim($email);
    $subscriptionRef = trim($subscriptionRef);
    if ($email === '' || $subscriptionRef === '') {
        return null;
    }

    $pdo = membership_pdo();
    $stmt = $pdo->prepare('
        SELECT *
        FROM membership_orders
        WHERE LOWER(customer_email) = LOWER(?)
          AND (
            order_id = ?
            OR openpay_subscription_id = ?
          )
          AND openpay_subscription_id IS NOT NULL
          AND TRIM(openpay_subscription_id) <> ""
          AND openpay_customer_id IS NOT NULL
          AND TRIM(openpay_customer_id) <> ""
        LIMIT 1
    ');
    $stmt->execute([$email, $subscriptionRef, $subscriptionRef]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    return $row ?: null;
}

function update_membership_order_status(string $orderId, string $status, ?string $providerStatus = null): int {
    $pdo = membership_pdo();
    $stmt = $pdo->prepare('
        UPDATE membership_orders
        SET status = ?, provider_status = COALESCE(?, provider_status), updated_at = ?
        WHERE order_id = ?
    ');
    $stmt->execute([$status, $providerStatus, date('Y-m-d H:i:s'), $orderId]);
    return $stmt->rowCount();
}
