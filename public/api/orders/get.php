<?php
require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../membership-store.php';
require_once __DIR__ . '/../openpay-client.php';

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
        apiError('Método no permitido', 405);
    }

    $orderId = trim((string) ($_GET['order_id'] ?? ''));
    if ($orderId === '') {
        apiError('order_id requerido', 400);
    }

    $order = get_membership_order($orderId);
    if ($order) {
        apiSuccess(['order' => $order], 'Orden encontrada');
    }

    try {
        $charge = fetchOpenpayCharge($orderId);
        apiSuccess([
            'order' => [
                'order_id' => $orderId,
                'status' => mapOpenpayStatusToPedidoStatus($charge['status'] ?? 'pending'),
                'provider_status' => $charge['status'] ?? null,
                'amount' => $charge['amount'] ?? null,
                'from_openpay' => true,
            ],
        ], 'Cargo consultado en Openpay');
    } catch (Exception $e) {
        apiError('Orden no encontrada', 404);
    }
} catch (Exception $e) {
    apiError($e->getMessage(), 500);
}
