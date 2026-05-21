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

    $sync = isset($_GET['sync']) && $_GET['sync'] !== '0';
    if ($sync) {
        $synced = sync_membership_order_from_openpay_charge($orderId);
        if ($synced) {
            apiSuccess(['order' => $synced], 'Orden sincronizada');
        }
    }

    $order = get_membership_order($orderId);
    if ($order) {
        apiSuccess(['order' => $order], 'Orden encontrada');
    }

    try {
        $synced = sync_membership_order_from_openpay_charge($orderId);
        if ($synced) {
            apiSuccess(['order' => $synced], 'Orden sincronizada desde Openpay');
        }
        apiError('Orden no encontrada', 404);
    } catch (Exception $e) {
        apiError('Orden no encontrada', 404);
    }
} catch (Exception $e) {
    apiError($e->getMessage(), 500);
}
