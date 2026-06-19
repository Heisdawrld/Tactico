'use client';

import { useEffect, useRef, useState } from 'react';
import { PhysicsEngine } from './PhysicsEngine';
import { SimulationEngine } from '@tactico/simulation-engine';

export default function MatchPitch() {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<PhysicsEngine | null>(null);
  const [matchStatus, setMatchStatus] = useState('Initializing...');

  useEffect(() => {
    if (containerRef.current && !engineRef.current) {
      const engine = new PhysicsEngine();
      engineRef.current = engine;
      
      const initPromise = engine.init(containerRef.current);
      
      Promise.resolve(initPromise).then(() => {
        setMatchStatus('Match in Progress');
        engine.addBall(525, 340);
        
        // Add Home Team (4-4-2)
        const homeColor = 0x6CABDD; // Man City blue
        engine.addPlayer(200, 340, homeColor); // GK
        engine.addPlayer(350, 200, homeColor); // CB
        engine.addPlayer(350, 480, homeColor); // CB
        engine.addPlayer(400, 100, homeColor); // LB
        engine.addPlayer(400, 580, homeColor); // RB
        
        // Add Away Team
        const awayColor = 0xDA291C; // Man Utd red
        engine.addPlayer(850, 340, awayColor); // GK
        engine.addPlayer(700, 200, awayColor); // CB
        engine.addPlayer(700, 480, awayColor); // CB
      });
    }

    return () => {
      if (engineRef.current) {
        engineRef.current.destroy();
        engineRef.current = null;
      }
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#121214] p-4 font-display">
      <div className="w-full max-w-5xl flex items-center justify-between mb-6 bg-graphite/30 backdrop-blur-md p-4 rounded-xl border border-white/5">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-[#6CABDD] flex items-center justify-center font-bold text-white shadow-lg">MC</div>
          <span className="text-2xl font-black text-white tracking-tighter">0</span>
        </div>
        <div className="flex flex-col items-center">
          <div className="px-3 py-1 bg-gold/10 rounded-full border border-gold/20 mb-1">
            <span className="text-[10px] font-bold text-gold uppercase tracking-widest">Premier League</span>
          </div>
          <span className="text-xl font-mono text-white/90">24:15</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-2xl font-black text-white tracking-tighter">0</span>
          <div className="w-10 h-10 rounded-lg bg-[#DA291C] flex items-center justify-center font-bold text-white shadow-lg">MU</div>
        </div>
      </div>

      <div 
        ref={containerRef} 
        className="border-8 border-[#1A1A1E] shadow-[0_0_50px_rgba(0,0,0,0.5)] rounded-2xl overflow-hidden bg-[#2e7d32]"
      />
      
      <div className="w-full max-w-5xl mt-6 grid grid-cols-3 gap-4">
        <div className="bg-graphite/20 backdrop-blur-sm p-4 rounded-xl border border-white/5">
          <p className="text-[10px] text-white/40 uppercase font-bold mb-2">Possession</p>
          <div className="flex items-center gap-2">
            <div className="h-1.5 bg-[#6CABDD] rounded-full" style={{ width: '55%' }} />
            <div className="h-1.5 bg-[#DA291C] rounded-full flex-1" />
          </div>
          <div className="flex justify-between mt-1 text-xs font-bold text-white/80">
            <span>55%</span>
            <span>45%</span>
          </div>
        </div>
        <div className="bg-graphite/20 backdrop-blur-sm p-4 rounded-xl border border-white/5 flex flex-col items-center justify-center">
          <p className="text-[10px] text-white/40 uppercase font-bold mb-1">Match Status</p>
          <p className="text-sm font-bold text-gold">{matchStatus}</p>
        </div>
        <div className="bg-graphite/20 backdrop-blur-sm p-4 rounded-xl border border-white/5">
          <p className="text-[10px] text-white/40 uppercase font-bold mb-2">Recent Event</p>
          <p className="text-xs text-white/80 font-medium">Salah receives a yellow card for a tactical foul.</p>
        </div>
      </div>
    </div>
  );
}
