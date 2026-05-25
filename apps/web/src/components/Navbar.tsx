'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function Navbar() {
  return (
    <div className="fixed top-4 left-4 z-50">
      <Link href="/" className="flex items-center gap-2 group transition-all hover:scale-105 duration-300">
        <Image 
          src="/logo/Forge_sanstext.png" 
          alt="Forge Icon" 
          width={40} 
          height={40} 
          className="rounded-xl shadow-lg drop-shadow-[0_0_15px_rgba(78,222,163,0.1)] group-hover:drop-shadow-[0_0_20px_rgba(78,222,163,0.2)]"
          priority
        />
        <span className="font-black text-sm tracking-widest text-zinc-400 hidden sm:block group-hover:text-white transition-colors drop-shadow-md">
          FORGE
        </span>
      </Link>
    </div>
  );
}
