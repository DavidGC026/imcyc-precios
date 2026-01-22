import React, { useEffect, useState } from 'react';
import { X, CreditCard, Landmark, ChevronRight, Banknote } from 'lucide-react';

const PaymentModal = ({ isOpen, onClose, planDetails }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
        } else {
            setTimeout(() => setIsVisible(false), 300);
        }
    }, [isOpen]);

    const handleSelectPayment = (method) => {
        // Redirect to checkout page with query params
        const params = new URLSearchParams({
            plan: planDetails?.name || '',
            price: planDetails?.price || '',
            cycle: planDetails?.billingCycle || '',
            method: method
        });

        // Use window.location for full page (React state would be lost anyway)
        // or history.push if Router was available at this level, but window.location works for now
        window.location.href = `/checkout?${params.toString()}`;
    };

    const formatPrice = (price) => {
        if (!price) return '';
        return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    };

    if (!isOpen && !isVisible) return null;

    return (
        <div
            className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'
                }`}
            role="dialog"
            aria-modal="true"
        >
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Content */}
            <div
                className={`relative bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl transform transition-all duration-300 ${isOpen ? 'scale-100' : 'scale-95'
                    }`}
            >
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-black transition-colors p-2 rounded-full hover:bg-gray-100 z-10"
                    aria-label="Cerrar"
                >
                    <X size={24} />
                </button>

                <div className="text-center mb-8">
                    <div className="bg-blue-500/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CreditCard className="w-8 h-8 text-blue-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Método de Pago</h3>
                    <p className="text-gray-500">
                        {planDetails?.name ? `Plan seleccionado: ${planDetails.name}` : 'Elige cómo deseas realizar tu pago'}
                    </p>
                    {planDetails?.price && (
                        <p className="text-xl font-bold text-blue-600 mt-2">
                            ${formatPrice(planDetails.price)} MXN <span className="text-sm font-normal text-gray-500">/{planDetails.billingCycle === 'monthly' ? 'mes' : 'año'}</span>
                        </p>
                    )}
                </div>

                <div className="space-y-4">
                    <button
                        onClick={() => handleSelectPayment('Transferencia')}
                        className="w-full p-4 rounded-xl border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all duration-300 group text-left flex items-center gap-4"
                    >
                        <div className="bg-blue-100 p-3 rounded-lg group-hover:bg-blue-500 transition-colors duration-300">
                            <Landmark className="w-6 h-6 text-blue-600 group-hover:text-white transition-colors duration-300" />
                        </div>
                        <div>
                            <span className="block font-bold text-gray-900 text-lg">Transferencia</span>
                            <span className="text-sm text-gray-500">SPEI o depósito bancario</span>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-300 ml-auto group-hover:text-blue-500" />
                    </button>

                    <button
                        onClick={() => handleSelectPayment('Efectivo')}
                        className="w-full p-4 rounded-xl border-2 border-gray-200 hover:border-green-500 hover:bg-green-50 transition-all duration-300 group text-left flex items-center gap-4"
                    >
                        <div className="bg-green-100 p-3 rounded-lg group-hover:bg-green-500 transition-colors duration-300">
                            <Banknote className="w-6 h-6 text-green-600 group-hover:text-white transition-colors duration-300" />
                        </div>
                        <div>
                            <span className="block font-bold text-gray-900 text-lg">Efectivo</span>
                            <span className="text-sm text-gray-500">Pago en sucursal o OXXO</span>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-300 ml-auto group-hover:text-green-500" />
                    </button>
                </div>

                <div className="mt-8 text-center bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                    <p className="text-sm text-yellow-800">
                        <strong>Nota:</strong> El pago con tarjeta de momento se encuentra pendiente, pero te notificaremos en cuanto este disponible para que puedas automatizar tus pagos.
                    </p>
                </div>

            </div>
        </div>
    );
};

export default PaymentModal;
