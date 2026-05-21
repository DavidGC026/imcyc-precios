import React from 'react';
import { XCircle, ArrowLeft } from 'lucide-react';

const CancelPage = () => {
    return (
        <div className="min-h-screen bg-dark-bg flex items-center justify-center px-4">
            <div className="max-w-md w-full bg-card-dark border border-border-dark rounded-2xl p-8 text-center animate-fade-in">
                <div className="flex justify-center mb-6">
                    <div className="bg-red-500/10 p-3 rounded-full">
                        <XCircle className="w-16 h-16 text-red-500" />
                    </div>
                </div>
                <h1 className="text-3xl font-bold text-text-primary mb-4">
                    Pago Cancelado
                </h1>
                <p className="text-text-secondary mb-8">
                    El proceso de pago ha sido cancelado. No se ha realizado ningún cargo a tu cuenta. Si tuviste algún problema, por favor intenta de nuevo o contacta a nuestro equipo de soporte.
                </p>
                <div className="space-y-4">
                    <button
                        onClick={() => window.location.href = '/precios/'}
                        className="w-full py-4 px-6 rounded-xl font-semibold border border-imcyc-blue text-imcyc-blue hover:bg-imcyc-blue hover:text-dark-bg transition-all duration-300 flex items-center justify-center gap-2"
                    >
                        <ArrowLeft size={18} />
                        Regresar a los planes
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CancelPage;
