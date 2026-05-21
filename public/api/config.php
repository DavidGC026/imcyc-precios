<?php
header('Content-Type: application/json; charset=utf-8');

$allowed_origins = [
    'http://localhost:3000',
    'http://localhost',
    'https://grabador.imcyc.com',
    'http://grabador.imcyc.com',
    'https://www.imcyc.com',
    'https://imcyc.com',
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin !== '' && in_array($origin, $allowed_origins, true)) {
    header('Access-Control-Allow-Origin: ' . $origin);
} else {
    header('Access-Control-Allow-Origin: *');
}

header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(200);
    exit();
}

function precios_app_base(): string {
    return '/precios';
}

function apiResponse($success, $data = null, $message = '', $code = 200) {
    if (ob_get_level()) {
        ob_clean();
    }
    http_response_code($code);
    echo json_encode([
        'success' => $success,
        'data' => $data,
        'message' => $message,
        'timestamp' => date('Y-m-d H:i:s'),
    ], JSON_UNESCAPED_UNICODE);
    exit();
}

function apiSuccess($data = null, $message = 'OK') {
    apiResponse(true, $data, $message, 200);
}

function apiError($message, $code = 400) {
    apiResponse(false, null, $message, $code);
}

function getJsonInput() {
    $raw = file_get_contents('php://input');
    $data = json_decode($raw ?: '{}', true);
    return is_array($data) ? $data : [];
}
