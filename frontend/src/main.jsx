import './styles.css';
import React from 'react';
import App from './App.jsx';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext.jsx';
import { ConfirmacaoProvider } from './contexts/ConfirmacaoContext.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ConfirmacaoProvider>
          <App />
        </ConfirmacaoProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);