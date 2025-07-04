import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/performanceStyles.css'
import App from './App.jsx'

// Set document direction to RTL
document.documentElement.dir = 'rtl';
document.documentElement.lang = 'ar';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
