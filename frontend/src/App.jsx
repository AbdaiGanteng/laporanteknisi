import InstallationForm from './components/InstallationForm.jsx';

function App() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <p className="app-eyebrow">Operasional Teknisi</p>
        <h1>Form Pemasangan Baru</h1>
        <p className="app-description">
          Lengkapi data pelanggan, hasil pemasangan, dan foto bukti dari lokasi.
        </p>
      </header>

      <main>
        <InstallationForm />
      </main>
    </div>
  );
}

export default App;
