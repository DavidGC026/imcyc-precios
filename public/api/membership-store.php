<?php

/**
 * Registro local de órdenes de membresía (/precios):
 * estado del pedido, cliente, referencia Openpay y payload para consultas/webhook.
 *
 * Configuración: /var/www/sources/openpay/precios-mysql.env (ver precios-mysql.env.example)
 */

function membership_persistent_openpay_dir(): string {
    return '/var/www/sources/openpay';
}

function membership_mysql_env_paths(): array {
    $dir = membership_persistent_openpay_dir();
    return [
        $dir . '/precios-mysql.env',
        __DIR__ . '/precios-mysql.env',
    ];
}

function membership_webhook_env_paths(): array {
    $dir = membership_persistent_openpay_dir();
    return [
        $dir . '/precios-webhook.env',
        __DIR__ . '/precios-webhook.env',
    ];
}

function membership_load_env_file(string $path, string $prefix = 'MEMBERSHIP_DB_'): void {
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

        if ($key === '' || strpos($key, $prefix) !== 0) {
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
        membership_load_env_file($path, 'MEMBERSHIP_DB_');
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

    membership_ensure_schema($pdo);

    return $pdo;
}

function membership_ensure_schema(PDO $pdo): void {
    $pdo->exec('
        CREATE TABLE IF NOT EXISTS openpay_webhook_events (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            event_key VARCHAR(128) NOT NULL,
            event_type VARCHAR(64) NOT NULL,
            order_ref VARCHAR(64) DEFAULT NULL,
            payload TEXT DEFAULT NULL,
            created_at DATETIME NOT NULL,
            PRIMARY KEY (id),
            UNIQUE KEY uk_event_key (event_key),
            KEY idx_order_ref (order_ref)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ');
}

function openpay_webhook_credentials(): ?array {
    static $loaded = false;
    if (!$loaded) {
        foreach (membership_webhook_env_paths() as $path) {
            membership_load_env_file($path, 'OPENPAY_WEBHOOK_');
        }
        $loaded = true;
    }

    $user = trim((string) (getenv('OPENPAY_WEBHOOK_USER') ?: ''));
    $pass = (string) (getenv('OPENPAY_WEBHOOK_PASSWORD') ?: '');
    if ($user === '' || $pass === '') {
        return null;
    }

    return ['user' => $user, 'pass' => $pass];
}

function verify_openpay_webhook_auth(): bool {
    $creds = openpay_webhook_credentials();
    if ($creds === null) {
        return true;
    }

    $user = (string) ($_SERVER['PHP_AUTH_USER'] ?? '');
    $pass = (string) ($_SERVER['PHP_AUTH_PW'] ?? '');

    return hash_equals($creds['user'], $user) && hash_equals($creds['pass'], $pass);
}

/** Log de webhook /precios (verificación Openpay, diagnóstico, payloads). */
function openpay_precios_webhook_log_path(): string {
    return membership_persistent_openpay_dir() . '/precios-openpay-webhook.log';
}

function openpay_precios_webhook_request_header(string $name): string {
    $target = strtolower($name);
    if (function_exists('getallheaders')) {
        foreach (getallheaders() as $headerName => $headerValue) {
            if (strtolower((string) $headerName) === $target) {
                return trim((string) $headerValue);
            }
        }
    }
    $serverKey = 'HTTP_' . strtoupper(str_replace('-', '_', $name));
    $value = trim((string) ($_SERVER[$serverKey] ?? ''));
    if ($value !== '') {
        return $value;
    }
    if ($target === 'authorization') {
        return trim((string) ($_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? ''));
    }

    return '';
}

function openpay_precios_webhook_log_append(array $entry): void {
    $entry['app'] = 'imcyc-precios';
    $entry['at'] = $entry['at'] ?? date('c');

    $path = openpay_precios_webhook_log_path();
    $dir = dirname($path);
    if (!is_dir($dir)) {
        @mkdir($dir, 0750, true);
    }

    @file_put_contents(
        $path,
        json_encode($entry, JSON_UNESCAPED_UNICODE) . PHP_EOL,
        FILE_APPEND | LOCK_EX
    );
}

/**
 * Registra cada POST (incluye evento verification antes de validar auth).
 */
function openpay_precios_webhook_log_request(string $rawPayload, array $extra = []): void {
    $headers = [];
    foreach (['content-type', 'user-agent', 'signature-digest'] as $headerName) {
        $value = openpay_precios_webhook_request_header($headerName);
        if ($value !== '') {
            $headers[$headerName] = $value;
        }
    }

    $auth = openpay_precios_webhook_request_header('authorization');
    if ($auth !== '') {
        $headers['authorization'] = (stripos($auth, 'basic ') === 0) ? 'Basic [oculto]' : '[oculto]';
    }

    $event = json_decode($rawPayload, true);
    $eventType = is_array($event) ? (string) ($event['type'] ?? $event['event'] ?? '') : '';

    openpay_precios_webhook_log_append(array_merge([
        'kind' => 'request',
        'method' => $_SERVER['REQUEST_METHOD'] ?? '',
        'remote_addr' => $_SERVER['REMOTE_ADDR'] ?? '',
        'event_type' => $eventType,
        'headers' => $headers,
        'payload' => $rawPayload,
    ], $extra));
}

/**
 * Destaca el código que Openpay pide ingresar en el panel al verificar el webhook.
 */
function openpay_precios_webhook_log_verification(string $verificationCode, array $event, string $rawPayload): void {
    openpay_precios_webhook_log_append([
        'kind' => 'verification',
        'verification_code' => $verificationCode,
        'event_id' => $event['id'] ?? null,
        'event_date' => $event['event_date'] ?? null,
        'message' => $verificationCode !== ''
            ? 'Ingresa verification_code en el panel Openpay (Configuración → Webhooks)'
            : 'Evento verification sin verification_code',
        'payload' => $rawPayload,
    ]);
}

function openpay_precios_webhook_log_diag(array $data): void {
    openpay_precios_webhook_log_append(array_merge(['kind' => 'diagnostic'], $data));
}

function openpay_webhook_event_key(array $event, string $rawPayload): string {
    if (!empty($event['id'])) {
        return 'id:' . (string) $event['id'];
    }
    $type = (string) ($event['type'] ?? $event['event'] ?? 'unknown');
    return 'hash:' . hash('sha256', $type . '|' . $rawPayload);
}

function is_openpay_webhook_event_processed(string $eventKey): bool {
    $pdo = membership_pdo();
    $stmt = $pdo->prepare('SELECT 1 FROM openpay_webhook_events WHERE event_key = ? LIMIT 1');
    $stmt->execute([$eventKey]);
    return (bool) $stmt->fetchColumn();
}

function mark_openpay_webhook_event_processed(string $eventKey, string $eventType, ?string $orderRef, string $rawPayload): void {
    $pdo = membership_pdo();
    $stmt = $pdo->prepare('
        INSERT IGNORE INTO openpay_webhook_events (event_key, event_type, order_ref, payload, created_at)
        VALUES (?, ?, ?, ?, ?)
    ');
    $stmt->execute([
        $eventKey,
        $eventType,
        $orderRef,
        strlen($rawPayload) > 65535 ? substr($rawPayload, 0, 65535) : $rawPayload,
        date('Y-m-d H:i:s'),
    ]);
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

function update_membership_order_by_subscription_id(string $subscriptionId, string $status, ?string $providerStatus = null): int {
    $pdo = membership_pdo();
    $stmt = $pdo->prepare('
        UPDATE membership_orders
        SET status = ?, provider_status = COALESCE(?, provider_status), updated_at = ?
        WHERE openpay_subscription_id = ? OR order_id = ?
    ');
    $stmt->execute([$status, $providerStatus, date('Y-m-d H:i:s'), $subscriptionId, $subscriptionId]);
    return $stmt->rowCount();
}

function find_membership_order_by_charge_or_merchant(string $chargeId, ?string $merchantOrderId = null): ?array {
    $order = get_membership_order($chargeId);
    if ($order) {
        return $order;
    }
    if ($merchantOrderId !== null && $merchantOrderId !== '') {
        return get_membership_order($merchantOrderId);
    }
    return null;
}

/**
 * Sincroniza estado local tras 3D Secure o consulta de cargo (buena práctica Openpay).
 */
function sync_membership_order_from_openpay_charge(string $chargeId): ?array {
    require_once __DIR__ . '/openpay-client.php';

    $chargeId = trim($chargeId);
    if ($chargeId === '') {
        return null;
    }

    $charge = fetchOpenpayCharge($chargeId);
    $merchantOrderId = trim((string) ($charge['order_id'] ?? ''));
    $status = mapOpenpayStatusToPedidoStatus($charge['status'] ?? 'pending');
    $providerStatus = strtolower((string) ($charge['status'] ?? ''));

    $order = find_membership_order_by_charge_or_merchant($chargeId, $merchantOrderId ?: null);
    $localOrderId = $order['order_id'] ?? $chargeId;

    if ($order) {
        $payload = is_array($order['payment_payload'] ?? null) ? $order['payment_payload'] : [];
        $payload['openpay_charge'] = $charge;
        $payload['synced_at'] = date('c');

        save_membership_order([
            'order_id' => $localOrderId,
            'plan_key' => $order['plan_key'],
            'customer_name' => $order['customer_name'],
            'customer_email' => $order['customer_email'],
            'amount' => (float) ($charge['amount'] ?? $order['amount']),
            'payment_method' => $order['payment_method'],
            'billing_mode' => $order['billing_mode'],
            'status' => $status,
            'provider_status' => $providerStatus,
            'openpay_customer_id' => $order['openpay_customer_id'],
            'openpay_subscription_id' => $order['openpay_subscription_id'],
            'payment_payload' => $payload,
            'created_at' => $order['created_at'],
        ]);
    } else {
        $customer = $charge['customer'] ?? [];
        $metadata = $charge['metadata'] ?? [];
        if (!is_array($metadata)) {
            $metadata = [];
        }
        save_membership_order([
            'order_id' => $chargeId,
            'plan_key' => (string) ($metadata['plan_key'] ?? 'unknown'),
            'customer_name' => trim(((string) ($customer['name'] ?? '')) . ' ' . ((string) ($customer['last_name'] ?? ''))),
            'customer_email' => (string) ($customer['email'] ?? $metadata['customer_email'] ?? ''),
            'amount' => (float) ($charge['amount'] ?? 0),
            'payment_method' => 'card',
            'billing_mode' => (string) ($metadata['billing_mode'] ?? 'one_time'),
            'status' => $status,
            'provider_status' => $providerStatus,
            'payment_payload' => ['openpay_charge' => $charge, 'synced_at' => date('c')],
        ]);
        $localOrderId = $chargeId;
    }

    return get_membership_order($localOrderId);
}
