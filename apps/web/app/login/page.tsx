'use client'

import { createClient } from '@/lib/supabase/client'
import { useState, useEffect } from 'react'

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  // Micro-interaction: Randomly update bars to simulate "live analysis"
  useEffect(() => {
    const updateBars = () => {
      const bars = document.querySelectorAll('.heat-bar-fill') as NodeListOf<HTMLElement>;
      bars.forEach(bar => {
        const currentWidth = parseFloat(bar.style.width) || 50;
        const variance = (Math.random() - 0.5) * 4;
        const newWidth = Math.min(Math.max(currentWidth + variance, 20), 98);
        bar.style.width = `${newWidth}%`;
      });
    };
    
    const interval = setInterval(updateBars, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleGoogleLogin = async () => {
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) throw error
    } catch (error) {
      console.error('Error logging in with Google:', error)
      alert('Une erreur est survenue lors de la connexion.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <style>{`
        .ambient-glow {
            position: absolute;
            width: 600px;
            height: 600px;
            border-radius: 50%;
            filter: blur(120px);
            opacity: 0.15;
            z-index: 0;
            pointer-events: none;
        }

        .glow-emerald { background: #10B981; top: -100px; left: -100px; }
        .glow-crimson { background: #ef4444; bottom: -100px; right: 100px; }

        .glass-panel {
            background: rgba(23, 23, 23, 0.4);
            backdrop-filter: blur(24px);
            border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .heat-bar-track {
            height: 4px;
            background: #1c1b1b;
            width: 100%;
            border-radius: 2px;
            position: relative;
        }

        .heat-bar-fill {
            height: 100%;
            border-radius: 2px;
            transition: width 1s ease-in-out;
        }

        @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
        }

        .animate-float {
            animation: float 6s ease-in-out infinite;
        }
      `}</style>

      <div className="flex min-h-screen w-full overflow-hidden bg-[#0A0A0A] text-[#e5e2e1] font-sans">
        
        {/* Left Panel (Teaser/Biomechanics) */}
        <div className="relative hidden lg:flex w-1/2 h-full min-h-screen flex-col items-center justify-center bg-[#0A0A0A] overflow-hidden border-r border-white/5">
          {/* Ambient Lighting */}
          <div className="ambient-glow glow-emerald"></div>
          <div className="ambient-glow glow-crimson"></div>
          
          <div className="relative z-10 w-full max-w-lg px-10">
            {/* Tagline */}
            <div className="mb-12">
              <h1 className="text-5xl font-black leading-[1.1] tracking-tight text-[#e5e2e1]">
                Simulate fatigue.<br/>
                <span className="text-[#4edea3]">Forge the ultimate program.</span>
              </h1>
            </div>
            
            {/* Heatmap Glass Card */}
            <div className="glass-panel p-8 rounded-xl animate-float">
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-[#4edea3]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                  </svg>
                  <span className="text-xs font-bold tracking-[0.1em] text-zinc-400">BIOMECHANICS HEATMAP</span>
                </div>
                <div className="px-3 py-1 rounded bg-[#4edea3]/10 border border-[#4edea3]/20 text-[#4edea3] text-[10px] font-bold tracking-widest uppercase">
                  LIVE ANALYSIS
                </div>
              </div>
              
              <div className="flex gap-8 items-center">
                {/* Skeleton Placeholder / Human Outline */}
                <div className="w-1/3 aspect-[1/2] relative border border-white/5 rounded-lg flex items-center justify-center bg-black/40">
                  <div className="w-full h-full opacity-40 flex items-center justify-center p-4">
                    <svg className="w-full h-full text-[#4edea3] fill-current" viewBox="0 0 100 200">
                      <path d="M50 10c-5 0-9 4-9 9s4 9 9 9 9-4 9-9-4-9-9-9zm-5 25c-8 0-15 10-15 25v45l15 60h10l15-60v-45c0-15-7-25-15-25z" opacity="0.2"></path>
                      {/* Highlighted Pectorals */}
                      <path d="M42 45 c2 0 4 5 4 10 s-2 10 -4 10 s-4-5-4-10 s2-10 4-10" fill="#4edea3" opacity="0.8"></path>
                      <path d="M58 45 c-2 0-4 5-4 10 s2 10 4 10 s4-5 4-10 s-2-10-4-10" fill="#4edea3" opacity="0.8"></path>
                      {/* Overloaded Deltoids */}
                      <circle cx="34" cy="45" fill="#ef4444" opacity="0.9" r="4"></circle>
                      <circle cx="66" cy="45" fill="#ef4444" opacity="0.9" r="4"></circle>
                    </svg>
                  </div>
                </div>
                
                {/* Data Column */}
                <div className="flex-1 space-y-6">
                  <div className="space-y-2">
                    <div className="flex justify-between text-[11px] font-bold tracking-[0.1em] text-zinc-400">
                      <span>PECTORALS</span>
                      <span className="text-[#4edea3]">OPTIMAL</span>
                    </div>
                    <div className="heat-bar-track">
                      <div className="heat-bar-fill bg-[#4edea3] w-[72%] shadow-[0_0_10px_rgba(78,222,163,0.3)]" style={{ width: '72%' }}></div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-[11px] font-bold tracking-[0.1em] text-zinc-400">
                      <span>QUADRICEPS</span>
                      <span className="text-[#4edea3]">OPTIMAL</span>
                    </div>
                    <div className="heat-bar-track">
                      <div className="heat-bar-fill bg-[#4edea3] w-[45%]" style={{ width: '45%' }}></div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-[11px] font-bold tracking-[0.1em] text-zinc-400">
                      <span>DELTOIDS</span>
                      <span className="text-[#ef4444]">OVERLOADED</span>
                    </div>
                    <div className="heat-bar-track">
                      <div className="heat-bar-fill bg-[#ef4444] w-[94%] shadow-[0_0_10px_rgba(239,68,68,0.3)]" style={{ width: '94%' }}></div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-8 pt-6 border-t border-white/5 flex gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#4edea3]"></div>
                  <span className="text-[10px] font-bold tracking-[0.1em] text-zinc-400 uppercase">OPTIMAL</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#ef4444]"></div>
                  <span className="text-[10px] font-bold tracking-[0.1em] text-zinc-400 uppercase">CRITICAL</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel (Auth) */}
        <div className="flex-1 h-full min-h-screen bg-[#0A0A0A] relative flex flex-col items-center justify-center p-8">
          {/* Subtle background texture */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,1) 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>
          
          <div className="w-full max-w-md relative z-10 flex flex-col items-center">
            <div className="text-center mb-10">
              {/* Branding Logo */}
              <div className="inline-block mb-6 transition-transform hover:scale-105 duration-300">
                <div className="w-16 h-16 rounded-2xl bg-black border border-zinc-800 flex items-center justify-center shadow-[0_0_30px_rgba(78,222,163,0.15)] mx-auto">
                  <span className="text-transparent text-3xl font-black bg-clip-text bg-gradient-to-br from-[#4edea3] to-[#10B981]">
                    F
                  </span>
                </div>
              </div>
              <h2 className="text-3xl font-bold tracking-tight text-zinc-100 mb-2">Welcome to Forge</h2>
              <p className="text-base text-zinc-400 max-w-xs mx-auto">
                Connect to save your blueprints and sync with the cloud.
              </p>
            </div>
            
            {/* Google Auth Button */}
            <div className="w-full space-y-6">
              <button 
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full h-12 flex items-center justify-center gap-3 bg-white hover:bg-zinc-200 text-black font-bold text-sm tracking-wide rounded transition-all active:scale-[0.98] shadow-lg shadow-black/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"></path>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
                  </svg>
                )}
                {loading ? 'Connexion...' : 'Continue with Google'}
              </button>
              
              <div className="flex items-center gap-4 py-2 opacity-50">
                <div className="h-px flex-1 bg-white/20"></div>
                <span className="text-[10px] font-bold tracking-[0.1em] text-zinc-400 uppercase">OR</span>
                <div className="h-px flex-1 bg-white/20"></div>
              </div>
              
              <button 
                disabled
                className="w-full h-12 border border-white/10 text-zinc-400 text-sm font-bold tracking-wide rounded cursor-not-allowed"
              >
                Enter Laboratory Code
              </button>
            </div>
            
            <div className="mt-20 flex flex-col items-center gap-2">
              <div className="flex items-center gap-1.5 opacity-60">
                <svg className="w-4 h-4 text-[#4edea3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                </svg>
                <span className="text-[10px] font-bold tracking-[0.1em] text-zinc-400 uppercase">ALGORITHMIC OVERTRAINING PROTECTION</span>
              </div>
              <div className="w-32 h-[1px] bg-gradient-to-r from-transparent via-[#4edea3]/30 to-transparent"></div>
            </div>
          </div>
          
          {/* Footer Lockup */}
          <footer className="absolute bottom-6 w-full px-8 flex justify-between items-center opacity-40">
            <span className="text-[10px] font-bold tracking-tight text-zinc-500 uppercase">V2.4.0-STABLE</span>
            <div className="flex gap-4">
              <span className="text-[10px] font-bold tracking-tight text-zinc-500 uppercase">PRIVACY</span>
              <span className="text-[10px] font-bold tracking-tight text-zinc-500 uppercase">TERMS</span>
            </div>
          </footer>
        </div>
        
      </div>
    </>
  )
}
