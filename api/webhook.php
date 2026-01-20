<?php
/**
 * Webhook para recibir notificaciones de Conekta
 * Este script procesa eventos como 'order.paid' para activar suscripciones.
 */

// 1. Cargar configuración (puedes usar una librería como phpdotenv)
// Por ahora leeremos el .env manualmente para este ejemplo
function get_env_var($key, $default = null) {
    if (file_exists(__DIR__ . '/../.env')) {
        $lines = file(__DIR__ . '/../.env', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        foreach ($lines as $line) {
            if (strpos(trim($line), '#') === 0) continue;
            list($name, $value) = explode('=', $line, 2);
            if (trim($name) === $key) return trim($value);
        }
    }
    return $default;
}

$webhook_secret = get_env_var('CONEKTA_WEBHOOK_SECRET');

// 2. Obtener el cuerpo de la petición
$payload = file_get_contents('php://input');
$body = json_decode($payload, true);

if (!$body) {
    http_response_code(400);
    exit('Payload inválido');
}

// 3. Validar la firma (Opcional pero RECOMENDADO)
// Nota: Conekta envía una firma en los headers para validar el origen.
// En este ejemplo básico procesaremos según el tipo de evento.

$event_type = $body['type'] ?? '';

switch ($event_type) {
    case 'order.paid':
        $order = $body['data']['object'];
        $order_id = $order['id'];
        $customer_email = $order['customer_info']['email'] ?? 'N/A';
        $amount = $order['amount'] / 100; // Centavos a pesos

        // Lógica de Activación:
        // Aquí deberías actualizar tu base de datos:
        // - Marcar la orden como pagada
        // - Activar la suscripción del usuario según el plan comprado
        
        error_log("Pago recibido exitosamente: Orden $order_id, Cliente $customer_email, Monto $amount MXN");
        
        // Responder a Conekta con éxito
        http_response_code(200);
        echo json_encode(['status' => 'success', 'message' => 'Suscripción activada']);
        break;

    case 'order.pending_payment':
        // El cliente eligió pago en OXXO o transferencia y está pendiente
        http_response_code(200);
        break;

    case 'order.expired':
        // El pago no se realizó y la orden expiró
        http_response_code(200);
        break;

    default:
        // Otros eventos que no nos interesan por ahora
        http_response_code(200);
        echo json_encode(['status' => 'ignored']);
        break;
}
