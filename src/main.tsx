import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { AuthProvider } from './context/AuthContext'
import './styles/global.css'

// Import Quidditch System for console access and testing
import './services/quidditchSystem'
import './services/systemValidation'
// Import test de inicialización
import './services/testInicializacion'
// Import validation completa
import { validacionCompleta } from './services/validacionCompleta'
// Import test final
import './services/testFinal'
// Import results validation system
import './services/resultsValidation'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)