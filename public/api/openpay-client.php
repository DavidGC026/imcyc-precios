<?php
/**
 * Cliente HTTP Openpay (cargos, consulta).
 *
 * URLs de la API (REST v1):
 * - Pruebas (sandbox): https://sandbox-api.openpay.mx/v1 — panel https://sandbox-dashboard.openpay.mx/
 * - Producción (live): https://api.openpay.mx/v1 — panel https://dashboard.openpay.mx/
 *
 * Origen de la configuración (en este orden):
 * 1) /var/www/sources/openpay/config.php o keys.php en el servidor
 * 2) Variables de entorno (ver array por defecto en getOpenpayConfig)
 *
 * Modo producción: production => true en config.php y/o OPENPAY_PRODUCTION=1 (tras cargar .env).
 * Las llaves live deben ir en production_merchant_id / production_private_key / production_public_key,
 * en variables OPENPAY_PRODUCTION_* o OPENPAY_MERCHANT_ID + OPENPAY_PRIVATE_KEY + OPENPAY_PUBLIC_KEY
 * (pool PHP / .env). Por defecto NO se usan merchant_id/private_key/public_key del archivo en producción
 * (evita mandar llaves sandbox a api.openpay.mx). Para forzar uso de los tres campos principales del
 * archivo en modo producción: OPENPAY_ALLOW_PRIMARY_FOR_PRODUCTION=1 o live_keys_in_primary_slot=true.
 *
 * Archivo opcional (mismo directorio que config.php): /var/www/sources/openpay/.env
 *
 * Sandbox solo en /precios (no afecta TiendaImcyc):
 * - Crear public/api/precios-sandbox.enabled en el servidor, o
 * - IMCYC_PRECIOS_OPENPAY_SANDBOX=1 en Apache/PHP-FPM
 * - Opcional: public/api/precios-openpay.env con llaves sandbox (ver precios-openpay.env.example)
 */

function imcyc_precios_openpay_persistent_dir(): string {
    return '/var/www/sources/openpay';
}

function imcyc_precios_openpay_sandbox_flag_paths(): array {
    $dir = imcyc_precios_openpay_persistent_dir();
    return [
        $dir . '/precios-sandbox.enabled',
        __DIR__ . '/precios-sandbox.enabled',
    ];
}

function imcyc_precios_openpay_sandbox_env_paths(): array {
    $dir = imcyc_precios_openpay_persistent_dir();
    return [
        $dir . '/precios-openpay.env',
        __DIR__ . '/precios-openpay.env',
    ];
}

function imcyc_precios_openpay_sandbox_requested(): bool {
    if (filter_var(getenv('IMCYC_PRECIOS_OPENPAY_SANDBOX') ?: false, FILTER_VALIDATE_BOOLEAN)) {
        return true;
    }
    foreach (imcyc_precios_openpay_sandbox_flag_paths() as $path) {
        if (file_exists($path)) {
            return true;
        }
    }
    return false;
}

function imcyc_precios_openpay_apply_sandbox_override(): void {
    if (!imcyc_precios_openpay_sandbox_requested()) {
        return;
    }
    putenv('OPENPAY_PRODUCTION=0');
    $_ENV['OPENPAY_PRODUCTION'] = '0';
    $_SERVER['OPENPAY_PRODUCTION'] = '0';
    foreach (imcyc_precios_openpay_sandbox_env_paths() as $path) {
        openpayLoadEnvFile($path);
    }
}

function openpayLoadEnvFile($path) {
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

        if ($key === '' || strpos($key, 'OPENPAY') !== 0) {
            continue;
        }

        $_ENV[$key] = $value;
        $_SERVER[$key] = $value;
        putenv($key . '=' . $value);
    }
}

/**
 * Aplica variables de entorno (pool Apache / PHP-FPM o .env) sobre el array devuelto por config.php.
 *
 * @param array $raw
 * @return array
 */
