import React from 'react';
import ReactDOM from 'react-dom/client';
import '../styles/base.css';
import '../styles/gallery.css';
import Gallery from '../pages/Gallery.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Gallery />
  </React.StrictMode>
);
