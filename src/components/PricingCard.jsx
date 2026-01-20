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
        className={`relative bg-gradient-to-br from-amber-50 to-orange-100 rounded-2xl border-2 border-amber-300 p-8 transition-all duration-300 ${className}`}
        style={style}
      >
        <div className="text-center mb-6">
          <div className="bg-amber-200 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-amber-600" />
          </div>
          <h3 className="text-xl font-bold text-amber-900 mb-2">{plan.name}</h3>
          <p className="text-amber-800 font-semibold">{plan.title}</p>
        </div>

        <div className="mb-6">
          <ul className="space-y-3">
            {plan.features.map((feature, index) => (
              <li key={index} className="flex items-start gap-3">
                <div className="text-amber-600 mt-0.5">
                  <X className="w-5 h-5" strokeWidth={2} />
                </div>
                <span className="text-sm text-amber-800 font-medium">
                  {feature.text}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-amber-200 rounded-xl p-4 border border-amber-300 mb-6">
          <p className="text-xs text-amber-900 leading-relaxed">
            {plan.note}
          </p>
        </div>

        <div>
          <button
            onClick={() => window.open('https://www.imcyc.com.mx', '_blank')}
            className="w-full py-3 px-4 rounded-xl font-semibold bg-amber-300 text-amber-900 hover:bg-amber-400 transition-all duration-300 flex items-center justify-center gap-2 text-sm"
          >
            Consultar Servicios Adicionales
            <ExternalLink className="w-4 h-4" />
          </button>
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
      className={`relative bg-card-dark rounded-2xl border border-border-dark p-8 transition-all duration-300 hover:border-imcyc-blue hover:shadow-2xl hover:shadow-platzi-green/10 animate-scale-hover ${className} ${isPopular ? 'ring-2 ring-imcyc-blue' : ''
        }`}
      style={style}
    >
      {/* Popular Badge */}
      {isPopular && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <div className="bg-gradient-to-r from-imcyc-blue to-imcyc-blue-light px-4 py-2 rounded-full text-dark-bg text-sm font-bold flex items-center gap-2 animate-bounce-subtle">
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
            : 'bg-orange-500'
            }`}>
            {type === 'membresias' && plan.discount > 0 ? 'SOLO HOY' : getSavingsText()}
          </div>
        </div>
      )}

      {/* Plan Name */}
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-text-primary mb-2 flex items-center gap-2">
          {plan.name}
          {isPopular && <Sparkles size={20} className="text-imcyc-blue" />}
        </h3>

        {/* Billing Toggle */}
        {(supportsMonthly || supportsYearly) && (
          <div className="flex items-center gap-3 mb-4">
            {supportsMonthly && (
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${billingCycle === 'monthly'
                  ? 'bg-imcyc-blue text-dark-bg'
                  : 'bg-border-dark text-text-muted hover:text-text-secondary'
                  }`}
                aria-pressed={billingCycle === 'monthly'}
              >
                Mensual
              </button>
            )}
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${billingCycle === 'yearly'
                ? 'bg-imcyc-blue text-dark-bg'
                : 'bg-border-dark text-text-muted hover:text-text-secondary'
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
          <label className="block text-text-secondary text-sm font-medium mb-3">
            Número de estudiantes:
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => setDuoStudents(2)}
              className={`flex-1 px-3 py-2 rounded-lg border text-sm font-medium transition-all flex items-center justify-center gap-2 ${duoStudents === 2
                ? 'border-imcyc-blue bg-imcyc-blue/10 text-imcyc-blue'
                : 'border-border-dark text-text-muted hover:border-text-secondary hover:text-text-secondary'
                }`}
            >
              <Users size={16} />
              2 personas
            </button>
            <button
              onClick={() => setDuoStudents(4)}
              className={`flex-1 px-3 py-2 rounded-lg border text-sm font-medium transition-all flex items-center justify-center gap-2 ${duoStudents === 4
                ? 'border-imcyc-blue bg-imcyc-blue/10 text-imcyc-blue'
                : 'border-border-dark text-text-muted hover:border-text-secondary hover:text-text-secondary'
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
            <span className="text-2xl text-white line-through font-semibold">
              ${formatPrice ? formatPrice(plan.originalYearlyPrice) : plan.originalYearlyPrice}
            </span>
            <span className="bg-red-100 text-red-600 text-xs px-2 py-1 rounded-full font-semibold">
              SOLO HOY
            </span>
          </div>
        )}

        <div className="flex items-baseline gap-2">
          {typeof getCurrentPrice() === 'number' && !isNaN(getCurrentPrice()) ? (
            <>
              <span className="text-4xl font-bold text-text-primary">
                ${formatPrice ? formatPrice(getCurrentPrice()) : getCurrentPrice()}
              </span>
              <span className="text-text-secondary">
                /{billingCycle === 'monthly' ? 'mes' : 'año'}
              </span>
            </>
          ) : (
            <span className="text-2xl md:text-3xl font-semibold text-text-primary">A medida</span>
          )}
        </div>

        {billingCycle === 'yearly' && typeof getMonthlyEquivalent() === 'number' && !isNaN(getMonthlyEquivalent()) && (
          <p className="text-text-muted text-sm mt-1">
            ${formatPrice ? formatPrice(getMonthlyEquivalent()) : getMonthlyEquivalent()}/mes facturado anualmente
          </p>
        )}

        {getSavingsText() && (
          <p className="text-imcyc-blue text-sm font-semibold mt-2">
            🎉 {getSavingsText()} al pagar anual
          </p>
        )}
      </div>

      {/* Features List */}
      <div className="mb-8">
        <h4 className="text-text-primary font-semibold mb-4">
          Lo que incluye:
        </h4>
        <ul className="space-y-3">
          {plan.features.map((feature, index) => (
            <li key={index} className="flex items-start gap-3">
              <div className={`mt-0.5 ${feature.included ? 'text-imcyc-blue' : 'text-text-muted'}`}>
                {feature.included ? (
                  <Check size={18} strokeWidth={2.5} />
                ) : (
                  <X size={18} strokeWidth={2} />
                )}
              </div>
              <span className={`text-sm ${feature.included ? 'text-text-primary' : 'text-text-muted line-through'
                }`}>
                {feature.text}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* CTA Button */}
      <div className="space-y-3">
        <button
          onClick={() => {
            window.open('https://wa.me/+525554671492', '_blank');
          }}
          className={`w-full py-4 px-6 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${isPopular
            ? 'bg-imcyc-blue text-dark-bg hover:bg-imcyc-blue hover:shadow-lg hover:shadow-platzi-green/25'
            : 'bg-card-dark border border-imcyc-blue text-imcyc-blue hover:bg-imcyc-blue hover:text-dark-bg'
            }`}
          aria-label={`Suscribirse al plan ${plan.name}`}
        >
          {getButtonText()}
          <ArrowRight size={18} />
        </button>

      </div>

      {/* Additional Info for Enterprise */}
      {plan.name.includes('Enterprise') && (
        <div className="mt-4 pt-4 border-t border-border-dark">
          <p className="text-text-muted text-xs text-center">
            Incluye onboarding personalizado y soporte dedicado
          </p>
        </div>
      )}
    </div>
  );
};

export default PricingCard;