function openpayMergeEnvIntoRawConfig(array $raw) {
    $envProduction = getenv('OPENPAY_PRODUCTION');
    if ($envProduction !== false && trim((string) $envProduction) !== '') {
        $raw['production'] = filter_var($envProduction, FILTER_VALIDATE_BOOLEAN);
    }

    $stringKeys = [
        'OPENPAY_PRODUCTION_MERCHANT_ID' => 'production_merchant_id',
        'OPENPAY_PRODUCTION_PRIVATE_KEY' => 'production_private_key',
        'OPENPAY_PRODUCTION_PUBLIC_KEY' => 'production_public_key',
        'OPENPAY_PRODUCTION_BASE_URL' => 'production_base_url',
    ];

    foreach ($stringKeys as $envKey => $configKey) {
        $v = getenv($envKey);
        if ($v !== false && trim((string) $v) !== '') {
            $raw[$configKey] = trim((string) $v);
        }
    }

    return $raw;
}

/**
 * @param string|null ...$vals
 * @return string|null
 */
function openpayFirstNonEmptyString(...$vals) {
    foreach ($vals as $v) {
        if ($v === null || $v === false) {
            continue;
        }
        $s = trim((string) $v);
        if ($s !== '') {
            return $s;
        }
    }
    return null;
}

/**
 * Fuerza llaves sandbox de precios-openpay.env (después del .env global de Openpay).
 */
function imcyc_precios_openpay_forced_sandbox_config(array $rawConfig): array {
    imcyc_precios_openpay_apply_sandbox_override();

    $merchantId = openpayFirstNonEmptyString(
        getenv('OPENPAY_MERCHANT_ID') ?: null,
        $rawConfig['merchant_id'] ?? null,
        $rawConfig['merchantId'] ?? null,
        $rawConfig['id'] ?? null
    );
    $privateKey = openpayFirstNonEmptyString(
        getenv('OPENPAY_PRIVATE_KEY') ?: null,
        $rawConfig['private_key'] ?? null,
        $rawConfig['privateKey'] ?? null,
        $rawConfig['api_key'] ?? null,
        $rawConfig['secret_key'] ?? null
    );
    $publicKey = openpayFirstNonEmptyString(
        getenv('OPENPAY_PUBLIC_KEY') ?: null,
        $rawConfig['public_key'] ?? null,
        $rawConfig['publicKey'] ?? null
    );

    if (empty($merchantId) || empty($privateKey) || empty($publicKey)) {
        throw new Exception(
            'Sandbox /precios: faltan OPENPAY_MERCHANT_ID, OPENPAY_PRIVATE_KEY u OPENPAY_PUBLIC_KEY '
            . 'en /var/www/sources/openpay/precios-openpay.env'
        );
    }

    $explicitBase = isset($rawConfig['base_url']) ? trim((string) $rawConfig['base_url']) : '';
    $baseUrl = ($explicitBase !== '' && stripos($explicitBase, 'sandbox') !== false)
        ? $explicitBase
        : 'https://sandbox-api.openpay.mx/v1';

    return [
        'merchant_id' => $merchantId,
        'private_key' => $privateKey,
        'public_key' => $publicKey,
        'sandbox' => true,
        'base_url' => rtrim($baseUrl, '/'),
    ];
}

