# 💳 Platzi Pricing Section

Una sección de precios moderna y responsive para Platzi, desarrollada con React y TailwindCSS.

## ✨ Características

### 🎨 Diseño
- **Tema oscuro** con fondo `#0D0D0D`
- **Diseño responsive** que se adapta a móviles, tablets y desktop
- **Animaciones suaves** y efectos hover modernos
- **Tipografía Inter** para una apariencia profesional

### ⚡ Funcionalidad
- **Toggle Personas/Empresas** para cambiar entre tipos de plan
- **Selector de facturación** mensual/anual en cada tarjeta
- **Selector de estudiantes** dinámico en el Plan Duo (2 o 4 estudiantes)
- **Precios dinámicos** que cambian según las selecciones
- **Indicadores de ahorro** para planes anuales

### 🎯 Componentes Principales
- **PricingSection**: Componente principal con gestión de estado
- **PricingCard**: Tarjetas de planes con toda la funcionalidad
- **PaymentMethods**: Métodos de pago seguros
- **StudentSection**: Sección especial para estudiantes universitarios

### 📱 Planes Incluidos

#### Para Personas
- **Basic**: $19/mes - Acceso básico con cursos fundamentales
- **Expert**: $39/mes - Plan completo con cursos avanzados (⭐ Más popular)
- **Expert Duo**: $59-89/mes - Para 2-4 estudiantes

#### Para Empresas
- **Team Basic**: $99/mes - Hasta 10 empleados
- **Team Expert**: $199/mes - Hasta 50 empleados (⭐ Más popular)
- **Enterprise**: $399-699/mes - Empleados ilimitados

## 🚀 Instalación

### Prerrequisitos
- Node.js 18+
- [pnpm](https://pnpm.io/) (`corepack enable` recomendado)

### Pasos de instalación

1. **Navegar al directorio del proyecto**:
   ```bash
   cd imcyc-precios
   ```

2. **Instalar dependencias** (solo pnpm):
   ```bash
   pnpm install
   ```

3. **Iniciar el servidor de desarrollo**:
   ```bash
   pnpm start
   ```

4. **Ver en el navegador**:
   Abre [http://localhost:3000](http://localhost:3000)

## 🛠️ Tecnologías Utilizadas

- **React 18.2.0** - Framework principal
- **TailwindCSS 3.3.0** - Framework de CSS utility-first
- **Lucide React** - Íconos modernos y consistentes
- **PostCSS** - Procesamiento de CSS
- **React Scripts** - Herramientas de build

## 📦 Scripts Disponibles

```bash
npm start          # Iniciar servidor de desarrollo
npm run build      # Crear build de producción
npm run test       # Ejecutar tests
npm run eject      # Exponer configuración (irreversible)
```

## 🎨 Personalización

### Colores del tema
Los colores están definidos en `tailwind.config.js`:
```js
colors: {
  'dark-bg': '#0D0D0D',
  'platzi-green': '#00DF6C',
  'card-dark': '#1A1A1A',
  'border-dark': '#2A2A2A',
  // ...más colores
}
```

### Modificar planes
Los datos de los planes están en `src/components/PricingSection.jsx` en el objeto `plansData`.

## 🔧 Estructura del Proyecto

```
platzi-pricing/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── PricingSection.jsx    # Componente principal
│   │   ├── PricingCard.jsx       # Tarjetas de planes
│   │   ├── PaymentMethods.jsx    # Métodos de pago
│   │   └── StudentSection.jsx    # Sección estudiantes
│   ├── App.jsx
│   ├── index.js
│   └── index.css
├── tailwind.config.js
├── postcss.config.js
└── package.json
```

## 🎯 Funcionalidades Destacadas

### 1. Cambio Dinámico de Precios
- Los precios cambian automáticamente entre mensual/anual
- El Plan Duo ajusta precios según número de estudiantes
- Cálculo automático de ahorros en planes anuales

### 2. Accesibilidad
- Etiquetas ARIA para lectores de pantalla
- Contraste de colores optimizado para tema oscuro
- Navegación por teclado implementada

### 3. Responsive Design
- Las tarjetas se apilan verticalmente en móviles
- Grid adaptativo que funciona en todas las pantallas
- Texto y espaciado optimizados para cada breakpoint

### 4. Animaciones y Efectos
- Animaciones de entrada suaves
- Efectos hover en tarjetas y botones
- Transiciones fluidas entre estados

## 🌟 Características Especiales

### Badges Dinámicos
- "Más popular" en el plan Expert
- "Ahorras X meses" en planes anuales
- Ofertas especiales para estudiantes

### Sección de Estudiantes
- Descuento del 50% para email universitario
- Lista de universidades aliadas
- Beneficios exclusivos para estudiantes

### Métodos de Pago
- Múltiples opciones de pago
- Garantía de seguridad y reembolso
- Información de cuotas sin interés

## 📱 Responsive Breakpoints

- **Mobile**: < 768px (1 columna)
- **Tablet**: 768px - 1024px (2 columnas)
- **Desktop**: > 1024px (3 columnas)

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE.md](LICENSE.md) para más detalles.

## 🙏 Agradecimientos

- Diseño inspirado en las mejores prácticas de pricing tables modernas
- Iconos proporcionados por [Lucide](https://lucide.dev/)
- Fuente tipográfica [Inter](https://fonts.google.com/specimen/Inter) de Google Fonts

---

¿Preguntas o sugerencias? ¡No dudes en abrir un issue! 🚀