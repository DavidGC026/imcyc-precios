import React, { useState } from 'react';
import { User, Building, Users, AlertCircle } from 'lucide-react';
import PricingCard from './PricingCard';

const PricingSection = () => {
  const [selectedType, setSelectedType] = useState('individual'); // 'individual' | 'membresias'
  const [duoStudents, setDuoStudents] = useState(2); // 2 | 4

  // Función para formatear precios con comas
  const formatPrice = (price) => {
    if (typeof price !== 'number' || isNaN(price)) return price;
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };


  // Datos de los planes
  const plansData = {
    individual: {
      basic: {
        name: 'Profesional',
        paymentLink: 'https://pay.conekta.com/link/b867b825d19a4522a75b88cae3f3f7ec',
        monthlyPrice: 99,
        yearlyPrice: 1089,
        savings: '—',
        features: [
          { text: 'Acceso a IA, IMCYC', included: false },
          { text: <a href="https://grabador.imcyc.com/TiendaImcyc/?section=webinars" target="_blank" rel="noopener noreferrer" className="hover:underline text-imcyc-blue font-bold text-lg">Plataforma En Línea</a>, included: true },
          { text: 'Con anuncios', included: true },
          { text: '20% de descuento para estudiantes y profesores', included: true }
        ]
      },
      expert: {
        name: 'Profesional Plus',
        paymentLink: 'https://pay.conekta.com/link/21e4d57e92ee450b909523127b672ed9',
        monthlyPrice: 299,
        yearlyPrice: 3289,
        savings: '—',
        popular: true,
        features: [
          { text: 'Acceso a IA, IMCYC (incl. 750K créditos)', included: true },
          { text: <span><a href="https://grabador.imcyc.com/TiendaImcyc/?section=webinars" target="_blank" rel="noopener noreferrer" className="hover:underline text-imcyc-blue font-bold text-lg">Plataforma En Línea</a> + contenido adicional</span>, included: true },
          { text: 'Con anuncios ligeros', included: true },
          { text: '10% de descuento en publicaciones', included: true },
          { text: '10% de descuento en enseñanza', included: true }
        ]
      },
      ia: {
        name: 'IA',
        isIACard: true,
        features: []
      },
      info: {
        name: 'Información Importante',
        isInfoCard: true,
        title: 'Lo que NO incluyen los planes',
        monthlyPrice: null,
        yearlyPrice: null,
        features: [
          { text: 'Constancias de aptitud profesional', included: false, info: true },
          { text: 'Certificaciones oficiales de competencia', included: false, info: true },
          { text: 'Exámenes de certificación técnica', included: false, info: true }
        ],
        note: 'Los planes se enfocan en capacitación y desarrollo profesional. Para obtener certificaciones oficiales y ensayos de aptitud, consulta nuestros servicios especializados.'
      }
    },
    membresias: {
      agua: {
        name: 'Agua',
        monthlyPrice: null,
        yearlyPrice: 15000,
        discount: 0,
        savings: '—',
        features: [
          { text: 'Hasta 30 empleados', included: true },
          { text: 'Publicaciones 5% de descuento', included: true },
          { text: 'Acceso a IA, IMCYC (incl. 1M créditos)', included: true },
          { text: 'Logotipo en página web', included: true },
          { text: 'Presencia en redes: 1 publicación/mes', included: true },
          { text: 'Descuento en publicidad 5%', included: true },
          { text: 'Descuento en enseñanza 5%', included: true },
          { text: 'Descuento en pruebas de laboratorio 3%', included: true },
          { text: 'Descuento en viajes técnicos 5%', included: true },
          { text: 'Descuento en sellos de calidad 3%', included: true },
          { text: 'Incluye los beneficios del Plan Profesional Plus', included: true },
        ]
      },
      agregados: {
        name: 'Agregados',
        monthlyPrice: null,
        yearlyPrice: 25000,
        discount: 0,
        savings: '—',
        popular: true,
        features: [
          { text: 'Desde 31, hasta 100 empleados', included: true },
          { text: 'Logotipo en página web', included: true },
          { text: 'Acceso a IA, IMCYC (incl. 2.250M créditos)', included: true },
          { text: 'Presencia en redes: 2 publicación/mes', included: true },
          { text: 'Descuento en publicidad 10%', included: true },
          { text: 'Descuento en enseñanza 10%', included: true },
          { text: 'Descuento en pruebas de laboratorio 5%', included: true },
          { text: 'Descuento en viajes técnicos 10%', included: true },
          { text: 'Descuento en sellos de calidad 5%', included: true },
          { text: 'Incluye los beneficios del Plan Profesional Plus', included: true },
        ]
      },
      concreto: {
        name: 'Concreto',
        monthlyPrice: null,
        yearlyPrice: 35000,
        discount: 0,
        savings: '—',
        features: [
          { text: 'Desde 101, hasta 500 empleados', included: true },
          { text: 'Logotipo en página web', included: true },
          { text: 'Acceso a IA, IMCYC (incl. 4M créditos)', included: true },
          { text: 'Presencia en redes: 3 publicación/mes', included: true },
          { text: 'Descuento en publicidad 15%', included: true },
          { text: 'Descuento en enseñanza 15%', included: true },
          { text: 'Descuento en pruebas de laboratorio 7%', included: true },
          { text: 'Descuento en viajes técnicos 15%', included: true },
          { text: 'Descuento en sellos de calidad 7%', included: true },
          { text: 'Incluye los beneficios del Plan Profesional Plus', included: true },
        ]
      },
      cemento: {
        name: 'Cemento',
        monthlyPrice: null,
        yearlyPrice: 45000,
        discount: 0,
        savings: '—',
        features: [
          { text: 'Más de 500 empleados', included: true },
          { text: 'Logotipo en página web', included: true },
          { text: 'Acceso a IA, IMCYC (incl. 8M créditos)', included: true },
          { text: 'Presencia en redes: 4 publicación/mes', included: true },
          { text: 'Descuento en publicidad 20%', included: true },
          { text: 'Descuento en enseñanza 20%', included: true },
          { text: 'Descuento en pruebas de laboratorio 10%', included: true },
          { text: 'Descuento en viajes técnicos 20%', included: true },
          { text: 'Descuento en sellos de calidad 10%', included: true },
          { text: 'Incluye los beneficios del Plan Profesional', included: true }
        ]
      },
      ia: {
        name: 'IA',
        isIACard: true,
        features: []
      }
    },

    asociaciones: {
      asociaciones: {
        name: 'Asociaciones',
        monthlyPrice: null,
        yearlyPrice: 45000,
        discount: 0,
        savings: '—',
        features: [
          { text: 'Más de 500 empleados', included: true },
          { text: 'Logotipo en página web', included: true },
          { text: 'Presencia en redes: 4 publicación/mes', included: true },
          { text: 'Descuento en publicidad 20%', included: true },
          { text: 'Descuento en enseñanza 20%', included: true },
          { text: 'Descuento en pruebas de laboratorio 10%', included: true },
          { text: 'Descuento en viajes técnicos 20%', included: true },
          { text: 'Descuento en sellos de calidad 10%', included: true },
          { text: 'Incluye los beneficios del Plan Profesional', included: true }
        ]
      },
      ia: {
        name: 'IA',
        isIACard: true,
        features: []
      }
    }
  };

  //Nueva Seccion de Asociaciones

  const currentPlans = plansData[selectedType];

  return (
    <div className="min-h-screen bg-slate-950 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black py-16 px-4">
      <div className="max-w-[1400px] mx-auto">
        {/* Top-left logo */}
        <div className="mb-8">
          <a href="/precios/" className="inline-flex items-center" aria-label="IMCYC Home">
            <img
              src="https://grabador.imcyc.com/TiendaImcyc/Imagenes/logo_imcyc.svg"
              alt="Logo IMCYC"
              className="h-16 w-auto"
              loading="eager"
            />
          </a>
        </div>
        {/* Header */}
        <div className="text-center mb-16 animate-fade-in">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 tracking-tight">
            Precios <span className="text-blue-500">Universidad Digital IMCYC</span>
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-12 font-light">
            Elige el plan perfecto para tu carrera.<br />
            Aprende sin límites y acelera tu crecimiento profesional.
          </p>

          {/* Toggle Selector */}
          <div className="flex justify-center mb-16">
            <div className="bg-slate-900 rounded-full p-2 border border-slate-800 shadow-2xl flex items-center max-w-4xl w-full justify-between px-4 md:px-8">
              <button
                onClick={() => setSelectedType('individual')}
                className={`px-8 py-3 rounded-full text-sm font-bold transition-all duration-300 flex items-center gap-3 ${selectedType === 'individual'
                  ? 'bg-slate-700 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white'
                  }`}
                aria-pressed={selectedType === 'individual'}
              >
                <User size={20} />
                INDIVIDUALES
              </button>

              <div className="hidden md:flex flex-col items-center px-4 opacity-60">
                <p className="text-[10px] uppercase tracking-widest text-blue-400 font-bold mb-0.5">
                  Membresías
                </p>
                <p className="text-[10px] text-slate-400 tracking-wider">
                  PARA EMPRESAS Y PROFESIONALES
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedType('membresias')}
                  className={`px-6 py-3 rounded-full text-sm font-bold transition-all duration-300 flex items-center gap-3 ${selectedType === 'membresias'
                    ? 'bg-slate-700 text-white shadow-lg'
                    : 'text-slate-400 hover:text-white'
                    }`}
                  aria-pressed={selectedType === 'membresias'}
                >
                  <Building size={20} />
                  <span className="hidden md:inline">EMPRESARIALES</span>
                </button>
                <button
                  onClick={() => setSelectedType('asociaciones')}
                  className={`px-6 py-3 rounded-full text-sm font-bold transition-all duration-300 flex items-center gap-3 ${selectedType === 'asociaciones'
                    ? 'bg-slate-700 text-white shadow-lg'
                    : 'text-slate-400 hover:text-white'
                    }`}
                  aria-pressed={selectedType === 'asociaciones'}
                >
                  <Users size={20} />
                  <span className="hidden md:inline">ASOCIACIONES</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="gap-8 mb-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Object.values(currentPlans).map((plan, index) => (
            <PricingCard
              key={plan?.name || index}
              plan={plan}
              type={selectedType}
              duoStudents={duoStudents}
              setDuoStudents={setDuoStudents}
              formatPrice={formatPrice}
              className="animate-slide-up"
              style={{ animationDelay: `${0.1 * (index + 1)}s` }}
            />
          ))}
        </div>


        {/* Alert - Membresías (Blue Info Bar) */}
        <div className="bg-blue-600 rounded-full py-3 px-6 text-center shadow-lg shadow-blue-900/20 mb-12 max-w-4xl mx-auto">
          <p className="text-white text-sm font-medium flex items-center justify-center gap-2">
            <AlertCircle size={18} className="text-white" />
            Importante: Las membresías NO incluyen constancias de aptitud ni certificaciones presenciales.
          </p>
        </div>

        {/* Payment Methods removed as per request */}

        {/* IA Plans */}
        <div className="bg-card-dark rounded-2xl border border-border-dark p-8 mb-16 animate-fade-in">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-text-primary mb-2">
              Inteligencia Artificial IMCYC (se cotiza por separado)
            </h3>
            <p className="text-text-secondary">Costo por persona</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { q: "500K", price: 129 },
              { q: "1.25M", price: 299 },
              { q: "2M", price: 499 },
              { q: "5M", price: 999 },
            ].map((p, idx) => {
              return (
                <div key={idx} className="bg-dark-bg rounded-xl p-6 border border-border-dark text-center">
                  <div className="text-5xl font-bold text-text-primary mb-2">{p.q}</div>
                  <div className="text-text-secondary mb-4">créditos</div>
                  <div className="text-3xl font-bold text-text-primary mb-2">${p.price}</div>
                  <div className="text-text-secondary text-sm">MXN</div>
                </div>
              );
            })}
          </div>

          {/* Additional credits info */}
          <div className="mt-8">
            <div className="bg-blue-500/10 rounded-xl p-4 border border-blue-500/20">
              <p className="text-sm text-text-primary text-center leading-relaxed">
                ¿Necesitas más créditos?<br />
                Puedes adquirir paquetes adicionales, desde tu cuenta.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default PricingSection;