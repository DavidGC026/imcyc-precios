import React, { useState } from 'react';
import { Check, X, Star, Users, ArrowRight, Sparkles, AlertCircle, ExternalLink } from 'lucide-react';

const PricingCard = ({
  plan,
  type,
  duoStudents,
  setDuoStudents,
  formatPrice,
  className = '',
  style = {}
}) => {
  const [billingCycle, setBillingCycle] = useState(type === 'individual' ? 'monthly' : 'yearly'); // 'monthly' | 'yearly'

  const isPopular = plan.popular;
  const isInfoCard = plan.isInfoCard;

  // Si es una tarjeta informativa, renderizar layout especial
  if (isInfoCard) {
    return (
      <div
        className={`relative bg-[#172554] rounded-[30px] p-8 transition-all duration-300 ${className}`}
        style={style}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-white/10 p-2 rounded-full">
            <AlertCircle className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-white">Información Importante</h3>
        </div>

        <p className="text-blue-100 font-semibold mb-6">
          Lo que NO incluyen nuestros planes:
        </p>

        <div className="mb-8">
          <ul className="space-y-3">
            {plan.features.map((feature, index) => (
              <li key={index} className="flex items-start gap-3">
                <div className="text-white/60 mt-0.5">
                  <X className="w-5 h-5" strokeWidth={2} />
                </div>
                <span className="text-sm text-blue-50 font-medium">
                  {feature.text}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white/10 rounded-xl p-4 border border-white/5">
          <p className="text-xs text-blue-50 leading-relaxed font-medium">
            {plan.note}
          </p>
        </div>
      </div>
    );
  }

  // Si es la tarjeta de IA, renderizar layout especial con costos
  if (plan.isIACard) {
    return (
      <div
        className={`relative bg-card-dark rounded-2xl border border-border-dark p-8 transition-all duration-300 hover:border-imcyc-blue hover:shadow-2xl hover:shadow-platzi-green/10 animate-scale-hover ${className}`}
        style={style}
      >
        <div className="text-center mb-8">
          <h3 className="text-2xl font-bold text-text-primary mb-2">
            Inteligencia Artificial IMCYC
          </h3>
          <p className="text-text-secondary">Costo por persona</p>
        </div>
        <div className="space-y-4">
          {[
            { q: "500K", price: 129 },
            { q: "1.25M", price: 299 },
            { q: "2M", price: 499 },
            { q: "5M", price: 999 },
          ].map((p, idx) => {
            return (
              <div key={idx} className="bg-dark-bg rounded-xl p-4 border border-border-dark flex items-center justify-between">
                <div className="text-left">
                  <div className="text-2xl font-bold text-text-primary">{p.q}</div>
                  <div className="text-text-secondary text-sm">créditos</div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-text-primary">${p.price}</div>
                  <div className="text-text-secondary text-sm">MXN</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Additional credits info */}
        <div className="mt-6 pt-6 border-t border-border-dark">
          <div className="bg-blue-500/10 rounded-xl p-4 border border-blue-500/20">
            <p className="text-sm text-text-primary text-center leading-relaxed">
              ¿Necesitas más créditos?<br />
              Puedes adquirir paquetes adicionales, desde tu cuenta.
            </p>
          </div>
        </div>
      </div>
    );
  }
  // Consideramos "Duo" cuando los precios vienen por número de personas (objeto)
  const isDuo = (typeof plan.monthlyPrice === 'object' && plan.monthlyPrice !== null) ||
    (typeof plan.yearlyPrice === 'object' && plan.yearlyPrice !== null);

  const getCurrentPrice = () => {
    // Manejar planes con precios por número de personas (objeto)
    if (typeof plan.monthlyPrice === 'object' && plan.monthlyPrice !== null) {
      const seats = duoStudents ?? Number(Object.keys(plan.monthlyPrice)[0]);
      return billingCycle === 'monthly'
        ? plan.monthlyPrice[seats]
        : (typeof plan.yearlyPrice === 'object' ? plan.yearlyPrice[seats] : plan.yearlyPrice);
    }
    // Manejar planes normales
    return billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;
  };

  const getMonthlyEquivalent = () => {
    if (billingCycle === 'yearly') {
      const yearlyPrice = getCurrentPrice();
      return typeof yearlyPrice === 'number' ? Math.round(yearlyPrice / 12) : yearlyPrice;
    }
    return getCurrentPrice();
  };


  // Mostrar mensual o anual solo si hay precios definidos
  const supportsMonthly = plan.monthlyPrice !== null && plan.monthlyPrice !== undefined;
  const supportsYearly = plan.yearlyPrice !== null && plan.yearlyPrice !== undefined;

  const getSavingsText = () => {
    if (billingCycle === 'yearly' && type !== 'membresias') {
      return plan.savings && plan.savings !== '—' ? `Ahorras ${plan.savings}` : null;
    }
    return null;
  };

  const getButtonText = () => {
    if (type !== 'individual') {
      return 'Pagar Ahora';
    }
    return 'Comenzar ahora';
  };


  return (
    <div
      className={`relative bg-slate-900 rounded-[30px] p-8 transition-all duration-300 hover:-translate-y-2 ${className} ${isPopular ? 'ring-2 ring-blue-500 shadow-2xl shadow-blue-900/20' : ''
        }`}
      style={style}
    >
      {/* Popular Badge */}
      {isPopular && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <div className="bg-blue-600 px-4 py-1.5 rounded-full text-white text-sm font-bold flex items-center gap-2 shadow-lg">
            <Star size={16} fill="currentColor" />
            Más popular
          </div>
        </div>
      )}

      {/* Savings Badge */}
      {billingCycle === 'yearly' && (
        <div className="absolute -top-3 -right-3">
          <div className={`px-3 py-1 rounded-full text-white text-xs font-semibold transform rotate-12 shadow-lg ${type === 'membresias' && plan.discount > 0
            ? 'bg-gradient-to-r from-red-500 to-orange-500'
            : 'bg-green-500'
            }`}>
            {type === 'membresias' && plan.discount > 0 ? 'SOLO HOY' : getSavingsText()}
          </div>
        </div>
      )}

      {/* Plan Name */}
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
          {plan.icon && <plan.icon size={26} className="text-white" />}
          {plan.name}
          {isPopular && <Sparkles size={20} className="text-blue-400" />}
        </h3>

        {/* Billing Toggle */}
        {(supportsMonthly || supportsYearly) && (
          <div className="flex items-center gap-2 mb-4 bg-slate-800 p-1 rounded-full w-fit">
            {supportsMonthly && (
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${billingCycle === 'monthly'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white'
                  }`}
                aria-pressed={billingCycle === 'monthly'}
              >
                Mensual
              </button>
            )}
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${billingCycle === 'yearly'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-white'
                }`}
              aria-pressed={billingCycle === 'yearly'}
            >
              Anual
            </button>
          </div>
        )}
      </div>

      {/* Duo Students Selector */}
      {isDuo && duoStudents && setDuoStudents && (
        <div className="mb-6">
          <label className="block text-slate-400 text-sm font-medium mb-3">
            Número de estudiantes:
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => setDuoStudents(2)}
              className={`flex-1 px-3 py-2 rounded-xl border text-sm font-medium transition-all flex items-center justify-center gap-2 ${duoStudents === 2
                ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                : 'border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200'
                }`}
            >
              <Users size={16} />
              2 personas
            </button>
            <button
              onClick={() => setDuoStudents(4)}
              className={`flex-1 px-3 py-2 rounded-xl border text-sm font-medium transition-all flex items-center justify-center gap-2 ${duoStudents === 4
                ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                : 'border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200'
                }`}
            >
              <Users size={16} />
              4 personas
            </button>
          </div>
        </div>
      )}

      {/* Pricing */}
      <div className="mb-8">
        {/* Precio original tachado para membresías */}
        {type === 'membresias' && plan.originalYearlyPrice && billingCycle === 'yearly' && (
          <div className="flex items-baseline gap-3 mb-2">
            <span className="text-2xl text-slate-500 line-through font-medium">
              ${formatPrice ? formatPrice(plan.originalYearlyPrice) : plan.originalYearlyPrice}
            </span>
            <span className="bg-red-500/20 text-red-400 text-xs px-2 py-1 rounded-full font-bold">
              SOLO HOY
            </span>
          </div>
        )}

        <div className="flex items-baseline gap-2">
          {typeof getCurrentPrice() === 'number' && !isNaN(getCurrentPrice()) ? (
            <>
              <span className="text-5xl font-bold text-white tracking-tight">
                ${formatPrice ? formatPrice(getCurrentPrice()) : getCurrentPrice()}
              </span>
              <span className="text-slate-400 font-medium">
                /{billingCycle === 'monthly' ? 'mes' : 'año'}
              </span>
            </>
          ) : (
            <span className="text-3xl font-bold text-white">A medida</span>
          )}
        </div>

        {billingCycle === 'yearly' && typeof getMonthlyEquivalent() === 'number' && !isNaN(getMonthlyEquivalent()) && (
          <p className="text-slate-500 text-sm mt-2 font-medium">
            ${formatPrice ? formatPrice(getMonthlyEquivalent()) : getMonthlyEquivalent()}/mes facturado anualmente
          </p>
        )}

        {getSavingsText() && (
          <p className="text-blue-400 text-sm font-bold mt-2">
            🎉 {getSavingsText()} al pagar anual
          </p>
        )}
      </div>

      {/* Features List */}
      <div className="mb-8">
        <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">
          Lo que incluye:
        </h4>
        <ul className="space-y-4">
          {plan.features.map((feature, index) => (
            <li key={index} className="flex items-start gap-3">
              <div className={`mt-0.5 ${feature.included ? 'text-blue-500' : 'text-slate-600'}`}>
                {feature.included ? (
                  <Check size={18} strokeWidth={3} />
                ) : (
                  <X size={18} strokeWidth={3} />
                )}
              </div>
              <span className={`text-sm font-medium ${feature.included ? 'text-slate-300' : 'text-slate-600 line-through'
                }`}>
                {feature.text}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* CTA Button */}
      <div className="mt-auto">
        <button
          onClick={() => {
            if (plan.paymentLink) {
              window.open(plan.paymentLink, '_blank');
            } else {
              window.open('https://wa.me/+525529098047', '_blank');
            }
          }}
          className="w-full py-3 px-6 rounded-lg font-bold bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-300 flex items-center justify-center gap-2 uppercase text-sm tracking-wide"
          aria-label={`Suscribirse al plan ${plan.name}`}
        >
          {plan.paymentLink ? 'SUSCRIBIRME AHORA' : 'MÁS INFORMACIÓN'}
          <ExternalLink size={16} />
        </button>

      </div>

      {/* Additional Info for Enterprise */}
      {plan.name.includes('Enterprise') && (
        <div className="mt-4 pt-4 border-t border-slate-800">
          <p className="text-slate-500 text-xs text-center font-medium">
            Incluye onboarding personalizado y soporte dedicado
          </p>
        </div>
      )}
    </div>
  );
};

export default PricingCard;