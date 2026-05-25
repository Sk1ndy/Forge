'use client'

import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'
import HumanAvatar from '@/components/simulator/HumanAvatar'
import { SimulationResult } from '@/lib/calculations'

const dummySimulation = {
  muscles: {
    chest: { name: 'Pectoraux', color: 'red', inol: 2.8, sets: 24, contributors: [], fatigueHistory: [1, 2.5, 2.8], statusLabel: 'MRV Dépassé', jointStress: 2.1 },
    frontDeltoid: { name: 'Delt. Antérieurs', color: 'orange', inol: 1.8, sets: 16, contributors: [], fatigueHistory: [0.5, 1.2, 1.8], statusLabel: 'Surcharge', jointStress: 1.2 },
    triceps: { name: 'Triceps', color: 'green', inol: 1.2, sets: 12, contributors: [], fatigueHistory: [0.2, 0.8, 1.2], statusLabel: 'Optimal', jointStress: 0.5 },
    quadriceps: { name: 'Quadriceps', color: 'red', inol: 2.4, sets: 20, contributors: [], fatigueHistory: [1, 2, 2.4], statusLabel: 'MRV Dépassé', jointStress: 1.8 },
    upperBack: { name: 'Grand Dorsal', color: 'green', inol: 1.4, sets: 14, contributors: [], fatigueHistory: [0, 0.5, 1.4], statusLabel: 'Optimal', jointStress: 0 },
    biceps: { name: 'Biceps', color: 'grey', inol: 0.4, sets: 4, contributors: [], fatigueHistory: [0, 0.1, 0.4], statusLabel: 'Repos', jointStress: 0 },
  },
  cnsFailure: false,
  junkVolumeAlerts: [],
  topSurcharged: [
    { name: 'Pectoraux', color: 'red', inol: 2.8, sets: 24, contributors: [], fatigueHistory: [], statusLabel: '', jointStress: 1 },
    { name: 'Quadriceps', color: 'red', inol: 2.4, sets: 20, contributors: [], fatigueHistory: [], statusLabel: '', jointStress: 1 }
  ],
  topNeglected: [
    { name: 'Biceps', color: 'grey', inol: 0.4, sets: 4, contributors: [], fatigueHistory: [], statusLabel: '', jointStress: 0 }
  ],
} as unknown as SimulationResult;

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

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
    <div className="flex min-h-screen bg-black text-zinc-100 font-sans overflow-hidden">
      
      {/* LEFT PANEL: Teaser Visuals (Hidden on small screens) */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col items-center justify-center p-12 bg-zinc-950 border-r border-zinc-900">
        
        {/* Glow Effects */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-900/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-900/20 rounded-full blur-[120px] pointer-events-none" />

        {/* Floating Headers */}
        <div className="absolute top-12 left-12 z-20">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-black/80 backdrop-blur-md border border-zinc-800 flex items-center justify-center text-white font-black shadow-lg">
              <span className="text-transparent text-xl bg-clip-text bg-gradient-to-br from-emerald-400 to-blue-500">
                F
              </span>
            </div>
            <span className="font-black text-xl tracking-widest text-white drop-shadow-md">
              FORGE
            </span>
          </div>
        </div>

        <div className="relative z-10 w-full max-w-lg h-[600px] bg-zinc-900/30 border border-zinc-800/50 rounded-3xl p-6 shadow-2xl backdrop-blur-sm flex flex-col">
          <div className="mb-4">
            <h3 className="text-xl font-bold text-white mb-1">Moteur de Simulation Biomécanique</h3>
            <p className="text-sm text-zinc-400">Heatmap d&apos;hypertrophie et fatigue du Système Nerveux Central</p>
          </div>
          <div className="flex-1 w-full relative rounded-xl overflow-hidden bg-black/40 border border-zinc-800/80">
            <HumanAvatar 
              simulation={dummySimulation} 
              selectedDay={undefined} 
              selectedMuscle="all"
              onMuscleClick={() => {}}
              highlightedMuscles={[]}
              viewMode="week"
            />
          </div>
        </div>
      </div>

      {/* RIGHT PANEL: Auth */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-8 bg-zinc-950/50 relative z-10">
        
        {/* Mobile Header (Hidden on large screens) */}
        <div className="lg:hidden flex items-center gap-3 mb-12">
          <div className="w-12 h-12 rounded-xl bg-black/80 backdrop-blur-md border border-zinc-800 flex items-center justify-center text-white font-black shadow-lg">
            <span className="text-transparent text-xl bg-clip-text bg-gradient-to-br from-emerald-400 to-blue-500">
              F
            </span>
          </div>
          <span className="font-black text-xl tracking-widest text-white drop-shadow-md">
            FORGE
          </span>
        </div>

        <div className="w-full max-w-md space-y-8 p-10 border border-zinc-800 rounded-2xl bg-zinc-900/60 backdrop-blur-xl shadow-2xl">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-black tracking-tight text-white">Connexion Requise</h2>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Forge simule précisément la tension mécanique et la fatigue pour créer un programme que ton corps peut <strong className="text-emerald-400 font-semibold">réellement</strong> encaisser.
            </p>
          </div>

          <div className="pt-4">
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="group flex w-full items-center justify-center gap-4 rounded-xl bg-white px-4 py-4 text-sm font-bold text-zinc-900 shadow-xl hover:bg-zinc-100 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed transition-all duration-200"
            >
              <svg className="h-5 w-5 transition-transform group-hover:scale-110" aria-hidden="true" viewBox="0 0 24 24">
                <path
                  d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                  fill="currentColor"
                />
              </svg>
              {loading ? 'Redirection sécurisée...' : 'Continuer avec Google'}
            </button>
          </div>

          <div className="pt-6 text-center border-t border-zinc-800/80">
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">
              Protection algorithmique anti-surentraînement
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
