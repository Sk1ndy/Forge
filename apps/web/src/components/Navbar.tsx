'use client';

import Link from 'next/link';

export default function Navbar() {
  return (
    <div className="fixed top-4 left-4 z-50">
      <Link href="/" className="flex items-center gap-2 group">
        <div className="w-10 h-10 rounded-xl bg-black/80 backdrop-blur-md border border-zinc-800 flex items-center justify-center text-white font-black shadow-lg group-hover:bg-zinc-900 group-hover:border-zinc-700 transition-all">
          <span className="text-transparent bg-clip-text bg-gradient-to-br from-emerald-400 to-blue-500">
            F
          </span>
        </div>
        <span className="font-black text-sm tracking-widest text-zinc-400 hidden sm:block group-hover:text-white transition-colors drop-shadow-md">
          FORGE
        </span>
      </Link>
    </div>
  );
}
