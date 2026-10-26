import { useNavigate } from 'react-router-dom'

export default function Login() {

  const navigate = useNavigate()

  const inputWrap ="flex items-center gap-3 rounded-2xl border border-slate-300 bg-slate-50 px-4 h-[58px]";
  const inputBase ="w-full bg-transparent text-base text-slate-800 placeholder:text-slate-400 outline-none";
  const icon = "h-5 w-5 shrink-0 text-slate-500";

  return (
    <main className="flex min-h-screen bg-white">
      {/* Panel kiri */}
      <section className="relative hidden lg:flex lg:w-1/2 flex-col items-center justify-end overflow-hidden rounded-r-[2rem] bg-gradient-to-b from-black via-[#070714] to-[#050b1f] px-10 pb-28 text-center text-white">
        
      </section>

      {/* Panel kanan */}
      <section className="flex w-full items-center justify-center px-6 py-12 lg:w-1/2">
        <div className="w-full max-w-[600px]">
          <header className="mb-10 text-center">
            <p className="mb-6 text-2xl font-bold text-slate-900">Nama aplikasi</p>
            <h2 className="text-4xl font-semibold text-slate-900">Selamat Datang</h2>
            <p className="mt-3 text-lg text-slate-600">
              Silakan masuk ke akun{" "}
              <span className="font-semibold text-slate-900">NAMA APLIAKSI</span> Anda
            </p>
          </header>

          <div className="space-y-6">
            {/* Email */}
            <div>
              <label className="mb-2 block text-lg text-slate-800">Email</label>
              <div className={inputWrap}>
                <svg className={icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="5" width="18" height="14" rx="2" />
                  <path d="m3 7 9 6 9-6" />
                </svg>
                <input type="email" placeholder="Masukkan email" className={inputBase} />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-lg text-slate-800">Password</label>
                <a href="#" className="text-sm font-semibold text-blue-600">
                  Lupa password?
                </a>
              </div>
              <div className={inputWrap}>
                <svg className={icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="8" cy="15" r="4" />
                  <path d="m11 12 8-8m-3 3 3 3m-6-6 2 2" />
                </svg>
                <input type="password" placeholder="Masukkan password" className={inputBase} />
                <svg className={icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" >
                  <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
                  <circle cx="12" cy="12" r="3" />
                  
                </svg>
              </div>
            </div>

            <button className="h-[66px] cursor-pointer w-full rounded-2xl bg-blue-700 text-lg font-semibold text-white shadow-md" onClick={() => navigate('/dashboard')}> Masuk ke Akun </button>

          </div>

          <p className="mt-8 text-center text-lg text-slate-600">
            Belum punya akun?{" "}
            <a href="#" className="font-semibold text-blue-600">
              Daftar di sini
            </a>
          </p>
        </div>
      </section>
    </main>
  );
}
