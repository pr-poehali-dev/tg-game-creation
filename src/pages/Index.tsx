import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import Icon from '@/components/ui/icon';

interface Upgrade {
  id: string;
  name: string;
  cost: number;
  power: number;
  owned: number;
  icon: string;
}

let audioContext: AudioContext | null = null;

const getAudioContext = () => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
};

const playSound = (frequency: number, duration: number = 100) => {
  try {
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.frequency.value = frequency;
    oscillator.type = 'square';
    
    gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration / 1000);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration / 1000);
  } catch (e) {
    console.warn('Audio playback failed:', e);
  }
};

let backgroundMusic: { interval: NodeJS.Timeout | null } | null = null;

const playMelodyNote = (freq: number, duration: number, delay: number = 0) => {
  setTimeout(() => {
    try {
      const ctx = getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration / 1000);
      
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + duration / 1000);
    } catch (e) {
      console.warn('Note playback failed:', e);
    }
  }, delay);
};

const startBackgroundMusic = () => {
  try {
    if (backgroundMusic) return;
    
    const melody = [523, 659, 784, 659, 523, 392, 523, 659];
    let noteIndex = 0;
    
    const playLoop = () => {
      playMelodyNote(melody[noteIndex], 400);
      noteIndex = (noteIndex + 1) % melody.length;
    };
    
    playLoop();
    const interval = setInterval(playLoop, 500);
    
    backgroundMusic = { interval };
  } catch (e) {
    console.warn('Background music failed:', e);
  }
};

const stopBackgroundMusic = () => {
  if (backgroundMusic?.interval) {
    clearInterval(backgroundMusic.interval);
    backgroundMusic = null;
  }
};

const loadGameState = () => {
  try {
    const saved = localStorage.getItem('spaceStationGame');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.warn('Failed to load game state:', e);
  }
  return null;
};

const saveGameState = (state: any) => {
  try {
    localStorage.setItem('spaceStationGame', JSON.stringify(state));
  } catch (e) {
    console.warn('Failed to save game state:', e);
  }
};

