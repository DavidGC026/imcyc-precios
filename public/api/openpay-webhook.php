<?php
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/membership-store.php';
require_once __DIR__ . '/openpay-client.php';

$rawPayload = file_get_contents('php://input');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    apiError('Método no permitido', 405);
}

try {
    $event = json_decode($rawPayload, true);
    if (!is_array($event)) {
        apiError('Payload inválido', 400);
    }

    $transaction = $event['transaction'] ?? $event['data']['object'] ?? $event;
    if (isset($event['data']) && is_array($event['data']) && isset($event['data']['object'])) {
        $transaction = $event['data']['object'];
    }

    $eventType = $event['type'] ?? $event['event'] ?? '';
    $orderId = $transaction['order_id'] ?? $transaction['id'] ?? null;

    if (!$orderId && isset($transaction['subscription_id'])) {
        $orderId = $transaction['subscription_id'];
    }

    if (!$orderId) {
        apiSuccess(['processed' => false], 'Sin identificador de orden');
    }

    $statusMap = [
        'charge.succeeded' => 'aprobado',
        'charge.completed' => 'aprobado',
        'charge.failed' => 'rechazado',
        'charge.cancelled' => 'cancelado',
        'charge.canceled' => 'cancelado',
        'charge.pending' => 'pendiente',
        'subscription.charge.succeeded' => 'aprobado',
        'subscription.charge.failed' => 'rechazado',
    ];

    $newStatus = $statusMap[$eventType] ?? null;
    if ($newStatus) {
        update_membership_order_status((string) $orderId, $newStatus, $eventType);
    }

    $chargeStatus = strtolower((string) ($transaction['status'] ?? ''));
    if ($newStatus === null && $chargeStatus !== '') {
        update_membership_order_status(
            (string) $orderId,
            mapOpenpayStatusToPedidoStatus($chargeStatus),
            $chargeStatus
        );
    }

    apiSuccess([
        'processed' => true,
        'event_type' => $eventType,
        'order_id' => $orderId,
    ], 'Webhook procesado');
} catch (Exception $e) {
    error_log('openpay-webhook.php: ' . $e->getMessage());
    apiError('Error procesando webhook', 500);
}
