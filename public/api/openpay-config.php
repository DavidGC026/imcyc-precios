<?php
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/openpay-client.php';

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
        apiError('Método no permitido', 405);
    }
    apiSuccess(getOpenpayPublicConfig(), 'Configuración pública de Openpay');
} catch (Exception $e) {
    error_log('openpay-config.php: ' . $e->getMessage());
    apiError($e->getMessage(), 500);
}
