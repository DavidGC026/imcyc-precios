-- Ejecutar una vez como administrador: sudo mysql imcyc_precios_memberships < scripts/mysql-memberships-schema.sql

CREATE TABLE IF NOT EXISTS membership_orders (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    order_id VARCHAR(64) NOT NULL,
    plan_key VARCHAR(64) NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    payment_method VARCHAR(32) NOT NULL,
    billing_mode VARCHAR(32) DEFAULT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'pendiente',
    provider_status VARCHAR(64) DEFAULT NULL,
    openpay_customer_id VARCHAR(64) DEFAULT NULL,
    openpay_subscription_id VARCHAR(64) DEFAULT NULL,
    payment_payload LONGTEXT DEFAULT NULL,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_order_id (order_id),
    KEY idx_status (status),
    KEY idx_customer_email (customer_email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
