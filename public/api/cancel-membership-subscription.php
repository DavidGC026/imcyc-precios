<?php
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/membership-store.php';
require_once __DIR__ . '/openpay-client.php';

ini_set('display_errors', 0);
error_reporting(E_ERROR | E_PARSE);

try {
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

    if ($method === 'GET') {
        $email = trim((string) ($_GET['email'] ?? ''));
        if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            apiError('Indica un correo electrónico válido', 400);
        }

        $rows = list_cancellable_membership_subscriptions($email);
        $subscriptions = array_map(static function (array $row): array {
            return [
                'order_id' => $row['order_id'],
                'subscription_id' => $row['openpay_subscription_id'],
                'plan_key' => $row['plan_key'],
                'customer_name' => $row['customer_name'],
                'amount' => $row['amount'],
                'status' => $row['status'],
                'created_at' => $row['created_at'],
            ];
        }, $rows);

        apiSuccess(['subscriptions' => $subscriptions], 'Suscripciones encontradas');
    }

    if ($method !== 'POST') {
        apiError('Método no permitido', 405);
    }

    $data = getJsonInput();
    $email = trim((string) ($data['email'] ?? ''));
    $subscriptionRef = trim((string) ($data['subscription_id'] ?? $data['order_id'] ?? ''));

    if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        apiError('Correo electrónico inválido', 400);
    }
    if ($subscriptionRef === '') {
        apiError('Indica el ID de suscripción (aparece en tu confirmación de pago)', 400);
    }

    $order = find_membership_subscription_for_cancel($email, $subscriptionRef);
    if (!$order) {
        apiError('No encontramos una suscripción activa con ese correo e ID', 404);
    }

    if (in_array(strtolower((string) ($order['status'] ?? '')), ['cancelado'], true)) {
        apiError('Esta suscripción ya está cancelada', 400);
    }

    $customerId = (string) ($order['openpay_customer_id'] ?? '');
    $subscriptionId = (string) ($order['openpay_subscription_id'] ?? '');

    cancelOpenpaySubscription($customerId, $subscriptionId);

    update_membership_order_status(
        (string) $order['order_id'],
        'cancelado',
        'cancelled'
    );

    apiSuccess([
        'order_id' => $order['order_id'],
        'subscription_id' => $subscriptionId,
        'status' => 'cancelado',
    ], 'Suscripción cancelada. No se realizarán más cargos automáticos.');
} catch (Exception $e) {
    error_log('cancel-membership-subscription.php: ' . $e->getMessage());
    apiError($e->getMessage(), 500);
}
