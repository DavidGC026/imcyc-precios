<?php
/**
 * Script para crear una sesión de Checkout de Conekta
 */

header('Content-Type: application/json');

// 1. Cargar configuración del .env
function get_env_var($key, $default = null) {
    if (file_exists(__DIR__ . '/../../.env')) {
        $lines = file(__DIR__ . '/../../.env', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        foreach ($lines as $line) {
            if (strpos(trim($line), '#') === 0) continue;
            list($name, $value) = explode('=', $line, 2);
            if (trim($name) === $key) return trim($value);
        }
    }
    return $default;
}

$private_key = get_env_var('CONEKTA_PRIVATE_KEY');
$success_url = get_env_var('REACT_APP_SUCCESS_URL');
$cancel_url = get_env_var('REACT_APP_CANCEL_URL');

// 2. Obtener datos del plan desde el frontend
$data = json_decode(file_get_contents('php://input'), true);

if (!$data || !isset($data['plan_name']) || !isset($data['unit_price'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Datos de plan inválidos']);
    exit;
}

$plan_name = $data['plan_name'];
$unit_price = (int)$data['unit_price']; // Ya debe venir en centavos
$currency = 'MXN';

// 3. Crear el Checkout Session en Conekta mediante su API REST
$ch = curl_init();

$payload = json_encode([
    'customer_info' => [
        'name' => 'Cliente Universidad IMCYC',
        'email' => 'cliente@ejemplo.com', // En una app real, obtén esto del usuario autenticado
        'phone' => '+525555555555'
    ],
    'line_items' => [[
        'name' => 'Membresía ' . $plan_name,
        'unit_price' => $unit_price,
        'quantity' => 1
    ]],
    'checkout' => [
        'allowed_payment_methods' => ['card', 'cash', 'bank_transfer'],
        'type' => 'HostedCheckout',
        'success_url' => $success_url,
        'failure_url' => $cancel_url,
        'monthly_installments_enabled' => false
    ],
    'currency' => $currency
]);

curl_setopt($ch, CURLOPT_URL, 'https://api.conekta.io/orders');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
curl_setopt($ch, CURLOPT_POST, 1);
curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
curl_setopt($ch, CURLOPT_USERPWD, $private_key . ':');
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Accept: application/vnd.conekta-v2.1.0+json',
    'Content-Type: application/json'
]);

$result = curl_exec($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

$response = json_decode($result, true);

if ($http_code === 200 || $http_code === 201) {
    echo json_encode([
        'checkout_url' => $response['checkout']['url']
    ]);
} else {
    http_response_code($http_code);
    echo json_encode([
        'error' => 'Error al crear la orden en Conekta',
        'details' => $response
    ]);
}
