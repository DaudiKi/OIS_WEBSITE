import React from 'react';
import ReactDOM from 'react-dom/client';
import '../styles/base.css';
import '../styles/calendar.css';
import CalendarPage from '../pages/CalendarPage.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <CalendarPage />
  </React.StrictMode>
);
