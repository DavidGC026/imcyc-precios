<?php
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/membership-plans.php';
require_once __DIR__ . '/openpay-membership.php';
require_once __DIR__ . '/membership-store.php';

ini_set('display_errors', 0);
error_reporting(E_ERROR | E_PARSE);

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        apiError('Método no permitido', 405);
    }

    $data = getJsonInput();
    $plan = get_membership_plan_definition(
        (string) ($data['plan_key'] ?? ''),
        (string) ($data['cycle'] ?? '')
    );

    $result = process_membership_card_payment($data, $plan);

    try {
        persist_membership_payment($data, $result, 'card');
    } catch (Throwable $storeError) {
        error_log('process-membership-card.php store: ' . $storeError->getMessage());
        $result['storage_warning'] = 'Pago procesado; registro local pendiente de revisión.';
    }

    apiSuccess($result, 'Pago con tarjeta procesado');
} catch (Exception $e) {
    error_log('process-membership-card.php: ' . $e->getMessage());
    $msg = $e->getMessage();
    if (stripos($msg, 'SQLSTATE') !== false || stripos($msg, 'mysql') !== false) {
        apiError('Error temporal al guardar el pedido. Intenta de nuevo o contacta soporte.', 500);
    } else {
        apiError(normalizeOpenpayCardDeclineMessage($msg), 500);
    }
}
