import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './styles/theme.css' 
import { seedDatabase } from './db/seed.ts'

// Ejecutar poblamiento inicial de la BD local
seedDatabase();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)