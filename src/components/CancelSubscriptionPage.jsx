import React, { useState } from 'react';
import { AlertCircle, ArrowLeft, CheckCircle, Loader2, Mail, Hash } from 'lucide-react';
import { apiClient } from '../api/client';
import { appUrl } from '../utils/routes';
import { IMCYC_LOGO_SVG } from '../constants/branding';

const inputClass =
  'w-full px-4 py-3 rounded-xl bg-[#0D0D0D] border border-[#2A2A2A] text-white placeholder:text-[#808080] focus:outline-none focus:ring-2 focus:ring-[#0076A3] focus:border-[#0076A3] transition-colors';

const labelClass = 'block text-sm font-medium text-[#B3B3B3] mb-1.5';

const CancelSubscriptionPage = () => {
  const [email, setEmail] = useState('');
  const [subscriptionId, setSubscriptionId] = useState('');
  const [confirm, setConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [subscriptions, setSubscriptions] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);

  const lookupSubscriptions = async () => {
    const trimmed = email.trim();
    if (!trimmed) return;
    setLookupLoading(true);
    setError('');
    try {
      const res = await apiClient.get(
        `/cancel-membership-subscription.php?email=${encodeURIComponent(trimmed)}`
      );
      const list = res.data?.subscriptions || [];
      setSubscriptions(list);
      if (list.length === 1 && !subscriptionId) {
        setSubscriptionId(list[0].subscription_id || list[0].order_id || '');
      }
    } catch (err) {
      setSubscriptions([]);
      setError(err.message || 'No se pudo consultar suscripciones');
    } finally {
      setLookupLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(null);

    if (!confirm) {
      setError('Debes confirmar que deseas cancelar la suscripción');
      return;
    }

    setLoading(true);
    try {
      const res = await apiClient.post('/cancel-membership-subscription.php', {
        email: email.trim(),
        subscription_id: subscriptionId.trim(),
      });
      setSuccess(res.data || res.message);
      setSubscriptions([]);
    } catch (err) {
      setError(err.message || 'No se pudo cancelar la suscripción');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white py-12 px-4">
      <div className="max-w-md mx-auto">
        <div className="mb-8 flex justify-center">
          <img
            src={IMCYC_LOGO_SVG}
            alt="IMCYC"
            className="h-12"
          />
        </div>

        <h1 className="text-2xl font-bold text-center mb-2">Cancelar suscripción</h1>
        <p className="text-[#B3B3B3] text-center text-sm mb-8">
          Los cargos recurrentes en Openpay se detendrán de inmediato. Usa el mismo correo
          y el ID de suscripción de tu confirmación de pago.
        </p>

        {success ? (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-center">
            <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
            <p className="font-semibold text-emerald-300 mb-2">Suscripción cancelada</p>
            <p className="text-sm text-[#B3B3B3]">
              No se realizarán más cargos automáticos a tu tarjeta.
            </p>
            {success.subscription_id && (
              <p className="text-xs text-[#808080] mt-4 font-mono">
                ID: {success.subscription_id}
              </p>
            )}
            <a
              href={appUrl('/')}
              className="inline-flex items-center gap-2 mt-6 text-[#0076A3] hover:text-[#0099CC] text-sm"
            >
              <ArrowLeft size={16} />
              Volver a membresías
            </a>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-[#2A2A2A] bg-[#1A1A1A] p-6 space-y-5"
          >
            {error && (
              <div className="flex gap-3 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className={labelClass} htmlFor="cancel-email">
                Correo electrónico
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#808080]" />
                <input
                  id="cancel-email"
                  type="email"
                  required
                  autoComplete="email"
                  className={`${inputClass} pl-11`}
                  placeholder="correo@ejemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={lookupSubscriptions}
                />
              </div>
            </div>

            <div>
              <label className={labelClass} htmlFor="cancel-sub-id">
                ID de suscripción
              </label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#808080]" />
                <input
                  id="cancel-sub-id"
                  type="text"
                  required
                  className={`${inputClass} pl-11 font-mono text-sm`}
                  placeholder="Ej. s0gmyor4yqtyv1miqwr0"
                  value={subscriptionId}
                  onChange={(e) => setSubscriptionId(e.target.value)}
                />
              </div>
              <p className="text-xs text-[#808080] mt-1.5">
                Lo encuentras en la página de confirmación tras contratar la membresía.
              </p>
            </div>

            {lookupLoading && (
              <p className="text-sm text-[#808080] flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Buscando suscripciones…
              </p>
            )}

            {!lookupLoading && subscriptions.length > 1 && (
              <div className="rounded-xl border border-[#2A2A2A] bg-[#0D0D0D] p-3 space-y-2">
                <p className="text-xs text-[#B3B3B3]">Selecciona la suscripción a cancelar:</p>
                {subscriptions.map((sub) => {
                  const id = sub.subscription_id || sub.order_id;
                  const selected = subscriptionId === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setSubscriptionId(id)}
                      className={`w-full text-left rounded-lg px-3 py-2 text-sm border transition-colors ${
                        selected
                          ? 'border-[#0076A3] bg-[#0076A3]/10'
                          : 'border-[#2A2A2A] hover:border-[#3A3A3A]'
                      }`}
                    >
                      <span className="font-mono text-xs text-[#808080]">{id}</span>
                      <span className="block text-[#B3B3B3]">
                        {sub.plan_key} · ${sub.amount}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            <label className="flex items-start gap-3 cursor-pointer text-sm text-[#B3B3B3]">
              <input
                type="checkbox"
                checked={confirm}
                onChange={(e) => setConfirm(e.target.checked)}
                className="mt-1 rounded border-[#2A2A2A] bg-[#0D0D0D] text-[#0076A3] focus:ring-[#0076A3]"
              />
              <span>
                Confirmo que deseo cancelar mi suscripción y entiendo que no habrá reembolso
                de periodos ya cobrados.
              </span>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl font-semibold bg-[#0076A3] hover:bg-[#0099CC] disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Cancelando…
                </>
              ) : (
                'Cancelar suscripción'
              )}
            </button>

            <a
              href={appUrl('/')}
              className="block text-center text-sm text-[#808080] hover:text-[#B3B3B3]"
            >
              Volver sin cancelar
            </a>
          </form>
        )}
      </div>
    </div>
  );
};

export default CancelSubscriptionPage;
