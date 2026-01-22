import React, { useState, useEffect } from 'react';
import { CreditCard, Landmark, Banknote, ShieldCheck, ChevronRight, User, Mail, ArrowLeft, Clock } from 'lucide-react';

const CheckoutPage = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: ''
    });
    const [queryParams, setQueryParams] = useState({
        plan: '',
        price: '',
        cycle: '',
        method: ''
    });

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        setQueryParams({
            plan: params.get('plan') || '',
            price: params.get('price') || '',
            cycle: params.get('cycle') || '',
            method: params.get('method') || ''
        });
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Here you would handle the actual submission/payment process
        console.log('Procesando pago:', {
            ...queryParams,
            user: formData
        });

        alert(`Gracias ${formData.name}. Hemos registrado tu solicitud de pago en ${queryParams.method} para el plan ${queryParams.plan}. Te contactaremos a ${formData.email}.`);

        // Optional: Redirect to success page
        // window.location.href = '/success';
    };

    const formatPrice = (price) => {
        if (!price) return '';
        return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    };

    return (
        <div className="min-h-screen bg-dark-bg py-12 px-4">
            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <a href="/precios" className="text-imcyc-blue hover:text-white transition-colors flex items-center gap-2 inline-flex">
                        <ArrowLeft size={20} />
                        <span>Volver a precios</span>
                    </a>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Left Column: Form */}
                    <div className="bg-white rounded-2xl p-8 shadow-xl">
                        <div className="text-center mb-8">
                            <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                <User className="w-8 h-8 text-blue-600" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900">Datos de Registro</h2>
                            <p className="text-gray-500 text-sm mt-1">Ingresa tus datos para finalizar la compra</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <User size={18} className="text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        id="name"
                                        name="name"
                                        required
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500 transition-colors bg-gray-50 hover:bg-white"
                                        placeholder="Ej. Juan Pérez"
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Mail size={18} className="text-gray-400" />
                                    </div>
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        required
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500 transition-colors bg-gray-50 hover:bg-white"
                                        placeholder="tucorreo@ejemplo.com"
                                    />
                                </div>
                            </div>

                            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                                <div className="flex gap-3">
                                    <Clock className="w-5 h-5 text-blue-600 flex-shrink-0" />
                                    <div>
                                        <h4 className="font-semibold text-blue-900 text-sm">Pago Automatizado Pendiente</h4>
                                        <p className="text-xs text-blue-800 mt-1 leading-relaxed">
                                            El pago con tarjeta de momento se encuentra pendiente. Te notificaremos en cuanto este disponible para que puedas automatizar tus pagos futuros.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-blue-600 text-white font-bold py-4 px-6 rounded-xl hover:bg-blue-700 transition-all duration-300 shadow-lg hover:shadow-blue-500/30 flex items-center justify-center gap-2 transform hover:scale-[1.02]"
                            >
                                Confirmar Solicitud
                                <ChevronRight size={20} />
                            </button>
                        </form>

                        <div className="mt-6 text-center">
                            <p className="text-xs text-gray-400 flex items-center justify-center gap-2">
                                <ShieldCheck size={16} />
                                Tus datos están protegidos y encriptados
                            </p>
                        </div>
                    </div>

                    {/* Right Column: Order Summary */}
                    <div className="mt-8 md:mt-0">
                        <div className="bg-card-dark rounded-2xl p-8 border border-border-dark sticky top-8">
                            <div className="text-center mb-6">
                                <h3 className="text-xl font-bold text-text-primary">Resumen de Compra</h3>
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center py-4 border-b border-border-dark">
                                    <span className="text-text-secondary">Plan seleccionado</span>
                                    <span className="font-bold text-text-primary text-lg">{queryParams.plan}</span>
                                </div>
                                <div className="flex justify-between items-center py-4 border-b border-border-dark">
                                    <span className="text-text-secondary">Ciclo de facturación</span>
                                    <span className="font-medium text-text-primary capitalized">
                                        {queryParams.cycle === 'monthly' ? 'Mensual' : queryParams.cycle === 'yearly' ? 'Anual' : 'Personalizado'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center py-4 border-b border-border-dark">
                                    <span className="text-text-secondary">Método de pago</span>
                                    <div className="flex items-center gap-2">
                                        {queryParams.method === 'Transferencia' ? (
                                            <Landmark size={16} className="text-imcyc-blue" />
                                        ) : (
                                            <Banknote size={16} className="text-platzi-green" />
                                        )}
                                        <span className="font-medium text-text-primary uppercase">{queryParams.method}</span>
                                    </div>
                                </div>

                                <div className="py-6 mt-2">
                                    <div className="flex justify-between items-baseline">
                                        <span className="text-text-secondary text-lg">Total a pagar</span>
                                        <span className="text-3xl font-bold text-imcyc-blue">
                                            ${formatPrice(queryParams.price)}
                                            <span className="text-sm font-normal text-text-secondary ml-1">MXN</span>
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-dark-bg p-4 rounded-xl border border-border-dark mt-4">
                                <p className="text-xs text-text-muted text-center leading-relaxed">
                                    Al confirmar, aceptas nuestros términos y condiciones y política de privacidad.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CheckoutPage;
