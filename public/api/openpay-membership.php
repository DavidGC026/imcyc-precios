<?php

require_once __DIR__ . '/membership-plans.php';
require_once __DIR__ . '/openpay-client.php';

/**
 * Metadata antifraude / trazabilidad (buenas prácticas Openpay).
 */
function build_membership_charge_metadata(array $plan, array $data, string $paymentType, string $billingMode): array {
    return array_filter([
        'plan_key' => (string) ($plan['key'] ?? ''),
        'plan_name' => (string) ($plan['name'] ?? ''),
        'payment_type' => $paymentType,
        'billing_mode' => $billingMode,
        'currency' => 'MXN',
        'cycle' => (string) ($plan['cycle'] ?? ''),
        'customer_email' => trim((string) ($data['email'] ?? '')),
        'app' => 'imcyc-precios',
    ], static fn ($v) => $v !== '');
}

function resolve_openpay_plan_id(array $plan): string {
    if (!empty($plan['openpay_plan_id'])) {
        return $plan['openpay_plan_id'];
    }

    $isSandbox = function_exists('imcyc_precios_openpay_sandbox_requested')
        && imcyc_precios_openpay_sandbox_requested();
    if (!$isSandbox) {
        throw new Exception(
            'Plan Openpay no configurado para "' . ($plan['key'] ?? 'desconocido')
            . '". Asigne openpay_plan_id en membership-plans.production.php'
        );
    }

    $cachePath = __DIR__ . '/data/openpay-plan-cache.json';
    $cache = [];
    if (file_exists($cachePath)) {
        $loaded = json_decode((string) file_get_contents($cachePath), true);
        if (is_array($loaded)) {
            $cache = $loaded;
        }
    }

    if (!empty($cache[$plan['key']])) {
        return $cache[$plan['key']];
    }

    $created = createOpenpayPlanRecord([
        'name' => 'IMCYC ' . $plan['name'] . ' ' . $plan['cycle'],
        'amount' => (float) number_format($plan['amount'], 2, '.', ''),
        'repeat_every' => (int) ($plan['repeat_every'] ?? 1),
        'repeat_unit' => $plan['repeat_unit'] ?? 'month',
        'retry_times' => 2,
        'status_after_retry' => 'cancelled',
        'trial_days' => 0,
    ]);

    $planId = $created['id'] ?? '';
    if ($planId === '') {
        throw new Exception('No se pudo crear el plan de suscripción en Openpay');
    }

    $cache[$plan['key']] = $planId;
    $dir = dirname($cachePath);
    if (!is_dir($dir)) {
        mkdir($dir, 0750, true);
    }
    file_put_contents($cachePath, json_encode($cache, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

    return $planId;
}

function should_use_openpay_subscription(string $paymentMethod, array $plan, array $data): bool {
    if ($paymentMethod !== 'card') {
        return false;
    }
    if (($data['billing_mode'] ?? 'subscription') === 'one_time') {
        return false;
    }
    return !empty($plan['supports_subscription']);
}

function process_membership_card_payment(array $data, array $plan): array {
    $nombre = trim((string) ($data['name'] ?? ''));
    $email = trim((string) ($data['email'] ?? ''));
    $telefono = trim((string) ($data['phone'] ?? '0000000000'));
    $tokenId = trim((string) ($data['token_id'] ?? ''));
    $deviceSessionId = trim((string) ($data['device_session_id'] ?? ''));

    if ($nombre === '' || $email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        throw new Exception('Nombre y correo válidos son obligatorios');
    }
    if ($tokenId === '' || $deviceSessionId === '') {
        throw new Exception('Token de tarjeta o sesión segura incompletos');
    }

    $address = membership_default_address();
    $customerPayload = buildOpenpayCustomer($nombre, $email, $telefono, $address);
    $merchantOrderId = generate_membership_order_id('card');

    if (should_use_openpay_subscription('card', $plan, $data)) {
        $openpayCustomer = createOpenpayCustomerRecord($customerPayload);
        $customerId = $openpayCustomer['id'] ?? '';
        if ($customerId === '') {
            throw new Exception('No se pudo registrar el cliente en Openpay');
        }

        $planId = resolve_openpay_plan_id($plan);
        // Openpay: token + device_session_id → tarjeta en cliente, luego suscripción (antifraude).
        $card = createOpenpayCustomerCardFromToken($customerId, $tokenId, $deviceSessionId);
        $cardId = $card['id'] ?? '';
        if ($cardId === '') {
            throw new Exception('No se pudo registrar la tarjeta del cliente en Openpay');
        }

        $subscription = createOpenpaySubscription($customerId, [
            'plan_id' => $planId,
            'source_id' => $cardId,
        ]);

        $subscriptionId = $subscription['id'] ?? $merchantOrderId;
        $status = strtolower((string) ($subscription['status'] ?? 'active'));
        $localStatus = mapOpenpaySubscriptionStatus($status);

        return [
            'order_id' => $subscriptionId,
            'openpay_order_id' => $merchantOrderId,
            'status' => $localStatus,
            'provider_status' => $status,
            'billing_mode' => 'subscription',
            'requires_action' => false,
            'action_url' => null,
            'subscription_id' => $subscriptionId,
            'customer_id' => $customerId,
            'total' => number_format($plan['amount'], 2, '.', ''),
            'plan' => $plan,
        ];
    }

    $origin = $_SERVER['HTTP_ORIGIN'] ?? 'https://grabador.imcyc.com';
    $redirectUrl = rtrim($origin, '/') . precios_app_base() . '/confirmacion';

    $openpayCharge = createOpenpayCharge([
        'method' => 'card',
        'source_id' => $tokenId,
        'amount' => (float) number_format($plan['amount'], 2, '.', ''),
        'currency' => 'MXN',
        'description' => build_membership_description($plan),
        'order_id' => $merchantOrderId,
        'device_session_id' => $deviceSessionId,
        'use_3d_secure' => true,
        'redirect_url' => $redirectUrl,
        'customer' => $customerPayload,
        'metadata' => build_membership_charge_metadata($plan, $data, 'membership_card', 'one_time'),
    ]);

    $orderId = $openpayCharge['id'] ?? $merchantOrderId;
    $status = strtolower((string) ($openpayCharge['status'] ?? 'in_progress'));
    $paymentMethod = $openpayCharge['payment_method'] ?? [];
    $actionUrl = $paymentMethod['url'] ?? $paymentMethod['redirect_url'] ?? $openpayCharge['redirect_url'] ?? null;

    return [
        'order_id' => $orderId,
        'openpay_order_id' => $merchantOrderId,
        'status' => mapOpenpayStatusToPedidoStatus($status),
        'provider_status' => $status,
        'billing_mode' => 'one_time',
        'requires_action' => !empty($actionUrl),
        'action_url' => $actionUrl,
        'total' => number_format($plan['amount'], 2, '.', ''),
        'plan' => $plan,
    ];
}

function process_membership_cash_payment(array $data, array $plan): array {
    $nombre = trim((string) ($data['name'] ?? ''));
    $email = trim((string) ($data['email'] ?? ''));
    $telefono = trim((string) ($data['phone'] ?? '0000000000'));

    if ($nombre === '' || $email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        throw new Exception('Nombre y correo válidos son obligatorios');
    }

    $expiresAt = time() + (3 * 24 * 60 * 60);
    $merchantOrderId = generate_membership_order_id('cash');
    $address = membership_default_address();

    $openpayCharge = createOpenpayCharge([
        'method' => 'store',
        'amount' => (float) number_format($plan['amount'], 2, '.', ''),
        'currency' => 'MXN',
        'description' => build_membership_description($plan),
        'order_id' => $merchantOrderId,
        'due_date' => formatOpenpayDueDate($expiresAt),
        'customer' => buildOpenpayCustomer($nombre, $email, $telefono, $address),
        'metadata' => build_membership_charge_metadata($plan, $data, 'membership_cash', 'one_time'),
    ]);

    $orderId = $openpayCharge['id'] ?? $merchantOrderId;
    $referencia = 'N/D';
    $vence = formatOpenpayDisplayDate($openpayCharge['due_date'] ?? null, $expiresAt);
    $barcodeUrl = null;

    if (isset($openpayCharge['payment_method']) && ($openpayCharge['payment_method']['type'] ?? '') === 'store') {
        $pm = $openpayCharge['payment_method'];
        $referencia = $pm['reference'] ?? $orderId;
        $barcodeUrl = $pm['barcode_url'] ?? null;
    }

    return [
        'order_id' => $orderId,
        'openpay_order_id' => $merchantOrderId,
        'status' => 'pendiente',
        'provider_status' => strtolower((string) ($openpayCharge['status'] ?? 'pending')),
        'billing_mode' => 'one_time',
        'reference' => $referencia,
        'expires_at' => $vence,
        'barcode_url' => $barcodeUrl,
        'total' => number_format($plan['amount'], 2, '.', ''),
        'plan' => $plan,
    ];
}

function process_membership_transfer_payment(array $data, array $plan): array {
    $nombre = trim((string) ($data['name'] ?? ''));
    $email = trim((string) ($data['email'] ?? ''));
    $telefono = trim((string) ($data['phone'] ?? '0000000000'));

    if ($nombre === '' || $email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        throw new Exception('Nombre y correo válidos son obligatorios');
    }

    $expiresAt = time() + (24 * 60 * 60);
    $merchantOrderId = generate_membership_order_id('spei');
    $address = membership_default_address();

    $openpayCharge = createOpenpayCharge([
        'method' => 'bank_account',
        'amount' => (float) number_format($plan['amount'], 2, '.', ''),
        'currency' => 'MXN',
        'description' => build_membership_description($plan),
        'order_id' => $merchantOrderId,
        'due_date' => formatOpenpayDueDate($expiresAt),
        'customer' => buildOpenpayCustomer($nombre, $email, $telefono, $address),
        'metadata' => build_membership_charge_metadata($plan, $data, 'membership_spei', 'one_time'),
    ]);

    $orderId = $openpayCharge['id'] ?? $merchantOrderId;
    $referencia = 'N/D';
    $clabe = 'N/D';
    $banco = 'N/D';
    $vence = formatOpenpayDisplayDate($openpayCharge['due_date'] ?? null, $expiresAt);

    if (isset($openpayCharge['payment_method'])) {
        $pm = $openpayCharge['payment_method'];
        if (in_array(($pm['type'] ?? ''), ['bank_account', 'bank_transfer'], true)) {
            $referencia = $pm['reference'] ?? $pm['name'] ?? $orderId;
            $clabe = $pm['clabe'] ?? 'N/D';
            $banco = $pm['bank'] ?? 'STP';
        }
    }

    return [
        'order_id' => $orderId,
        'openpay_order_id' => $merchantOrderId,
        'status' => 'pendiente',
        'provider_status' => strtolower((string) ($openpayCharge['status'] ?? 'pending')),
        'billing_mode' => 'one_time',
        'reference' => $referencia,
        'clabe' => $clabe,
        'bank' => $banco,
        'beneficiary' => 'OPENPAY SAPI DE CV',
        'expires_at' => $vence,
        'total' => number_format($plan['amount'], 2, '.', ''),
        'plan' => $plan,
    ];
}

function persist_membership_payment(array $data, array $result, string $paymentMethod): void {
    require_once __DIR__ . '/membership-store.php';
    save_membership_order([
        'order_id' => $result['order_id'],
        'plan_key' => $result['plan']['key'] ?? ($data['plan_key'] ?? ''),
        'customer_name' => trim((string) ($data['name'] ?? '')),
        'customer_email' => trim((string) ($data['email'] ?? '')),
        'amount' => (float) ($result['total'] ?? 0),
        'payment_method' => $paymentMethod,
        'billing_mode' => $result['billing_mode'] ?? null,
        'status' => $result['status'] ?? 'pendiente',
        'provider_status' => $result['provider_status'] ?? null,
        'openpay_customer_id' => $result['customer_id'] ?? null,
        'openpay_subscription_id' => $result['subscription_id'] ?? null,
        'payment_payload' => $result,
    ]);
}
