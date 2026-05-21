<?php
/**
 * Copiar según entorno:
 * - Producción: /var/www/sources/openpay/membership-plans.production.php
 * - Sandbox:     /var/www/sources/openpay/membership-plans.sandbox.php
 * - Local:       membership-plans.config.php (este directorio)
 */
return [
    'profesional-monthly' => ['openpay_plan_id' => ''],
    'profesional-yearly' => ['openpay_plan_id' => ''],
    'profesional-plus-monthly' => ['openpay_plan_id' => ''],
    'profesional-plus-yearly' => ['openpay_plan_id' => ''],
];
