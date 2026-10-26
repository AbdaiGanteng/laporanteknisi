import { NavLink, Link } from "react-router-dom";

export default function Sidebar() {
  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
      isActive ? "bg-blue-600 text-white" : "hover:bg-slate-800 hover:text-white"
    }`;

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col bg-slate-900 text-slate-300">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-slate-800 px-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-lg font-bold text-white">
          S
        </div>
        <span className="text-lg font-semibold text-white">Sebilling</span>
      </div>

      {/* Menu */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
          Menu
        </p>

        <NavLink to="/dashboard" className={linkClass}>
          <span>🏠</span> Dashboard
        </NavLink>
        <NavLink to="/pelanggan" className={linkClass}>
          <span>👥</span> Pelanggan
        </NavLink>
        <NavLink to="/paket-internet" className={linkClass}>
          <span>📶</span> Paket Internet
        </NavLink>
        <NavLink to="/tagihan" className={linkClass}>
          <span>🧾</span> Tagihan
        </NavLink>
        <NavLink to="/pembayaran" className={linkClass}>
          <span>💳</span> Pembayaran
        </NavLink>
        <NavLink to="/laporan" className={linkClass}>
          <span>📊</span> Laporan
        </NavLink>
        <NavLink to="/pengaturan" className={linkClass}>
          <span>⚙️</span> Pengaturan
        </NavLink>
      </nav>

      {/* Profil & Logout */}
      <div className="border-t border-slate-800 p-3">
        <div className="mb-2 flex items-center gap-3 rounded-lg px-3 py-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-700 text-sm font-semibold text-white">
            A
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-white">Admin</p>
            <p className="truncate text-xs text-slate-400">admin@sebilling.id</p>
          </div>
        </div>
        <Link
          to="/"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-400 transition-colors hover:bg-slate-800 hover:text-red-300"
        >
          <span>🚪</span> Keluar
        </Link>
      </div>
    </aside>
  );
}