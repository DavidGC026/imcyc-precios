import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  CreditCard, Landmark, Banknote, ShieldCheck, ChevronRight, ArrowLeft, Clock, Phone, Loader2, AlertCircle, User, Mail,
} from 'lucide-react';
import { apiClient } from '../api/client';
import { appUrl, getAppSearchParams } from '../utils/routes';
import { planNameToSlug } from '../utils/planSlug';
import { IMCYC_LOGO_SVG } from '../constants/branding';

const METHODS = [
  { id: 'card', label: 'Tarjeta', icon: CreditCard, param: 'Tarjeta' },
  { id: 'transfer', label: 'Transferencia SPEI', icon: Landmark, param: 'Transferencia' },
  { id: 'cash', label: 'Efectivo', icon: Banknote, param: 'Efectivo' },
];

const inputClass =
  'w-full px-4 py-3 rounded-xl bg-[#0D0D0D] border border-[#2A2A2A] text-white placeholder:text-[#808080] focus:outline-none focus:ring-2 focus:ring-[#0076A3] focus:border-[#0076A3] transition-colors';

const labelClass = 'block text-sm font-medium text-[#B3B3B3] mb-1.5';

const CheckoutPage = () => {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '' });
  const [queryParams, setQueryParams] = useState({
    plan: '', planKey: '', price: '', cycle: 'monthly', method: 'Tarjeta',
  });
  const [openpayReady, setOpenpayReady] = useState(false);
  const [openpayLoading, setOpenpayLoading] = useState(false);
  const [openpayError, setOpenpayError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [deviceSessionId, setDeviceSessionId] = useState('');
  const [cardForm, setCardForm] = useState({
    holderName: '', cardNumber: '', expirationMonth: '', expirationYear: '', cvv2: '',
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [useSubscription, setUseSubscription] = useState(true);
  const [acceptedRecurringTerms, setAcceptedRecurringTerms] = useState(false);
  const paymentLockRef = useRef(false);

  const paymentMethod = METHODS.find((m) => m.param === queryParams.method)?.id
    || METHODS.find((m) => m.id === queryParams.method)?.id
    || 'card';
  const isCard = paymentMethod === 'card';

  const readQueryFromUrl = useCallback(() => {
    const params = getAppSearchParams();
    const cycle = params.get('cycle') || 'yearly';
    const planName = params.get('plan') || '';
    const method = params.get('method') || 'Tarjeta';
    setQueryParams({
      plan: planName,
      planKey: params.get('planKey') || planNameToSlug(planName),
      price: params.get('price') || '',
      cycle,
      method,
    });
    setUseSubscription(true);
  }, []);

  useEffect(() => {
    readQueryFromUrl();
    window.addEventListener('popstate', readQueryFromUrl);
    window.addEventListener('hashchange', readQueryFromUrl);
    return () => {
      window.removeEventListener('popstate', readQueryFromUrl);
      window.removeEventListener('hashchange', readQueryFromUrl);
    };
  }, [readQueryFromUrl]);

  const setPaymentMethod = (methodId) => {
    const meta = METHODS.find((m) => m.id === methodId);
    if (!meta) return;
    const params = getAppSearchParams();
    params.set('method', meta.param);
    window.history.replaceState({}, '', appUrl('/checkout', params.toString()));
    setQueryParams((prev) => ({ ...prev, method: meta.param }));
    setSubmitError('');
  };

  useEffect(() => {
    if (!isCard) {
      setOpenpayReady(false);
      setOpenpayError('');
      return undefined;
    }

    let cancelled = false;
    setOpenpayLoading(true);
    setOpenpayError('');

    const loadScript = (src) => new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[src="${src}"]`);
      if (existing) {
        if (existing.getAttribute('data-loaded') === '1') {
          resolve();
          return;
        }
        existing.addEventListener('load', resolve, { once: true });
        existing.addEventListener('error', () => reject(new Error(`No se pudo cargar ${src}`)), { once: true });
        return;
      }
      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.onload = () => {
        script.setAttribute('data-loaded', '1');
        resolve();
      };
      script.onerror = () => reject(new Error(`No se pudo cargar ${src}`));
      document.body.appendChild(script);
    });

    const waitForOpenPay = () => new Promise((resolve, reject) => {
      let attempts = 0;
      const tick = () => {
        if (window.OpenPay?.setId) {
          resolve();
          return;
        }
        if (attempts++ > 40) {
          reject(new Error('Openpay no respondió a tiempo'));
          return;
        }
        setTimeout(tick, 100);
      };
      tick();
    });

    const initOpenpay = async () => {
      try {
        const res = await apiClient.get('/openpay-config.php');
        const config = res.data;
        if (!config?.merchant_id || !config?.public_key) {
          throw new Error(res.message || 'Configuración Openpay incompleta');
        }
        await loadScript('https://openpay.s3.amazonaws.com/openpay.v1.min.js');
        await loadScript('https://openpay.s3.amazonaws.com/openpay-data.v1.min.js');
        await waitForOpenPay();
        if (cancelled) return;

        window.OpenPay.setId(config.merchant_id);
        window.OpenPay.setApiKey(config.public_key);
        window.OpenPay.setSandboxMode(Boolean(config.sandbox));
        setOpenpayReady(true);
        setOpenpayError('');
      } catch (err) {
        if (!cancelled) {
          setOpenpayError(err.message || 'No se pudo cargar Openpay para pagos con tarjeta.');
          setOpenpayReady(false);
        }
      } finally {
        if (!cancelled) setOpenpayLoading(false);
      }
    };

    initOpenpay();
    return () => { cancelled = true; };
  }, [isCard]);

  useEffect(() => {
    if (!isCard || !openpayReady || !window.OpenPay?.deviceData) return undefined;
    const timer = setTimeout(() => {
      try {
        const id = window.OpenPay.deviceData.setup('card-payment-form', 'device_session_id');
        const hidden = document.getElementById('device_session_id')?.value;
        setDeviceSessionId(id || hidden || '');
      } catch (e) {
        console.error('device_session_id:', e);
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [isCard, openpayReady, cardForm.cardNumber]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setSubmitError('');
  };

  const handleCardFieldChange = (field, value) => {
    if (field === 'holderName') {
      setCardForm((c) => ({ ...c, holderName: value.replace(/[^a-zA-ZÀ-ÿ\u00f1\u00d1\s'.-]/g, '').slice(0, 80) }));
      return;
    }
    const numeric = ['cardNumber', 'expirationMonth', 'expirationYear', 'cvv2'];
    const cleaned = numeric.includes(field) ? value.replace(/\D/g, '') : value;
    const limits = { cardNumber: 16, expirationMonth: 2, expirationYear: 2, cvv2: 4 };
    setCardForm((c) => ({
      ...c,
      [field]: limits[field] ? cleaned.slice(0, limits[field]) : cleaned,
    }));
    setSubmitError('');
  };

  const normalizeDecline = (message) => {
    const raw = String(message || '').toLowerCase();
    if (raw.includes('3005') || raw.includes('already been processed') || raw.includes('ya fue procesada')) {
      return 'Esta operación ya fue procesada. Revisa tu correo o la página de confirmación antes de volver a pagar.';
    }
    if (raw.includes('fondos') || raw.includes('insufficient') || raw.includes('stolen') || raw.includes('lost')) {
      return 'Tarjeta declinada. Verifica los datos o intenta con otra tarjeta.';
    }
    return message || 'No se pudo procesar el pago';
  };

  const createToken = () => new Promise((resolve, reject) => {
    if (!window.OpenPay?.token) {
      reject(new Error('Openpay no está listo'));
      return;
    }
    const { holderName, cardNumber, expirationMonth, expirationYear, cvv2 } = cardForm;
    if (!holderName.trim() || !cardNumber || !expirationMonth || !expirationYear || !cvv2) {
      reject(new Error('Completa todos los datos de la tarjeta'));
      return;
    }
    window.OpenPay.token.create(
      {
        card_number: cardNumber,
        holder_name: holderName.trim(),
        expiration_year: expirationYear,
        expiration_month: expirationMonth,
        cvv2,
      },
      (r) => resolve(r.data.id),
      (err) => reject(new Error(normalizeDecline(err.data?.description)))
    );
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (paymentLockRef.current) return;
    paymentLockRef.current = true;
    setIsProcessing(true);
    setSubmitError('');

    try {
      if (isCard && useSubscription && !acceptedRecurringTerms) {
        throw new Error('Debes aceptar el aviso de cobro recurrente para continuar con la suscripción.');
      }

      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.replace(/\D/g, '') || '0000000000',
        plan_key: queryParams.planKey,
        cycle: queryParams.cycle,
        billing_mode: useSubscription ? 'subscription' : 'one_time',
      };

      let endpoint = '/process-membership-transfer.php';
      if (paymentMethod === 'card') endpoint = '/process-membership-card.php';
      if (paymentMethod === 'cash') endpoint = '/process-membership-cash.php';

      if (paymentMethod === 'card') {
        if (!openpayReady) throw new Error(openpayError || 'Espera a que cargue el formulario seguro de tarjeta.');
        payload.token_id = await createToken();
        payload.device_session_id = deviceSessionId || document.getElementById('device_session_id')?.value;
        if (!payload.device_session_id) throw new Error('Sesión segura de Openpay no disponible. Recarga la página.');
      }

      const res = await apiClient.post(endpoint, payload);
      const result = res.data;

      sessionStorage.setItem('membership_payment_result', JSON.stringify(result));

      if (result.requires_action && result.action_url) {
        window.location.href = result.action_url;
        return;
      }

      const status = result.status || 'pendiente';
      window.location.href = appUrl('/confirmacion', `order_id=${encodeURIComponent(result.order_id)}&method=${paymentMethod}&status=${status}`);
    } catch (err) {
      setSubmitError(normalizeDecline(err.message));
    } finally {
      setIsProcessing(false);
      paymentLockRef.current = false;
    }
  };

  const formatPrice = (price) => {
    if (!price) return '0';
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  const cycleLabel = queryParams.cycle === 'monthly' ? 'Mensual' : 'Anual';
  const isYearly = queryParams.cycle === 'yearly';
  const subscriptionPeriodLabel = isYearly ? 'anual' : 'mensual';
  const subscriptionChargeHint = isYearly
    ? 'cobro automático cada año'
    : 'cobro automático cada mes';
  const needsRecurringConsent = isCard && useSubscription;
  const canSubmit = !isProcessing
    && (!isCard || (openpayReady && !openpayLoading))
    && (!needsRecurringConsent || acceptedRecurringTerms);

  return (
    <div className="min-h-screen bg-slate-950 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black py-10 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8 flex justify-center">
          <a href={appUrl('/')} aria-label="IMCYC">
            <img
              src={IMCYC_LOGO_SVG}
              alt="Logo IMCYC"
              className="h-16 w-auto"
            />
          </a>
        </div>

        <a
          href={appUrl('/')}
          className="text-[#0076A3] hover:text-white transition-colors inline-flex items-center gap-2 mb-6 text-sm font-medium"
        >
          <ArrowLeft size={18} />
          Volver a precios
        </a>

        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
          Finalizar <span className="text-blue-500">membresía</span>
        </h1>
        <p className="text-slate-400 mb-8">Pago seguro procesado por Openpay</p>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3">
            <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-[24px] p-6 md:p-8 shadow-2xl">
              <div className="flex flex-wrap gap-2 mb-8 p-1 bg-[#0D0D0D] rounded-full border border-[#2A2A2A]">
                {METHODS.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setPaymentMethod(id)}
                    className={`flex-1 min-w-[100px] flex items-center justify-center gap-2 px-3 py-2.5 rounded-full text-xs font-bold transition-all ${
                      paymentMethod === id
                        ? 'bg-[#0076A3] text-white shadow-lg shadow-blue-900/30'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                    }`}
                  >
                    <Icon size={16} />
                    {label}
                  </button>
                ))}
              </div>

              {submitError && (
                <div className="mb-6 flex gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
                  <AlertCircle className="flex-shrink-0" size={20} />
                  <span>{submitError}</span>
                </div>
              )}

              <form id="card-payment-form" onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="name" className={labelClass}>Nombre completo</label>
                  <div className="relative">
                    <User size={18} className="absolute left-3 top-3.5 text-[#808080]" />
                    <input
                      type="text"
                      id="name"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleInputChange}
                      className={`${inputClass} pl-10`}
                      placeholder="Ej. Juan Pérez"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className={labelClass}>Correo electrónico</label>
                  <div className="relative">
                    <Mail size={18} className="absolute left-3 top-3.5 text-[#808080]" />
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`${inputClass} pl-10`}
                      placeholder="tucorreo@ejemplo.com"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="phone" className={labelClass}>Teléfono</label>
                  <div className="relative">
                    <Phone size={18} className="absolute left-3 top-3.5 text-[#808080]" />
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className={`${inputClass} pl-10`}
                      placeholder="55 1234 5678"
                    />
                  </div>
                </div>

                {isCard && (
                  <div className="rounded-xl border border-[#2A2A2A] bg-[#0D0D0D]/80 p-5 space-y-4">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-white flex items-center gap-2">
                        <CreditCard size={18} className="text-[#0076A3]" />
                        Datos de tarjeta
                      </p>
                      {openpayLoading && (
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Loader2 size={14} className="animate-spin" /> Cargando…
                        </span>
                      )}
                      {openpayReady && !openpayLoading && (
                        <span className="text-xs text-emerald-400 flex items-center gap-1">
                          <ShieldCheck size={14} /> Seguro
                        </span>
                      )}
                    </div>

                    {openpayError && (
                      <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                        {openpayError}
                      </p>
                    )}

                    <input
                      type="text"
                      autoComplete="cc-name"
                      placeholder="Nombre como aparece en la tarjeta"
                      value={cardForm.holderName}
                      onChange={(e) => handleCardFieldChange('holderName', e.target.value)}
                      className={inputClass}
                      required
                      disabled={!openpayReady}
                    />
                    <input
                      type="text"
                      inputMode="numeric"
                      autoComplete="cc-number"
                      placeholder="Número de tarjeta"
                      value={cardForm.cardNumber}
                      onChange={(e) => handleCardFieldChange('cardNumber', e.target.value)}
                      className={inputClass}
                      required
                      disabled={!openpayReady}
                    />
                    <div className="grid grid-cols-3 gap-3">
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="MM"
                        value={cardForm.expirationMonth}
                        onChange={(e) => handleCardFieldChange('expirationMonth', e.target.value)}
                        className={inputClass}
                        required
                        disabled={!openpayReady}
                      />
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="AA"
                        value={cardForm.expirationYear}
                        onChange={(e) => handleCardFieldChange('expirationYear', e.target.value)}
                        className={inputClass}
                        required
                        disabled={!openpayReady}
                      />
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="CVV"
                        value={cardForm.cvv2}
                        onChange={(e) => handleCardFieldChange('cvv2', e.target.value)}
                        className={inputClass}
                        required
                        disabled={!openpayReady}
                      />
                    </div>
                    <input type="hidden" id="device_session_id" name="device_session_id" />

                    <label className="flex items-start gap-3 text-xs text-slate-400 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={useSubscription}
                        onChange={(e) => {
                          setUseSubscription(e.target.checked);
                          if (!e.target.checked) setAcceptedRecurringTerms(false);
                        }}
                        className="mt-0.5 rounded border-slate-600 text-[#0076A3] focus:ring-[#0076A3]"
                      />
                      <span>
                        Activar <strong className="text-white">suscripción {subscriptionPeriodLabel}</strong>{' '}
                        ({subscriptionChargeHint} vía Openpay).
                        Desmarca para un solo pago del periodo completo.
                      </span>
                    </label>

                    {useSubscription && (
                      <label className="flex items-start gap-3 text-xs text-slate-400 cursor-pointer border border-[#2A2A2A] rounded-xl p-3 bg-[#0D0D0D]/80">
                        <input
                          type="checkbox"
                          checked={acceptedRecurringTerms}
                          onChange={(e) => setAcceptedRecurringTerms(e.target.checked)}
                          className="mt-0.5 rounded border-slate-600 text-[#0076A3] focus:ring-[#0076A3]"
                          required={useSubscription}
                        />
                        <span>
                          Autorizo a IMCYC el <strong className="text-white">cobro recurrente</strong> en mi tarjeta
                          {' '}
                          ({subscriptionChargeHint}) por el plan seleccionado, procesado por Openpay, hasta que cancele
                          mi suscripción en{' '}
                          <a href={appUrl('/cancelar-suscripcion')} className="text-[#0076A3] hover:underline">
                            cancelar suscripción
                          </a>
                          .
                        </span>
                      </label>
                    )}
                  </div>
                )}

                {!isCard && (
                  <div className="flex gap-3 p-4 rounded-xl bg-[#0076A3]/10 border border-[#0076A3]/30">
                    <Clock className="w-5 h-5 text-[#1A87B8] flex-shrink-0" />
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {paymentMethod === 'cash'
                        ? 'Al continuar recibirás referencia para pagar en tiendas de conveniencia (Paynet). Tu membresía se activa al confirmar el pago.'
                        : 'Al continuar recibirás CLABE y referencia SPEI. Tu membresía se activa al confirmar la transferencia.'}
                    </p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="w-full bg-[#0076A3] hover:bg-[#005578] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-900/25"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      Procesando…
                    </>
                  ) : (
                    <>
                      {isCard ? 'Pagar con tarjeta' : paymentMethod === 'cash' ? 'Generar referencia' : 'Generar datos SPEI'}
                      <ChevronRight size={20} />
                    </>
                  )}
                </button>
              </form>

              <p className="text-xs text-[#808080] flex items-center justify-center gap-2 mt-6">
                <ShieldCheck size={14} className="text-[#0076A3]" />
                No almacenamos datos de tarjeta · Encriptación Openpay
              </p>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-[24px] p-6 md:p-8 sticky top-8">
              <h3 className="text-lg font-bold text-white mb-6 uppercase tracking-wider text-center">
                Resumen
              </h3>
              <div className="space-y-4 text-sm">
                <div className="flex justify-between py-3 border-b border-[#2A2A2A]">
                  <span className="text-[#B3B3B3]">Plan</span>
                  <span className="font-bold text-white text-right max-w-[55%]">{queryParams.plan}</span>
                </div>
                <div className="flex justify-between py-3 border-b border-[#2A2A2A]">
                  <span className="text-[#B3B3B3]">Ciclo</span>
                  <span className="text-white font-medium">{cycleLabel}</span>
                </div>
                <div className="flex justify-between py-3 border-b border-[#2A2A2A]">
                  <span className="text-[#B3B3B3]">Método</span>
                  <span className="flex items-center gap-2 text-white font-medium">
                    {paymentMethod === 'transfer' && <Landmark size={16} className="text-[#0076A3]" />}
                    {paymentMethod === 'cash' && <Banknote size={16} className="text-emerald-400" />}
                    {paymentMethod === 'card' && <CreditCard size={16} className="text-[#0076A3]" />}
                    {queryParams.method}
                  </span>
                </div>
                {isCard && (
                  <div className="flex justify-between py-3 border-b border-[#2A2A2A]">
                    <span className="text-[#B3B3B3]">Modalidad</span>
                    <span className="text-white text-xs font-medium text-right max-w-[55%]">
                      {useSubscription
                        ? `Suscripción ${subscriptionPeriodLabel} (recurrente)`
                        : `Pago único ${subscriptionPeriodLabel}`}
                    </span>
                  </div>
                )}
                <div className="pt-4">
                  <div className="flex justify-between items-baseline">
                    <span className="text-[#B3B3B3] text-base">Total</span>
                    <span className="text-3xl font-bold text-[#0076A3]">
                      ${formatPrice(queryParams.price)}
                      <span className="text-sm font-normal text-[#808080] ml-1">MXN</span>
                    </span>
                  </div>
                  <p className="text-xs text-[#808080] mt-2 text-right">
                    + IVA si aplica según facturación
                  </p>
                </div>
              </div>
              <div className="mt-6 pt-6 border-t border-[#2A2A2A] flex flex-wrap justify-center gap-3 opacity-80">
                <span className="text-[10px] text-slate-500 uppercase tracking-widest">Visa</span>
                <span className="text-[10px] text-slate-500 uppercase tracking-widest">Mastercard</span>
                <span className="text-[10px] text-slate-500 uppercase tracking-widest">Amex</span>
                <span className="text-[10px] text-slate-500 uppercase tracking-widest">SPEI</span>
                <span className="text-[10px] text-slate-500 uppercase tracking-widest">OXXO</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
