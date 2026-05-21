import React, { useState, useEffect } from 'react';
import PricingSection from './components/PricingSection';
import CheckoutPage from './components/CheckoutPage';
import ConfirmationPage from './components/ConfirmationPage';
import SuccessPage from './components/SuccessPage';
import CancelPage from './components/CancelPage';
import CancelSubscriptionPage from './components/CancelSubscriptionPage';
import { getAppPath } from './utils/routes';
import './index.css';

function App() {
  const [appPath, setAppPath] = useState(getAppPath);

  useEffect(() => {
    const sync = () => setAppPath(getAppPath());
    window.addEventListener('popstate', sync);
    window.addEventListener('hashchange', sync);
    return () => {
      window.removeEventListener('popstate', sync);
      window.removeEventListener('hashchange', sync);
    };
  }, []);

  const renderContent = () => {
    if (appPath === '/checkout') {
      return <CheckoutPage />;
    }
    if (appPath === '/confirmacion') {
      return <ConfirmationPage />;
    }
    if (appPath === '/success') {
      return <SuccessPage />;
    }
    if (appPath === '/cancel') {
      return <CancelPage />;
    }
    if (appPath === '/cancelar-suscripcion') {
      return <CancelSubscriptionPage />;
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
