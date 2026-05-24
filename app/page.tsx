import Link from 'next/link';

export default function HomeHub() {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="z-10 text-center max-w-2xl w-full">
        <div className="w-20 h-20 mx-auto mb-8 rounded-2xl bg-gradient-to-br from-emerald-400 to-blue-500 flex items-center justify-center text-black font-black text-4xl shadow-[0_0_40px_rgba(16,185,129,0.3)]">
          F
        </div>
        
        <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-4">
          FORGE <span className="text-transparent bg-clip-text bg-gradient-to-r from-zinc-400 to-zinc-600">Sports CAD</span>
        </h1>
        <p className="text-zinc-400 text-lg md:text-xl mb-12">
          La plateforme d&apos;ingénierie sportive pour planifier et exécuter vos programmes d&apos;entraînement de manière scientifique.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
          {/* FORGE Button */}
          <Link href="/forge" className="group relative bg-zinc-900/50 border border-zinc-800 hover:border-emerald-500/50 rounded-3xl p-8 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(16,185,129,0.2)] overflow-hidden text-left">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-3xl rounded-full group-hover:bg-emerald-500/20 transition-all" />
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
              </div>
              <h2 className="text-2xl font-black text-white tracking-widest mb-2">FORGE</h2>
              <p className="text-sm text-zinc-500 font-medium">
                Simulateur biomécanique. Créez et analysez vos programmes d&apos;entraînement.
              </p>
            </div>
          </Link>

          {/* WORK Button */}
          <Link href="/work" className="group relative bg-zinc-900/50 border border-zinc-800 hover:border-blue-500/50 rounded-3xl p-8 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(59,130,246,0.2)] overflow-hidden text-left">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-3xl rounded-full group-hover:bg-blue-500/20 transition-all" />
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h2 className="text-2xl font-black text-white tracking-widest mb-2">WORK</h2>
              <p className="text-sm text-zinc-500 font-medium">
                Tracker de séance. Surcharge progressive assistée par IA.
              </p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
