import React, { useState, useEffect } from 'react';
import PricingSection from './components/PricingSection';
import SuccessPage from './components/SuccessPage';
import CancelPage from './components/CancelPage';
import './index.css';

function App() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  // Determinar qué componente mostrar basado en la ruta
  const renderContent = () => {
    // Normalizar la ruta eliminando el prefijo /precios si existe
    const normalizedPath = currentPath.replace('/precios', '').replace(/\/$/, '') || '/';

    if (normalizedPath === '/success') {
      return <SuccessPage />;
    }
    if (normalizedPath === '/cancel') {
      return <CancelPage />;
    }
    return <PricingSection />;
  };

  return (
    <div className="App">
      {renderContent()}
    </div>
  );
}

export default App;