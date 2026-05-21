<?php
/**
 * Sincroniza orden local con el estado del cargo en Openpay (post 3D Secure).
 * GET ?charge_id=trxxxx
 */
require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../membership-store.php';

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
        apiError('Método no permitido', 405);
    }

    $chargeId = trim((string) ($_GET['charge_id'] ?? $_GET['id'] ?? ''));
    if ($chargeId === '') {
        apiError('charge_id requerido', 400);
    }

    $order = sync_membership_order_from_openpay_charge($chargeId);
    if (!$order) {
        apiError('No se pudo sincronizar el cargo', 404);
    }

    apiSuccess(['order' => $order], 'Orden sincronizada con Openpay');
} catch (Exception $e) {
    error_log('orders/sync.php: ' . $e->getMessage());
    apiError('Error al sincronizar', 500);
}
