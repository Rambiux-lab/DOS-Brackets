/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Trash2, Shuffle, Trophy, Users, ChevronRight, RotateCcw } from 'lucide-react';

interface Competitor {
  id: string;
  name: string;
}

interface Match {
  id: string;
  player1: string | null; // null means Bye or TBD
  player2: string | null;
  winner?: string;
}

interface Round {
  number: number;
  matches: Match[];
}

export default function App() {
  const [competitorInput, setCompetitorInput] = useState('');
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [bracket, setBracket] = useState<Round[] | null>(null);

  const addCompetitor = () => {
    if (!competitorInput.trim()) return;
    const names = competitorInput.split('\n').filter(n => n.trim());
    const newCompetitors = names.map(name => ({
      id: Math.random().toString(36).substr(2, 9),
      name: name.trim()
    }));
    setCompetitors([...competitors, ...newCompetitors]);
    setCompetitorInput('');
  };

  const removeCompetitor = (id: string) => {
    setCompetitors(competitors.filter(c => c.id !== id));
  };

  const clearCompetitors = () => {
    setCompetitors([]);
    setBracket(null);
  };

  const advanceWinner = (roundIdx: number, matchIdx: number, winnerName: string) => {
    if (!bracket || roundIdx >= bracket.length - 1 || winnerName === 'BYE') return;

    const newBracket = [...bracket];
    const nextRoundIdx = roundIdx + 1;
    const nextMatchIdx = Math.floor(matchIdx / 2);
    const isPlayer1 = matchIdx % 2 === 0;

    if (isPlayer1) {
      newBracket[nextRoundIdx].matches[nextMatchIdx].player1 = winnerName;
    } else {
      newBracket[nextRoundIdx].matches[nextMatchIdx].player2 = winnerName;
    }

    setBracket(newBracket);
  };

  const generateBracket = () => {
    if (competitors.length < 2) return;

    // Shuffle competitors
    const shuffled = [...competitors].sort(() => Math.random() - 0.5);
    
    const n = shuffled.length;
    const nextPowerOfTwo = Math.pow(2, Math.ceil(Math.log2(n)));
    const numByes = nextPowerOfTwo - n;
    
    const fullBracketSize = nextPowerOfTwo;
    const matchesInFirstRound = fullBracketSize / 2;
    
    const firstRound: Match[] = [];
    const competitorsQueue = [...shuffled];

    for (let i = 0; i < matchesInFirstRound; i++) {
      const p1 = competitorsQueue.shift() || null;
      const p2 = (i < numByes) ? 'BYE' : (competitorsQueue.shift()?.name || null);
      
      firstRound.push({
        id: `r1-m${i}`,
        player1: p1 ? p1.name : null,
        player2: p2,
      });
    }

    const rounds: Round[] = [{ number: 1, matches: firstRound }];

    let prevRoundSize = matchesInFirstRound;
    let roundNum = 2;
    while (prevRoundSize > 1) {
      const nextRoundSize = prevRoundSize / 2;
      const nextRoundMatches: Match[] = [];
      for (let i = 0; i < nextRoundSize; i++) {
        nextRoundMatches.push({
          id: `r${roundNum}-m${i}`,
          player1: null,
          player2: null
        });
      }
      rounds.push({ number: roundNum, matches: nextRoundMatches });
      prevRoundSize = nextRoundSize;
      roundNum++;
    }

    // Auto-advance byes
    firstRound.forEach((match, idx) => {
      if (match.player2 === 'BYE' && match.player1) {
        const nextMatchIdx = Math.floor(idx / 2);
        const isPlayer1 = idx % 2 === 0;
        if (rounds[1]) {
          if (isPlayer1) rounds[1].matches[nextMatchIdx].player1 = match.player1;
          else rounds[1].matches[nextMatchIdx].player2 = match.player1;
        }
      }
    });

    setBracket(rounds);
  };

  return (
    <div className="min-h-screen bg-[#E4E3E0] text-[#141414] font-sans selection:bg-[#141414] selection:text-[#E4E3E0]">
      {/* Header */}
      <header className="border-b border-[#141414] p-6 flex justify-between items-center bg-white/50 backdrop-blur-sm sticky top-0 z-10">
        <div>
          <h1 className="text-2xl font-bold tracking-tighter uppercase italic font-serif">BJJ Bracket Master</h1>
          <p className="text-xs opacity-50 uppercase tracking-widest font-mono">Tournament Randomizer v1.0</p>
        </div>
        <div className="flex gap-4">
          {competitors.length > 0 && (
            <button 
              onClick={clearCompetitors}
              className="flex items-center gap-2 px-4 py-2 border border-[#141414] hover:bg-[#141414] hover:text-[#E4E3E0] transition-colors text-xs uppercase font-bold"
            >
              <RotateCcw size={14} /> Reiniciar
            </button>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Input */}
        <div className="lg:col-span-4 space-y-6">
          <section className="bg-white border border-[#141414] p-6 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
            <h2 className="text-sm font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
              <Users size={16} /> Competidores ({competitors.length})
            </h2>
            
            <div className="space-y-4">
              <textarea
                value={competitorInput}
                onChange={(e) => setCompetitorInput(e.target.value)}
                placeholder="Ingresa nombres (uno por línea)..."
                className="w-full h-32 p-3 border border-[#141414] focus:outline-none focus:ring-2 focus:ring-[#141414]/10 font-mono text-sm resize-none"
              />
              <button
                onClick={addCompetitor}
                className="w-full py-3 bg-[#141414] text-[#E4E3E0] font-bold uppercase tracking-widest hover:bg-[#333] transition-colors flex items-center justify-center gap-2"
              >
                <Plus size={18} /> Agregar Lista
              </button>
            </div>

            <div className="mt-6 max-h-[400px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
              <AnimatePresence mode="popLayout">
                {competitors.map((c) => (
                  <motion.div
                    key={c.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="flex justify-between items-center p-3 border border-[#141414]/10 bg-[#F5F5F3] hover:border-[#141414] transition-colors group"
                  >
                    <span className="text-sm font-medium">{c.name}</span>
                    <button 
                      onClick={() => removeCompetitor(c.id)}
                      className="text-[#141414]/30 hover:text-red-600 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
              {competitors.length === 0 && (
                <p className="text-center py-8 text-xs opacity-40 italic">No hay competidores aún.</p>
              )}
            </div>

            {competitors.length >= 2 && (
              <button
                onClick={generateBracket}
                className="w-full mt-6 py-4 border-2 border-[#141414] font-black uppercase tracking-[0.2em] hover:bg-[#141414] hover:text-[#E4E3E0] transition-all flex items-center justify-center gap-3 group"
              >
                <Shuffle size={20} className="group-hover:rotate-180 transition-transform duration-500" />
                Generar Bracket
              </button>
            )}
          </section>
        </div>

        {/* Right Column: Bracket Visualization */}
        <div className="lg:col-span-8">
          <section className="bg-white border border-[#141414] p-6 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] min-h-[600px] overflow-x-auto">
            <h2 className="text-sm font-bold uppercase tracking-widest mb-8 flex items-center gap-2">
              <Trophy size={16} /> Bracket de Competencia
            </h2>

            {!bracket ? (
              <div className="h-[500px] flex flex-col items-center justify-center opacity-20 text-center space-y-4">
                <Trophy size={64} strokeWidth={1} />
                <p className="uppercase tracking-widest text-xs font-bold">Agrega al menos 2 competidores para empezar</p>
              </div>
            ) : (
              <div className="flex gap-12 pb-8">
                {bracket.map((round, rIdx) => (
                  <div key={round.number} className="flex flex-col justify-around min-w-[200px] space-y-8">
                    <div className="text-center mb-4">
                      <span className="text-[10px] font-mono uppercase tracking-widest opacity-50 border-b border-[#141414]/20 pb-1">
                        Round {round.number}
                      </span>
                    </div>
                    {round.matches.map((match, mIdx) => (
                      <motion.div
                        key={match.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: rIdx * 0.1 + mIdx * 0.05 }}
                        className="relative"
                      >
                        <div className="border border-[#141414] bg-white overflow-hidden group hover:shadow-[2px_2px_0px_0px_rgba(20,20,20,1)] transition-all">
                          {/* Player 1 */}
                          <button 
                            onClick={() => match.player1 && advanceWinner(rIdx, mIdx, match.player1)}
                            disabled={!match.player1 || match.player1 === 'BYE' || rIdx === bracket.length - 1}
                            className={`w-full p-3 text-xs border-b border-[#141414]/10 flex justify-between items-center text-left transition-colors ${match.player1 === 'BYE' ? 'bg-gray-50 opacity-50' : 'hover:bg-[#141414] hover:text-[#E4E3E0]'}`}
                          >
                            <span className="font-bold truncate max-w-[140px]">{match.player1 || 'TBD'}</span>
                            {match.player1 && match.player1 !== 'BYE' && rIdx < bracket.length - 1 && <ChevronRight size={10} className="opacity-20" />}
                          </button>
                          {/* Player 2 */}
                          <button 
                            onClick={() => match.player2 && advanceWinner(rIdx, mIdx, match.player2)}
                            disabled={!match.player2 || match.player2 === 'BYE' || rIdx === bracket.length - 1}
                            className={`w-full p-3 text-xs flex justify-between items-center text-left transition-colors ${match.player2 === 'BYE' ? 'bg-gray-50 opacity-50' : 'hover:bg-[#141414] hover:text-[#E4E3E0]'}`}
                          >
                            <span className="font-bold truncate max-w-[140px]">{match.player2 || 'TBD'}</span>
                            {match.player2 && match.player2 !== 'BYE' && rIdx < bracket.length - 1 && <ChevronRight size={10} className="opacity-20" />}
                          </button>
                        </div>
                        
                        {/* Connection Lines (Visual only for now) */}
                        {rIdx < bracket.length - 1 && (
                          <div className="absolute -right-12 top-1/2 w-12 h-px bg-[#141414]/20" />
                        )}
                      </motion.div>
                    ))}
                  </div>
                ))}
                
                {/* Winner Placeholder */}
                <div className="flex flex-col justify-center min-w-[200px]">
                  <div className="text-center mb-4">
                    <span className="text-[10px] font-mono uppercase tracking-widest opacity-50 border-b border-[#141414]/20 pb-1">
                      Campeón
                    </span>
                  </div>
                  <div className="border-2 border-[#141414] bg-[#141414] text-[#E4E3E0] p-6 text-center">
                    <Trophy size={32} className="mx-auto mb-2" />
                    <span className="text-xs font-black uppercase tracking-tighter">Por Definir</span>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>

      <footer className="mt-12 border-t border-[#141414] p-8 text-center opacity-40">
        <p className="text-[10px] uppercase tracking-[0.3em] font-mono">
          Handcrafted for the BJJ Community &copy; 2026
        </p>
      </footer>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #141414;
        }
      `}</style>
    </div>
  );
}
