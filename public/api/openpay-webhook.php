<?php
/**
 * Webhook Openpay — membresías /precios
 * Registrar en panel: https://grabador.imcyc.com/precios/api/openpay-webhook.php
 * Ver precios-webhook.env.example (HTTP Basic).
 */
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/membership-store.php';
require_once __DIR__ . '/openpay-client.php';

function webhook_respond(array $data, string $message = 'OK'): void {
    if (ob_get_level()) {
        ob_clean();
    }
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'data' => $data,
        'message' => $message,
        'timestamp' => date('Y-m-d H:i:s'),
    ], JSON_UNESCAPED_UNICODE);
    exit();
}

function webhook_auth_fail(): void {
    header('WWW-Authenticate: Basic realm="Openpay Webhook"');
    if (ob_get_level()) {
        ob_clean();
    }
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'No autorizado'], JSON_UNESCAPED_UNICODE);
    exit();
}

$rawPayload = file_get_contents('php://input');

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    webhook_respond(['processed' => false], 'Método ignorado');
}

if (!verify_openpay_webhook_auth()) {
    error_log('openpay-webhook.php: autenticación rechazada');
    webhook_auth_fail();
}

try {
    $event = json_decode($rawPayload, true);
    if (!is_array($event)) {
        webhook_respond(['processed' => false], 'Payload no JSON');
    }

    $eventType = (string) ($event['type'] ?? $event['event'] ?? '');
    $eventKey = openpay_webhook_event_key($event, $rawPayload);

    if (is_openpay_webhook_event_processed($eventKey)) {
        webhook_respond(['processed' => false, 'duplicate' => true, 'event_key' => $eventKey], 'Evento ya procesado');
    }

    $transaction = $event['transaction'] ?? $event['data']['object'] ?? $event;
    if (isset($event['data']) && is_array($event['data']) && isset($event['data']['object'])) {
        $transaction = $event['data']['object'];
    }

    $chargeId = trim((string) ($transaction['id'] ?? ''));
    $merchantOrderId = trim((string) ($transaction['order_id'] ?? ''));
    $subscriptionId = trim((string) ($transaction['subscription_id'] ?? ''));

    $statusMap = [
        'charge.succeeded' => 'aprobado',
        'charge.completed' => 'aprobado',
        'charge.failed' => 'rechazado',
        'charge.cancelled' => 'cancelado',
        'charge.canceled' => 'cancelado',
        'charge.pending' => 'pendiente',
        'charge.refunded' => 'cancelado',
        'charge.created' => 'pendiente',
        'subscription.charge.succeeded' => 'aprobado',
        'subscription.charge.failed' => 'rechazado',
        'chargeback.accepted' => 'cancelado',
        'chargeback.rejected' => 'aprobado',
        'chargeback.adjustment' => 'pendiente',
    ];

    $newStatus = $statusMap[$eventType] ?? null;
    $updated = 0;
    $orderRef = null;

    if ($newStatus !== null) {
        if ($subscriptionId !== '') {
            $orderRef = $subscriptionId;
            $updated = update_membership_order_by_subscription_id($subscriptionId, $newStatus, $eventType);
        }
        if ($updated === 0 && $chargeId !== '') {
            $orderRef = $chargeId;
            $updated = update_membership_order_status($chargeId, $newStatus, $eventType);
            if ($updated === 0 && $merchantOrderId !== '') {
                $updated = update_membership_order_status($merchantOrderId, $newStatus, $eventType);
                $orderRef = $merchantOrderId;
            }
        } elseif ($updated === 0 && $merchantOrderId !== '') {
            $orderRef = $merchantOrderId;
            $updated = update_membership_order_status($merchantOrderId, $newStatus, $eventType);
        }
    }

    $chargeStatus = strtolower((string) ($transaction['status'] ?? ''));
    if ($newStatus === null && $chargeStatus !== '') {
        $mapped = mapOpenpayStatusToPedidoStatus($chargeStatus);
        if ($subscriptionId !== '') {
            $orderRef = $subscriptionId;
            $updated = update_membership_order_by_subscription_id($subscriptionId, $mapped, $chargeStatus);
        } elseif ($chargeId !== '') {
            $orderRef = $chargeId;
            $updated = update_membership_order_status($chargeId, $mapped, $chargeStatus);
        }
    }

    mark_openpay_webhook_event_processed($eventKey, $eventType, $orderRef, $rawPayload);

    webhook_respond([
        'processed' => true,
        'event_type' => $eventType,
        'event_key' => $eventKey,
        'order_ref' => $orderRef,
        'rows_updated' => $updated,
    ], 'Webhook procesado');
} catch (Throwable $e) {
    error_log('openpay-webhook.php: ' . $e->getMessage());
    webhook_respond(['processed' => false, 'error' => 'logged'], 'Error interno registrado');
}
