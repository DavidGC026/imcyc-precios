import React, { useEffect, useState } from 'react';
import { X, CreditCard, Landmark, ChevronRight, Banknote } from 'lucide-react';
import { appUrl } from '../utils/routes';

const PaymentModal = ({ isOpen, onClose, planDetails }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) setIsVisible(true);
    else setTimeout(() => setIsVisible(false), 300);
  }, [isOpen]);

  const goCheckout = (method) => {
    const params = new URLSearchParams({
      plan: planDetails?.name || '',
      planKey: planDetails?.planKey || '',
      price: String(planDetails?.price ?? ''),
      cycle: planDetails?.billingCycle || 'yearly',
      method,
    });
    window.location.href = appUrl('/checkout', params.toString());
  };

  const formatPrice = (price) => {
    if (!price) return '';
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  if (!isOpen && !isVisible) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
      role="dialog"
      aria-modal="true"
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div
        className={`relative bg-[#1A1A1A] border border-[#2A2A2A] rounded-[24px] p-8 max-w-md w-full shadow-2xl transform transition-all ${isOpen ? 'scale-100' : 'scale-95'}`}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-full hover:bg-slate-800"
          aria-label="Cerrar"
        >
          <X size={24} />
        </button>

        <div className="text-center mb-8">
          <h3 className="text-2xl font-bold text-white mb-2">Método de pago</h3>
          <p className="text-slate-400">
            {planDetails?.name ? `Plan: ${planDetails.name}` : 'Elige cómo pagar'}
          </p>
          {planDetails?.price != null && (
            <p className="text-2xl font-bold text-[#0076A3] mt-3">
              ${formatPrice(planDetails.price)} MXN
              <span className="text-sm font-normal text-slate-500 block mt-1">
                /{planDetails.billingCycle === 'monthly' ? 'mes' : 'año'}
              </span>
            </p>
          )}
          <p className="text-xs text-slate-500 mt-3">Procesado por Openpay</p>
        </div>

        <div className="space-y-3">
          <button
            type="button"
            onClick={() => goCheckout('Tarjeta')}
            className="w-full p-4 rounded-xl border-2 border-[#2A2A2A] hover:border-[#0076A3] hover:bg-[#0076A3]/10 flex items-center gap-4 text-left group transition-all"
          >
            <div className="bg-[#0076A3]/20 p-3 rounded-lg group-hover:bg-[#0076A3] transition-colors">
              <CreditCard className="w-6 h-6 text-[#1A87B8] group-hover:text-white" />
            </div>
            <div>
              <span className="block font-bold text-white">Tarjeta</span>
              <span className="text-sm text-slate-400">Suscripción o pago único</span>
            </div>
            <ChevronRight className="ml-auto text-slate-600 group-hover:text-[#0076A3]" />
          </button>

          <button
            type="button"
            onClick={() => goCheckout('Transferencia')}
            className="w-full p-4 rounded-xl border-2 border-[#2A2A2A] hover:border-[#0076A3] hover:bg-[#0076A3]/10 flex items-center gap-4 text-left group transition-all"
          >
            <div className="bg-[#0076A3]/20 p-3 rounded-lg group-hover:bg-[#0076A3] transition-colors">
              <Landmark className="w-6 h-6 text-[#1A87B8] group-hover:text-white" />
            </div>
            <div>
              <span className="block font-bold text-white">Transferencia SPEI</span>
              <span className="text-sm text-slate-400">Transferencia bancaria</span>
            </div>
            <ChevronRight className="ml-auto text-slate-600 group-hover:text-[#0076A3]" />
          </button>

          <button
            type="button"
            onClick={() => goCheckout('Efectivo')}
            className="w-full p-4 rounded-xl border-2 border-[#2A2A2A] hover:border-emerald-600 hover:bg-emerald-600/10 flex items-center gap-4 text-left group transition-all"
          >
            <div className="bg-emerald-600/20 p-3 rounded-lg group-hover:bg-emerald-600 transition-colors">
              <Banknote className="w-6 h-6 text-emerald-400 group-hover:text-white" />
            </div>
            <div>
              <span className="block font-bold text-white">Efectivo</span>
              <span className="text-sm text-slate-400">Paynet / tiendas</span>
            </div>
            <ChevronRight className="ml-auto text-slate-600 group-hover:text-emerald-500" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