function getOpenpayConfig() {
    $openpayDir = '/var/www/sources/openpay';
    $configPath = $openpayDir . '/config.php';
    $keysPath = $openpayDir . '/keys.php';

    openpayLoadEnvFile($openpayDir . '/.env');

    $rawConfig = null;
    if (file_exists($configPath)) {
        $rawConfig = require $configPath;
    } elseif (file_exists($keysPath)) {
        $rawConfig = require $keysPath;
    }

    if ($rawConfig === null) {
        $rawConfig = [
            'merchant_id' => getenv('OPENPAY_MERCHANT_ID') ?: null,
            'private_key' => getenv('OPENPAY_PRIVATE_KEY') ?: null,
            'public_key' => getenv('OPENPAY_PUBLIC_KEY') ?: null,
            'production' => filter_var(getenv('OPENPAY_PRODUCTION') ?: false, FILTER_VALIDATE_BOOLEAN),
            'production_merchant_id' => getenv('OPENPAY_PRODUCTION_MERCHANT_ID') ?: null,
            'production_private_key' => getenv('OPENPAY_PRODUCTION_PRIVATE_KEY') ?: null,
            'production_public_key' => getenv('OPENPAY_PRODUCTION_PUBLIC_KEY') ?: null,
            'production_base_url' => getenv('OPENPAY_PRODUCTION_BASE_URL') ?: null,
        ];
    }

    if (is_string($rawConfig)) {
        $rawConfig = [
            'private_key' => trim($rawConfig),
            'merchant_id' => getenv('OPENPAY_MERCHANT_ID') ?: null,
        ];
    }

    if (!is_array($rawConfig)) {
        throw new Exception('Formato de configuración de Openpay no soportado');
    }

    $rawConfig = openpayMergeEnvIntoRawConfig($rawConfig);

    if (imcyc_precios_openpay_sandbox_requested()) {
        return imcyc_precios_openpay_forced_sandbox_config($rawConfig);
    }

    $isProduction = (bool) ($rawConfig['production'] ?? false);
    if (isset($rawConfig['sandbox'])) {
        $isProduction = !((bool) $rawConfig['sandbox']);
    }

    $allowPrimaryForProd = filter_var(getenv('OPENPAY_ALLOW_PRIMARY_FOR_PRODUCTION') ?: false, FILTER_VALIDATE_BOOLEAN)
        || (bool) ($rawConfig['live_keys_in_primary_slot'] ?? false);

    if ($isProduction) {
        $merchantId = openpayFirstNonEmptyString(
            $rawConfig['production_merchant_id'] ?? null,
            $rawConfig['productionMerchantId'] ?? null,
            getenv('OPENPAY_PRODUCTION_MERCHANT_ID') ?: null,
            getenv('OPENPAY_MERCHANT_ID') ?: null
        );
        $privateKey = openpayFirstNonEmptyString(
            $rawConfig['production_private_key'] ?? null,
            $rawConfig['productionPrivateKey'] ?? null,
            getenv('OPENPAY_PRODUCTION_PRIVATE_KEY') ?: null,
            getenv('OPENPAY_PRIVATE_KEY') ?: null
        );
        $publicKey = openpayFirstNonEmptyString(
            $rawConfig['production_public_key'] ?? null,
            $rawConfig['productionPublicKey'] ?? null,
            getenv('OPENPAY_PRODUCTION_PUBLIC_KEY') ?: null,
            getenv('OPENPAY_PUBLIC_KEY') ?: null
        );

        if ($allowPrimaryForProd) {
            $merchantId = openpayFirstNonEmptyString(
                $merchantId,
                $rawConfig['merchant_id'] ?? null,
                $rawConfig['merchantId'] ?? null,
                $rawConfig['id'] ?? null
            );
            $privateKey = openpayFirstNonEmptyString(
                $privateKey,
                $rawConfig['private_key'] ?? null,
                $rawConfig['privateKey'] ?? null,
                $rawConfig['api_key'] ?? null,
                $rawConfig['secret_key'] ?? null
            );
            $publicKey = openpayFirstNonEmptyString(
                $publicKey,
                $rawConfig['public_key'] ?? null,
                $rawConfig['publicKey'] ?? null
            );
        }
    } else {
        $merchantId = openpayFirstNonEmptyString(
            $rawConfig['merchant_id'] ?? null,
            $rawConfig['merchantId'] ?? null,
            $rawConfig['id'] ?? null,
            getenv('OPENPAY_MERCHANT_ID') ?: null
        );
        $privateKey = openpayFirstNonEmptyString(
            $rawConfig['private_key'] ?? null,
            $rawConfig['privateKey'] ?? null,
            $rawConfig['api_key'] ?? null,
            $rawConfig['secret_key'] ?? null,
            getenv('OPENPAY_PRIVATE_KEY') ?: null
        );
        $publicKey = openpayFirstNonEmptyString(
            $rawConfig['public_key'] ?? null,
            $rawConfig['publicKey'] ?? null,
            getenv('OPENPAY_PUBLIC_KEY') ?: null
        );
    }

    if (empty($merchantId) || empty($privateKey)) {
        if ($isProduction) {
            throw new Exception(
                'Openpay en producción: faltan credenciales live. Rellene production_merchant_id, '
                . 'production_private_key y production_public_key en '
                . $openpayDir . '/config.php (o keys.php), '
                . 'o defina OPENPAY_PRODUCTION_MERCHANT_ID / OPENPAY_PRODUCTION_PRIVATE_KEY / OPENPAY_PRODUCTION_PUBLIC_KEY '
                . '(o OPENPAY_MERCHANT_ID / OPENPAY_PRIVATE_KEY / OPENPAY_PUBLIC_KEY en el pool PHP o en '
                . $openpayDir . '/.env). Si las llaves live están solo en merchant_id/private_key/public_key del archivo, '
                . 'active OPENPAY_ALLOW_PRIMARY_FOR_PRODUCTION=1 o live_keys_in_primary_slot en config (riesgo si siguen siendo sandbox).'
            );
        }
        throw new Exception('La configuración de Openpay requiere merchant_id y private_key');
    }

    $defaultSandbox = 'https://sandbox-api.openpay.mx/v1';
    $defaultProd = 'https://api.openpay.mx/v1';

    $explicitBase = isset($rawConfig['base_url']) ? trim((string) $rawConfig['base_url']) : '';
    $explicitProdBase = trim((string) ($rawConfig['production_base_url'] ?? ''));

    if ($isProduction) {
        if ($explicitProdBase !== '') {
            $baseUrl = $explicitProdBase;
        } elseif ($explicitBase !== '' && stripos($explicitBase, 'sandbox') === false) {
            $baseUrl = $explicitBase;
        } else {
            $envPb = trim((string) (getenv('OPENPAY_PRODUCTION_BASE_URL') ?: ''));
            $baseUrl = $envPb !== '' ? $envPb : $defaultProd;
        }
    } else {
        $baseUrl = $explicitBase !== '' ? $explicitBase : $defaultSandbox;
    }

    return [
        'merchant_id' => $merchantId,
        'private_key' => $privateKey,
        'public_key' => $publicKey ? $publicKey : null,
        'sandbox' => !$isProduction,
        'base_url' => rtrim($baseUrl, '/'),
    ];
}

