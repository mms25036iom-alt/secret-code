import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from "react-redux";
import { PersistGate } from 'redux-persist/integration/react';
import { persistReduxStore, persistor } from './store';
import { FilterProvider } from './context/FilterContext';
import { LanguageProvider } from './context/LanguageContext';

createRoot(document.getElementById('root')).render(
  <Provider store={persistReduxStore}>
    <PersistGate loading={null} persistor={persistor}>
      <LanguageProvider>
        <FilterProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </FilterProvider>
      </LanguageProvider>
    </PersistGate>
  </Provider>
);