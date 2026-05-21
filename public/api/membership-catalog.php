<?php
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/membership-plans.php';

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
        apiError('Método no permitido', 405);
    }
    $catalog = membership_plan_catalog();
    $public = [];
    foreach ($catalog as $key => $plan) {
        $public[$key] = [
            'key' => $key,
            'name' => $plan['name'],
            'cycle' => $plan['cycle'],
            'amount' => $plan['amount'],
            'supports_subscription' => $plan['supports_subscription'],
        ];
    }
    apiSuccess(['plans' => $public], 'Catálogo de membresías');
} catch (Exception $e) {
    apiError($e->getMessage(), 500);
}