function getOpenpayPublicConfig() {
    $config = getOpenpayConfig();

    if (empty($config['public_key'])) {
        throw new Exception('La configuración de Openpay requiere public_key para pagos con tarjeta');
    }

    return [
        'merchant_id' => $config['merchant_id'],
        'public_key' => $config['public_key'],
        'sandbox' => $config['sandbox'],
    ];
}

function createOpenpayCharge(array $chargeData) {
    if (!function_exists('curl_init')) {
        throw new Exception('La extensión cURL de PHP es requerida para conectar con Openpay');
    }

    $config = getOpenpayConfig();
    $url = $config['base_url'] . '/' . rawurlencode($config['merchant_id']) . '/charges';
    $payload = json_encode($chargeData);

    if ($payload === false) {
        throw new Exception('No se pudo preparar la solicitud para Openpay');
    }

    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => $payload,
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'Accept: application/json',
        ],
        CURLOPT_USERPWD => $config['private_key'] . ':',
        CURLOPT_HTTPAUTH => CURLAUTH_BASIC,
        CURLOPT_TIMEOUT => 45,
    ]);

    $response = curl_exec($ch);
    $curlError = curl_error($ch);
    $httpCode = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($response === false) {
        throw new Exception('Error al conectar con Openpay: ' . $curlError);
    }

    $decoded = json_decode($response, true);
    if (!is_array($decoded)) {
        throw new Exception('Openpay devolvió una respuesta inválida');
    }

    if ($httpCode < 200 || $httpCode >= 300) {
        $message = $decoded['description']
            ?? $decoded['message']
            ?? $decoded['error_message']
            ?? 'Error al crear el cargo en Openpay';
        throw new Exception($message);
    }

    return $decoded;
}

/**
 * Mapea el status de un cargo Openpay al valor guardado en pedidos.status
 */
function mapOpenpayStatusToPedidoStatus($status) {
    $s = strtolower((string)$status);
    if (in_array($s, ['completed', 'succeeded', 'paid'], true)) {
        return 'aprobado';
    }
    if (in_array($s, ['failed', 'cancelled', 'canceled', 'rejected'], true)) {
        return 'rechazado';
    }
    return 'pendiente';
}

