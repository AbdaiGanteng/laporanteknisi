
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './App.css';

// Render aplikasi React ke elemen HTML dengan id "root"
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* BrowserRouter mengaktifkan sistem routing berdasarkan URL */}
    <BrowserRouter>
      {/* App berisi Routes dan Route */}
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);

// Daftarkan Service Worker hanya jika browser mendukungnya
// dan aplikasi sedang berjalan dalam mode production
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  // Tunggu sampai halaman selesai dimuat
  window.addEventListener('load', () => {
    // Daftarkan file Service Worker (sw.js)
    navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}sw.js`, {
        // Tentukan cakupan URL yang dikendalikan Service Worker
        scope: import.meta.env.BASE_URL,
      })
      // Jika gagal, abaikan error (tidak ditampilkan ke console)
      .catch(() => {});
  });
}
