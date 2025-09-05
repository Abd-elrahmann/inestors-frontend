import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { HelmetProvider } from 'react-helmet-async'
import { QueryClient, QueryClientProvider } from 'react-query'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import { LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
dayjs.extend(utc)
const queryClient = new QueryClient()
createRoot(document.getElementById('root')).render(
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <App />
        </LocalizationProvider>
      </QueryClientProvider>
    </HelmetProvider>
)