/**
 * Obtiene un cargo por ID (consulta final tras 3D Secure u otros flujos).
 */
function fetchOpenpayCharge($chargeId) {
    if (!function_exists('curl_init')) {
        throw new Exception('La extensión cURL de PHP es requerida para conectar con Openpay');
    }

    $chargeId = trim((string)$chargeId);
    if ($chargeId === '' || strlen($chargeId) > 80 || !preg_match('/^[a-z0-9_\\-]+$/i', $chargeId)) {
        throw new Exception('ID de cargo inválido');
    }

    $config = getOpenpayConfig();
    $url = $config['base_url'] . '/' . rawurlencode($config['merchant_id']) . '/charges/' . rawurlencode($chargeId);

    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => ['Accept: application/json'],
        CURLOPT_USERPWD => $config['private_key'] . ':',
        CURLOPT_HTTPAUTH => CURLAUTH_BASIC,
        CURLOPT_TIMEOUT => 45,
    ]);

    $response = curl_exec($ch);
    $curlError = curl_error($ch);
    $httpCode = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($response === false) {
        throw new Exception('Error al conectar con Openpay: ' . $curlError);
    }

    $decoded = json_decode($response, true);
    if (!is_array($decoded)) {
        throw new Exception('Openpay devolvió una respuesta inválida');
    }

    if ($httpCode < 200 || $httpCode >= 300) {
        $message = $decoded['description']
            ?? $decoded['message']
            ?? $decoded['error_message']
            ?? 'Error al consultar el cargo en Openpay';
        throw new Exception($message);
    }

    return $decoded;
}

function buildOpenpayCustomer($nombre, $email, $telefono, array $direccionEnvio) {
    $parts = preg_split('/\s+/', trim((string)$nombre));
    $lastName = count($parts) > 1 ? array_pop($parts) : 'Cliente';
    $firstName = trim(implode(' ', $parts));

    if ($firstName === '') {
        $firstName = trim((string)$nombre) ?: 'Cliente';
    }

    $phone = preg_replace('/\D+/', '', (string)$telefono);
    if ($phone === '') {
        $phone = '0000000000';
    }

    return [
        'name' => $firstName,
        'last_name' => $lastName,
        'email' => $email,
        'phone_number' => $phone,
        'address' => [
            'line1' => $direccionEnvio['street1'] ?? 'Calle no proporcionada',
            'city' => $direccionEnvio['city'] ?? 'Ciudad no proporcionada',
            'state' => $direccionEnvio['state'] ?? 'Estado no proporcionado',
            'postal_code' => $direccionEnvio['postal_code'] ?? '00000',
            'country_code' => 'MX',
        ],
    ];
}

function buildOpenpayDescription(array $items) {
    $names = array_map(function ($item) {
        return ($item['cantidad'] ?? 1) . 'x ' . ($item['nombre'] ?? 'Producto');
    }, array_slice($items, 0, 4));

    $description = 'Tienda IMCYC: ' . implode(', ', $names);
    if (count($items) > 4) {
        $description .= ' y mas productos';
    }

    return substr($description, 0, 250);
}

function formatOpenpayDueDate($timestamp) {
    return date('Y-m-d\TH:i:s', $timestamp);
}

function formatOpenpayDisplayDate($dateValue, $fallbackTimestamp) {
    $timestamp = is_numeric($dateValue) ? (int)$dateValue : strtotime((string)$dateValue);
    if (!$timestamp) {
        $timestamp = $fallbackTimestamp;
    }

    return date('d/m/Y H:i', $timestamp);
}

function generateOpenpayOrderId($userId, $paymentType) {
    try {
        $suffix = bin2hex(random_bytes(3));
    } catch (Exception $e) {
        $suffix = substr(str_replace('.', '', uniqid('', true)), -6);
    }

    return 'imcyc-' . $paymentType . '-' . $userId . '-' . date('YmdHis') . '-' . $suffix;
}

/**
 * Petición genérica a la API Openpay.
 */