export default function Index() {
  const savedState = loadGameState();
  
  const [energy, setEnergy] = useState(savedState?.energy || 0);
  const [totalEnergy, setTotalEnergy] = useState(savedState?.totalEnergy || 0);
  const [energyPerClick, setEnergyPerClick] = useState(savedState?.energyPerClick || 1);
  const [energyPerSecond, setEnergyPerSecond] = useState(savedState?.energyPerSecond || 0);
  const [clicks, setClicks] = useState(savedState?.clicks || 0);
  const [musicPlaying, setMusicPlaying] = useState(false);

  const [upgrades, setUpgrades] = useState<Upgrade[]>(savedState?.upgrades || [
    { id: 'click', name: 'REACTOR BOOST', cost: 10, power: 1, owned: 0, icon: 'Zap' },
    { id: 'auto1', name: 'NANO-BOT', cost: 50, power: 1, owned: 0, icon: 'Bot' },
    { id: 'auto2', name: 'SOLAR PANEL', cost: 200, power: 5, owned: 0, icon: 'Sun' },
    { id: 'auto3', name: 'FUSION CORE', cost: 1000, power: 25, owned: 0, icon: 'Atom' },
    { id: 'auto4', name: 'QUANTUM GEN', cost: 5000, power: 100, owned: 0, icon: 'Sparkles' },
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (energyPerSecond > 0) {
        setEnergy(prev => prev + energyPerSecond / 10);
        setTotalEnergy(prev => prev + energyPerSecond / 10);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [energyPerSecond]);

  useEffect(() => {
    const saveInterval = setInterval(() => {
      saveGameState({
        energy,
        totalEnergy,
        energyPerClick,
        energyPerSecond,
        clicks,
        upgrades
      });
    }, 2000);

    return () => clearInterval(saveInterval);
  }, [energy, totalEnergy, energyPerClick, energyPerSecond, clicks, upgrades]);

  const handleReactorClick = () => {
    if (!musicPlaying) {
      startBackgroundMusic();
      setMusicPlaying(true);
    }
    setEnergy(prev => prev + energyPerClick);
    setTotalEnergy(prev => prev + energyPerClick);
    setClicks(prev => prev + 1);
    playSound(800, 80);
  };

  const toggleMusic = () => {
    if (musicPlaying) {
      stopBackgroundMusic();
      setMusicPlaying(false);
    } else {
      startBackgroundMusic();
      setMusicPlaying(true);
    }
  };

  const buyUpgrade = (upgrade: Upgrade) => {
    if (energy >= upgrade.cost) {
      setEnergy(prev => prev - upgrade.cost);
      
      setUpgrades(prev => prev.map(u => {
        if (u.id === upgrade.id) {
          const newOwned = u.owned + 1;
          const newCost = Math.floor(u.cost * 1.15);
          return { ...u, owned: newOwned, cost: newCost };
        }
        return u;
      }));

      if (upgrade.id === 'click') {
        setEnergyPerClick(prev => prev + upgrade.power);
      } else {
        setEnergyPerSecond(prev => prev + upgrade.power);
      }
      
      playSound(1200, 150);
      setTimeout(() => playSound(1400, 100), 100);
    }
  };

  return (
    <div className="min-h-screen bg-background p-2 sm:p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-4 sm:mb-6">
          <div className="flex items-center justify-center gap-2 sm:gap-4 mb-2">
            <h1 className="text-lg sm:text-2xl md:text-4xl text-primary animate-pulse-glow">
              SPACE STATION
            </h1>
            <Button
              onClick={toggleMusic}
              size="sm"
              variant="outline"
              className="border-primary text-primary hover:bg-primary/20 p-2"
            >
              <Icon name={musicPlaying ? "Volume2" : "VolumeX"} size={14} />
            </Button>
          </div>
          <p className="text-[10px] sm:text-xs md:text-sm text-muted-foreground">
            RESOURCE EXTRACTION
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
          <div className="lg:col-span-2 space-y-3 sm:space-y-4 md:space-y-6">
            <Card className="p-3 sm:p-4 md:p-6 border-2 border-primary bg-card">
              <div className="grid grid-cols-4 gap-2 sm:gap-3 md:gap-4 text-center mb-4 sm:mb-6">
                <div>
                  <div className="text-[8px] sm:text-[10px] md:text-xs text-muted-foreground mb-1">ENERGY</div>
                  <div className="text-sm sm:text-base md:text-lg text-primary">
                    {Math.floor(energy)}
                  </div>
                </div>
                <div>
                  <div className="text-[8px] sm:text-[10px] md:text-xs text-muted-foreground mb-1">CLICK</div>
                  <div className="text-sm sm:text-base md:text-lg text-secondary">
                    +{energyPerClick}
                  </div>
                </div>
                <div>
                  <div className="text-[8px] sm:text-[10px] md:text-xs text-muted-foreground mb-1">/SEC</div>
                  <div className="text-sm sm:text-base md:text-lg text-accent">
                    +{energyPerSecond.toFixed(1)}
                  </div>
                </div>
                <div>
                  <div className="text-[8px] sm:text-[10px] md:text-xs text-muted-foreground mb-1">TOTAL</div>
                  <div className="text-sm sm:text-base md:text-lg text-foreground">
                    {Math.floor(totalEnergy)}
                  </div>
                </div>
              </div>

              <div className="flex justify-center">
                <Button
                  onClick={handleReactorClick}
                  className="relative w-40 h-40 sm:w-48 sm:h-48 md:w-64 md:h-64 rounded-none border-4 border-primary bg-primary/20 hover:bg-primary/30 transition-all active:scale-95 animate-pulse-glow"
                  style={{ 
                    boxShadow: '0 0 20px hsl(var(--primary)), inset 0 0 20px hsl(var(--primary))'
                  }}
                >
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <Icon name="Atom" size={48} className="text-primary animate-float mb-2 sm:mb-4" />
                    <div className="text-[10px] sm:text-xs md:text-sm pixel-text text-primary">
                      REACTOR
                    </div>
                    <div className="text-[8px] sm:text-[10px] text-primary/70 mt-1 sm:mt-2 animate-blink">
                      ▲ TAP ▲
                    </div>
                  </div>
                </Button>
              </div>

              <div className="mt-4 sm:mt-6 space-y-2">
                <div className="flex justify-between text-[10px] sm:text-xs">
                  <span className="text-muted-foreground">STATUS</span>
                  <span className="text-secondary">ONLINE</span>
                </div>
                <Progress value={(clicks % 100)} className="h-1.5 sm:h-2" />
                <div className="flex justify-between text-[10px] sm:text-xs">
                  <span className="text-muted-foreground">EFFICIENCY</span>
                  <span className="text-accent">{Math.min(100, clicks % 100)}%</span>
                </div>
              </div>
            </Card>

            <Card className="p-3 sm:p-4 md:p-6 border-2 border-primary bg-card hidden sm:block">
              <div className="flex items-center gap-2 mb-4">
                <Icon name="Activity" size={16} className="text-primary" />
                <h2 className="text-sm md:text-lg text-primary">STATION LOG</h2>
              </div>
              <div className="space-y-2 text-xs font-mono max-h-32 overflow-y-auto">
                <div className="text-muted-foreground">
                  [{new Date().toLocaleTimeString()}] SYSTEM ONLINE
                </div>
                <div className="text-secondary">
                  [{new Date().toLocaleTimeString()}] REACTOR ACTIVE
                </div>
                {energyPerSecond > 0 && (
                  <div className="text-accent">
                    [{new Date().toLocaleTimeString()}] AUTO-GEN: +{energyPerSecond}/s
                  </div>
                )}
                {totalEnergy > 100 && (
                  <div className="text-primary">
                    [{new Date().toLocaleTimeString()}] MILESTONE: 100 ENERGY
                  </div>
                )}
              </div>
            </Card>
          </div>

          <div className="space-y-3 sm:space-y-4">
            <Card className="p-3 sm:p-4 border-2 border-secondary bg-card">
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                <Icon name="Wrench" size={16} className="text-secondary" />
                <h2 className="text-sm sm:text-base md:text-lg text-secondary">UPGRADES</h2>
              </div>

              <div className="space-y-2 sm:space-y-3">
                {upgrades.map((upgrade) => {
                  const canBuy = energy >= upgrade.cost;
                  
                  return (
                    <Button
                      key={upgrade.id}
                      onClick={() => buyUpgrade(upgrade)}
                      disabled={!canBuy}
                      className={`w-full p-2.5 sm:p-3 md:p-4 h-auto flex flex-col items-start gap-1.5 sm:gap-2 border-2 rounded-none ${
                        canBuy 
                          ? 'border-secondary bg-secondary/20 hover:bg-secondary/30 text-secondary' 
                          : 'border-muted bg-muted/10 text-muted-foreground opacity-50'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          <Icon name={upgrade.icon as any} size={14} />
                          <span className="text-[10px] sm:text-xs font-bold">{upgrade.name}</span>
                        </div>
                        <span className="text-[10px] sm:text-xs bg-background px-1.5 sm:px-2 py-0.5 sm:py-1 border border-current">
                          {upgrade.owned}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between w-full text-[8px] sm:text-[10px]">
                        <span>
                          {upgrade.id === 'click' ? `+${upgrade.power}/tap` : `+${upgrade.power}/s`}
                        </span>
                        <span className="flex items-center gap-0.5 sm:gap-1">
                          <Icon name="Zap" size={8} />
                          {upgrade.cost}
                        </span>
                      </div>
                    </Button>
                  );
                })}
              </div>
            </Card>

            <Card className="p-3 sm:p-4 border-2 border-accent bg-card">
              <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                <Icon name="Trophy" size={14} className="text-accent" />
                <h3 className="text-xs sm:text-sm text-accent">STATS</h3>
              </div>
              <div className="space-y-1.5 sm:space-y-2 text-[9px] sm:text-[10px]">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">TAPS:</span>
                  <span className="text-foreground">{clicks}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">UPGRADES:</span>
                  <span className="text-foreground">
                    {upgrades.reduce((sum, u) => sum + u.owned, 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">EFFICIENCY:</span>
                  <span className="text-foreground">
                    {energyPerSecond > 0 ? Math.floor((energyPerSecond / clicks) * 100) || 0 : 0}%
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}