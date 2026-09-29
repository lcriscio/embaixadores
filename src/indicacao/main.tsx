import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { IndicacaoPage } from './IndicacaoPage';
import './indicacao.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <IndicacaoPage />
  </StrictMode>,
);
