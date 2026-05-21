<?php

function membership_plan_catalog(): array {
    return [
        'profesional-monthly' => [
            'name' => 'Profesional',
            'cycle' => 'monthly',
            'amount' => 99.0,
            'repeat_unit' => 'month',
            'repeat_every' => 1,
            'supports_subscription' => true,
        ],
        'profesional-yearly' => [
            'name' => 'Profesional',
            'cycle' => 'yearly',
            'amount' => 1089.0,
            'repeat_unit' => 'year',
            'repeat_every' => 1,
            'supports_subscription' => true,
        ],
        'profesional-plus-monthly' => [
            'name' => 'Profesional Plus',
            'cycle' => 'monthly',
            'amount' => 299.0,
            'repeat_unit' => 'month',
            'repeat_every' => 1,
            'supports_subscription' => true,
        ],
        'profesional-plus-yearly' => [
            'name' => 'Profesional Plus',
            'cycle' => 'yearly',
            'amount' => 3289.0,
            'repeat_unit' => 'year',
            'repeat_every' => 1,
            'supports_subscription' => true,
        ],
        'agregados-yearly' => [
            'name' => 'Agregados',
            'cycle' => 'yearly',
            'amount' => 25000.0,
            'repeat_unit' => 'year',
            'repeat_every' => 1,
            'supports_subscription' => false,
        ],
        'concreto-yearly' => [
            'name' => 'Concreto',
            'cycle' => 'yearly',
            'amount' => 35000.0,
            'repeat_unit' => 'year',
            'repeat_every' => 1,
            'supports_subscription' => false,
        ],
    ];
}

function membership_plan_key(string $planKey, string $cycle): string {
    $planKey = strtolower(preg_replace('/[^a-z0-9\-]+/', '-', trim($planKey)));
    $cycle = strtolower(trim($cycle));
    if ($planKey === '' || !in_array($cycle, ['monthly', 'yearly'], true)) {
        throw new Exception('Plan o ciclo de facturación inválido');
    }
    $composite = $planKey . '-' . $cycle;
    $catalog = membership_plan_catalog();
    if (!isset($catalog[$composite])) {
        throw new Exception('Plan de membresía no disponible');
    }
    return $composite;
}

function membership_plan_config_paths(): array {
    $dir = '/var/www/sources/openpay';
    $isSandbox = function_exists('imcyc_precios_openpay_sandbox_requested')
        && imcyc_precios_openpay_sandbox_requested();
    $persistent = $isSandbox
        ? $dir . '/membership-plans.sandbox.php'
        : $dir . '/membership-plans.production.php';

    $paths = [];
    if (file_exists($persistent)) {
        $paths[] = $persistent;
    }
    $local = __DIR__ . '/membership-plans.config.php';
    if (file_exists($local)) {
        $paths[] = $local;
    }

    return $paths;
}

function load_membership_plan_overrides(): array {
    static $cache = null;
    if ($cache !== null) {
        return $cache;
    }

    $merged = [];
    foreach (membership_plan_config_paths() as $path) {
        if (!file_exists($path)) {
            continue;
        }
        $loaded = require $path;
        if (is_array($loaded)) {
            $merged = array_merge($merged, $loaded);
        }
    }

    $cache = $merged;
    return $cache;
}

function get_membership_plan_definition(string $planKey, string $cycle): array {
    $composite = membership_plan_key($planKey, $cycle);
    $catalog = membership_plan_catalog();
    $plan = $catalog[$composite];
    $overrides = load_membership_plan_overrides()[$composite] ?? [];
    return array_merge($plan, [
        'key' => $composite,
        'openpay_plan_id' => trim((string)($overrides['openpay_plan_id'] ?? '')),
    ]);
}

function build_membership_description(array $plan): string {
    $cycleLabel = ($plan['cycle'] ?? '') === 'monthly' ? 'mensual' : 'anual';
    return substr('Membresía IMCYC: ' . ($plan['name'] ?? 'Plan') . ' (' . $cycleLabel . ')', 0, 250);
}

function generate_membership_order_id(string $paymentType): string {
    try {
        $suffix = bin2hex(random_bytes(3));
    } catch (Exception $e) {
        $suffix = substr(str_replace('.', '', uniqid('', true)), -6);
    }
    return 'imcyc-memb-' . $paymentType . '-' . date('YmdHis') . '-' . $suffix;
}

function membership_default_address(): array {
    return [
        'street1' => 'Membresía digital',
        'city' => 'Ciudad de México',
        'state' => 'CDMX',
        'country' => 'MX',
        'postal_code' => '06600',
    ];
}
