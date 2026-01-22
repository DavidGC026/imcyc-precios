import React from 'react';
import { CheckCircle, ArrowRight } from 'lucide-react';

const SuccessPage = () => {
    return (
        <div className="min-h-screen bg-dark-bg flex items-center justify-center px-4">
            <div className="max-w-md w-full bg-card-dark border border-border-dark rounded-2xl p-8 text-center animate-fade-in">
                <div className="flex justify-center mb-6">
                    <div className="bg-green-500/10 p-3 rounded-full">
                        <CheckCircle className="w-16 h-16 text-green-500" />
                    </div>
                </div>
                <h1 className="text-3xl font-bold text-text-primary mb-4">
                    ¡Pago Exitoso!
                </h1>
                <p className="text-text-secondary mb-8">
                    Gracias por suscribirte. Tu membresía ahora está activa y puedes comenzar a disfrutar de todos los beneficios de la Universidad Digital IMCYC.
                </p>
                <div className="space-y-4">
                    <button
                        onClick={() => window.location.href = '/precios/'}
                        className="w-full py-4 px-6 rounded-xl font-semibold bg-imcyc-blue text-dark-bg hover:bg-imcyc-blue-light transition-all duration-300 flex items-center justify-center gap-2"
                    >
                        Ir a mis cursos
                        <ArrowRight size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SuccessPage;
