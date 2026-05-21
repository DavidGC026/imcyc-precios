import React, { useEffect, useState } from 'react';
import { CheckCircle, Clock, ArrowLeft, Landmark, Banknote, Loader2 } from 'lucide-react';
import { apiClient } from '../api/client';
import { appUrl, getAppSearchParams } from '../utils/routes';
import { IMCYC_LOGO_SVG } from '../constants/branding';

const ConfirmationPage = () => {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState({});

  useEffect(() => {
    const params = getAppSearchParams();
    // Tras 3D Secure, Openpay redirige con ?id={charge_id} (documentación Openpay).
    const openpayChargeId = params.get('id') || '';
    const q = {
      order_id: openpayChargeId || params.get('order_id') || '',
      method: params.get('method') || '',
      status: params.get('status') || '',
      from_3ds: Boolean(openpayChargeId),
    };
    setQuery(q);

    const stored = sessionStorage.getItem('membership_payment_result');
    if (stored) {
      try {
        setOrder(JSON.parse(stored));
      } catch {
        /* ignore */
      }
    }

    if (q.order_id) {
      const syncParam = q.from_3ds ? '&sync=1' : '';
      apiClient
        .get(`/orders/get.php?order_id=${encodeURIComponent(q.order_id)}${syncParam}`)
        .then((res) => setOrder((prev) => prev || res.data?.order || res.data))
        .catch(() => {
          if (q.from_3ds) {
            return apiClient
              .get(`/orders/sync.php?charge_id=${encodeURIComponent(q.order_id)}`)
              .then((res) => setOrder((prev) => prev || res.data?.order || res.data))
              .catch(() => {});
          }
          return null;
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const paymentPayload = order?.payment_payload || order || {};
  const status = String(order?.status || query.status || '').toLowerCase();
  const isApproved = ['aprobado', 'active', 'trial', 'completed'].includes(status);

  return (
    <div className="min-h-screen bg-slate-950 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black py-12 px-4">
      <div className="max-w-lg mx-auto">
        <div className="mb-8 flex justify-center">
          <img
            src={IMCYC_LOGO_SVG}
            alt="IMCYC"
            className="h-14 w-auto"
          />
        </div>
        <a
          href={appUrl('/')}
          className="text-[#0076A3] hover:text-white inline-flex items-center gap-2 mb-8 text-sm"
        >
          <ArrowLeft size={18} />
          Volver a precios
        </a>

        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-[24px] p-8 text-center">
          {loading ? (
            <p className="text-slate-400 flex items-center justify-center gap-2">
              <Loader2 className="animate-spin" size={20} />
              Consultando pago…
            </p>
          ) : (
            <>
              <div className="flex justify-center mb-6">
                {isApproved ? (
                  <CheckCircle className="w-16 h-16 text-emerald-500" />
                ) : (
                  <Clock className="w-16 h-16 text-amber-400" />
                )}
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">
                {isApproved ? '¡Pago confirmado!' : 'Completa tu pago'}
              </h1>
              <p className="text-slate-400 mb-6 text-sm leading-relaxed">
                {isApproved
                  ? 'Tu membresía quedó registrada. Revisa tu correo para los siguientes pasos.'
                  : 'Usa las instrucciones siguientes. La membresía se activa cuando Openpay confirme el pago.'}
              </p>

              {paymentPayload.reference && (
                <div className="bg-[#0D0D0D] rounded-xl p-4 text-left text-sm space-y-2 mb-4 border border-[#2A2A2A]">
                  {query.method === 'transfer' || paymentPayload.clabe ? (
                    <div className="flex items-center gap-2 text-[#0076A3] font-semibold mb-2">
                      <Landmark size={16} /> SPEI
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-emerald-400 font-semibold mb-2">
                      <Banknote size={16} /> Efectivo
                    </div>
                  )}
                  <div className="text-white"><span className="text-slate-500">Referencia: </span>{paymentPayload.reference}</div>
                  {paymentPayload.clabe && <div className="text-white"><span className="text-slate-500">CLABE: </span>{paymentPayload.clabe}</div>}
                  {paymentPayload.bank && <div className="text-white"><span className="text-slate-500">Banco: </span>{paymentPayload.bank}</div>}
                  {paymentPayload.expires_at && <div className="text-white"><span className="text-slate-500">Vence: </span>{paymentPayload.expires_at}</div>}
                  {paymentPayload.barcode_url && (
                    <a href={paymentPayload.barcode_url} target="_blank" rel="noreferrer" className="text-[#0076A3] underline block mt-2">
                      Ver código de barras / PDF
                    </a>
                  )}
                </div>
              )}

              {paymentPayload.billing_mode === 'subscription' && (
                <p className="text-xs text-slate-500 mb-4">
                  Suscripción activa en Openpay. Los cargos se renovarán automáticamente según el ciclo
                  de tu plan (mensual o anual).
                  {(paymentPayload.subscription_id || order?.openpay_subscription_id || query.order_id) && (
                    <span className="block mt-2 text-slate-500">
                      ID de suscripción:{' '}
                      <span className="font-mono text-slate-400">
                        {paymentPayload.subscription_id
                          || order?.openpay_subscription_id
                          || query.order_id}
                      </span>
                      {' '}
                      — cancelar en{' '}
                      <a
                        href={appUrl('/cancelar-suscripcion')}
                        className="text-[#0076A3] hover:underline"
                      >
                        /precios/#/cancelar-suscripcion
                      </a>
                    </span>
                  )}
                </p>
              )}

              <p className="text-[10px] text-slate-600 uppercase tracking-widest">Openpay · IMCYC</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConfirmationPage;
