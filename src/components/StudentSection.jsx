import React from 'react';
import { GraduationCap, BookOpen, Award, Users, ArrowRight, Sparkles } from 'lucide-react';

const StudentSection = () => {
  const studentBenefits = [
    {
      icon: BookOpen,
      title: 'Acceso Completo',
      description: 'Todos los cursos y especializaciones disponibles'
    },
    {
      icon: Award,
      title: 'Certificados Verificados',
      description: 'Certificados que puedes agregar a tu perfil profesional'
    },
    {
      icon: Users,
      title: 'Comunidad Estudiantil',
      description: 'Conecta con miles de estudiantes de todo el mundo'
    }
  ];

  const universities = [
    'Universidad Nacional', 'TEC de Monterrey', 'Universidad de los Andes',
    'Universidad Javeriana', 'UNAM', 'Universidad de Chile'
  ];

  return (
    <div className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 rounded-2xl border border-purple-500/30 p-8 backdrop-blur-sm">
      <div className="text-center mb-8">
        <div className="flex justify-center items-center gap-3 mb-4">
          <GraduationCap size={32} className="text-purple-400" />
          <h3 className="text-3xl font-bold text-text-primary">
            ¿Eres Estudiante Universitario?
          </h3>
          <Sparkles size={24} className="text-purple-400" />
        </div>
        <p className="text-lg text-text-secondary max-w-3xl mx-auto">
          Obtén acceso completo a Platzi con descuentos especiales para estudiantes. 
          Acelera tu carrera mientras estudias.
        </p>
      </div>

      {/* Student Benefits */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {studentBenefits.map((benefit, index) => (
          <div
            key={index}
            className="bg-card-dark/50 rounded-xl p-6 border border-border-dark hover:border-purple-500/50 transition-all duration-300 group"
          >
            <div className="text-purple-400 mb-4 group-hover:scale-110 transition-transform duration-300">
              <benefit.icon size={28} strokeWidth={1.5} />
            </div>
            <h4 className="font-semibold text-text-primary mb-2">
              {benefit.title}
            </h4>
            <p className="text-text-secondary text-sm">
              {benefit.description}
            </p>
          </div>
        ))}
      </div>

      {/* Special Offer */}
      <div className="bg-card-dark rounded-xl p-6 border border-purple-500/50 mb-6">
        <div className="text-center">
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-full text-sm font-bold inline-block mb-4">
            🎓 OFERTA ESTUDIANTES
          </div>
          <h4 className="text-xl font-bold text-text-primary mb-2">
            50% de Descuento en Plan Expert
          </h4>
          <p className="text-text-secondary mb-4">
            Solo $19.50/mes con tu email universitario válido
          </p>
          <button className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:from-purple-700 hover:to-blue-700 transition-all duration-300 flex items-center gap-2 mx-auto">
            Verificar Descuento Estudiantil
            <ArrowRight size={18} />
          </button>
        </div>
      </div>

      {/* Partner Universities */}
      <div className="text-center">
        <p className="text-text-muted text-sm mb-4">
          Universidades aliadas:
        </p>
        <div className="flex flex-wrap justify-center gap-4 text-text-muted text-xs">
          {universities.map((university, index) => (
            <span key={index} className="bg-card-dark/30 px-3 py-1 rounded-full">
              {university}
            </span>
          ))}
        </div>
      </div>

      {/* Requirements */}
      <div className="mt-6 pt-6 border-t border-border-dark">
        <p className="text-text-muted text-xs text-center">
          *Válido solo para estudiantes universitarios activos. Se requiere verificación con email institucional (.edu o similar).
          <br />
          Oferta no acumulable con otras promociones.
        </p>
      </div>
    </div>
  );
};

export default StudentSection;