function openpayApiRequest(string $method, string $relativePath, ?array $body = null) {
    if (!function_exists('curl_init')) {
        throw new Exception('La extensión cURL de PHP es requerida para conectar con Openpay');
    }

    $config = getOpenpayConfig();
    $relativePath = ltrim($relativePath, '/');
    $url = $config['base_url'] . '/' . rawurlencode($config['merchant_id']) . '/' . $relativePath;

    $ch = curl_init($url);
    $headers = ['Accept: application/json'];
    $opts = [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_USERPWD => $config['private_key'] . ':',
        CURLOPT_HTTPAUTH => CURLAUTH_BASIC,
        CURLOPT_TIMEOUT => 45,
    ];

    $method = strtoupper($method);
    if ($method === 'POST') {
        $payload = json_encode($body ?? []);
        if ($payload === false) {
            throw new Exception('No se pudo preparar la solicitud para Openpay');
        }
        $opts[CURLOPT_POST] = true;
        $opts[CURLOPT_POSTFIELDS] = $payload;
        $headers[] = 'Content-Type: application/json';
    } elseif ($method === 'PUT') {
        $payload = json_encode($body ?? []);
        if ($payload === false) {
            throw new Exception('No se pudo preparar la solicitud para Openpay');
        }
        $opts[CURLOPT_CUSTOMREQUEST] = 'PUT';
        $opts[CURLOPT_POSTFIELDS] = $payload;
        $headers[] = 'Content-Type: application/json';
    } elseif ($method !== 'GET') {
        $opts[CURLOPT_CUSTOMREQUEST] = $method;
    }

    $opts[CURLOPT_HTTPHEADER] = $headers;
    curl_setopt_array($ch, $opts);

    $response = curl_exec($ch);
    $curlError = curl_error($ch);
    $httpCode = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($response === false) {
        throw new Exception('Error al conectar con Openpay: ' . $curlError);
    }

    if ($httpCode >= 200 && $httpCode < 300 && trim((string) $response) === '') {
        return [];
    }

    $decoded = json_decode($response, true);
    if (!is_array($decoded)) {
        if ($httpCode >= 200 && $httpCode < 300) {
            return [];
        }
        throw new Exception('Openpay devolvió una respuesta inválida');
    }

    if ($httpCode < 200 || $httpCode >= 300) {
        $message = $decoded['description']
            ?? $decoded['message']
            ?? $decoded['error_message']
            ?? 'Error en la solicitud a Openpay';
        throw new Exception($message);
    }

    return $decoded;
}

function createOpenpayCustomerRecord(array $customerData) {
    return openpayApiRequest('POST', 'customers', $customerData);
}

function createOpenpayPlanRecord(array $planData) {
    return openpayApiRequest('POST', 'plans', $planData);
}

function createOpenpaySubscription(string $customerId, array $subscriptionData) {
    $customerId = trim($customerId);
    if ($customerId === '') {
        throw new Exception('Cliente Openpay inválido');
    }
    return openpayApiRequest('POST', 'customers/' . rawurlencode($customerId) . '/subscriptions', $subscriptionData);
}

function cancelOpenpaySubscription(string $customerId, string $subscriptionId): array {
    $customerId = trim($customerId);
    $subscriptionId = trim($subscriptionId);
    if ($customerId === '' || $subscriptionId === '') {
        throw new Exception('Datos de suscripción incompletos');
    }
    return openpayApiRequest(
        'DELETE',
        'customers/' . rawurlencode($customerId) . '/subscriptions/' . rawurlencode($subscriptionId)
    );
}

function mapOpenpaySubscriptionStatus($status) {
    $s = strtolower((string) $status);
    if (in_array($s, ['active', 'trial', 'completed'], true)) {
        return 'aprobado';
    }
    if (in_array($s, ['cancelled', 'canceled', 'unpaid', 'past_due'], true)) {
        return 'cancelado';
    }
    return 'pendiente';
}

function normalizeOpenpayCardDeclineMessage($message) {
    $normalized = strtolower((string) $message);
    $sensitiveDeclines = [
        'fondos insuficientes',
        'insufficient funds',
        'perdida',
        'perdido',
        'robada',
        'robado',
        'lost',
        'stolen',
    ];
    foreach ($sensitiveDeclines as $decline) {
        if (strpos($normalized, $decline) !== false) {
            return 'Tarjeta declinada';
        }
    }
    return $message;
}
?>
