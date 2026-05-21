import React from 'react';
import { CreditCard, Smartphone, Banknote, Shield } from 'lucide-react';

const PaymentMethods = () => {
  const paymentMethods = [
    {
      name: 'Tarjetas de Crédito',
      icon: CreditCard,
      description: 'Visa, MasterCard, American Express',
      color: 'text-blue-400'
    },
    {
      name: 'Pagos Móviles',
      icon: Smartphone,
      description: 'Apple Pay, Google Pay, PayPal',
      color: 'text-imcyc-blue'
    },
    {
      name: 'Transferencia Bancaria',
      icon: Banknote,
      description: 'Transferencias locales e internacionales',
      color: 'text-yellow-400'
    },
    {
      name: 'Pago Seguro',
      icon: Shield,
      description: 'Encriptación SSL de 256 bits',
      color: 'text-imcyc-blue'
    }
  ];

  return (
    <div className="bg-card-dark rounded-2xl border border-border-dark p-8 mb-16 animate-fade-in">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-text-primary mb-2">
          Métodos de Pago Seguros
        </h3>
        <p className="text-text-secondary">
          Elige la forma de pago que más te convenga. Todos nuestros pagos son 100% seguros.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {paymentMethods.map((method, index) => (
          <div
            key={index}
            className="flex flex-col items-center text-center p-6 rounded-xl bg-dark-bg border border-border-dark hover:border-text-secondary transition-all duration-300 group"
          >
            <div className={`${method.color} mb-4 group-hover:scale-110 transition-transform duration-300`}>
              <method.icon size={32} strokeWidth={1.5} />
            </div>
            <h4 className="font-semibold text-text-primary mb-2">
              {method.name}
            </h4>
            <p className="text-text-muted text-sm">
              {method.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PaymentMethods;