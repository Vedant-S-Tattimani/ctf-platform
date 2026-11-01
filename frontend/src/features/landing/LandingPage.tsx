import { useEffect, useState } from 'react';
import { DialloHud } from '@/components/diallo/DialloHud';
import { DialloIntro } from '@/components/diallo/DialloIntro';
import { DialloLampLight } from '@/components/diallo/DialloLampLight';
import { DialloStage } from '@/components/diallo/DialloStage';
import { DialloTerminal } from '@/components/diallo/DialloTerminal';
import { DialloDisciplines } from './DialloDisciplines';
import { DialloHero } from './DialloHero';
import { DialloManifesto } from './DialloManifesto';
import { DialloOutro } from './DialloOutro';
import { DialloScoreboard } from './DialloScoreboard';
import { DialloWorkCards } from './DialloWorkCards';

export function LandingPage() {
  const [hasEntered, setHasEntered] = useState(false);
  const [isLit, setIsLit] = useState(true);
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [chapter, setChapter] = useState('01 // BRIEFING');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsTerminalOpen((prev) => !prev);
      } else if (e.key === 'Escape' && isTerminalOpen) {
        setIsTerminalOpen(false);
      }
    };

    const handleScroll = () => {
      const y = window.scrollY;
      const h = window.innerHeight;

      if (y < h * 0.7) {
        setChapter('01 // BRIEFING');
      } else if (y < h * 1.6) {
        setChapter('02 // ARCHITECTURE');
      } else if (y < h * 2.5) {
        setChapter('03 // DISCIPLINES');
      } else if (y < h * 3.5) {
        setChapter('04 // OPERATIONS');
      } else if (y < h * 4.5) {
        setChapter('05 // SCOREBOARD');
      } else {
        setChapter('06 // DISPATCH');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [isTerminalOpen]);

  return (
    <div className="relative min-h-screen bg-canvas text-primary selection:bg-lit selection:text-night overflow-x-hidden">
      {/* Intro Loading & "PULL THE CORD" screen (Screenshots 2 & 3) */}
      {!hasEntered && (
        <DialloIntro onComplete={() => setHasEntered(true)} />
      )}

      {/* 3D WebGL Room with Moving Lamp & Hacker Desk (Screenshots 1 & 4) */}
      <DialloStage isLit={isLit} />

      {/* Ambient Lamplight Fallback Atmosphere */}
      <DialloLampLight isLit={isLit} />

      {/* Fixed Telemetry HUD Chrome */}
      <DialloHud
        currentChapter={chapter}
        onOpenTerminal={() => setIsTerminalOpen((prev) => !prev)}
      />

      {/* Interactive Command Shell Drawer */}
      <DialloTerminal
        isOpen={isTerminalOpen}
        onClose={() => setIsTerminalOpen(false)}
      />

      {/* Page Content Flow */}
      <main className="relative z-10">
        <DialloHero
          isLit={isLit}
          onToggleLamp={() => setIsLit((prev) => !prev)}
        />
        <DialloManifesto />
        <DialloDisciplines />
        <DialloWorkCards />
        <DialloScoreboard />
        <DialloOutro />
      </main>
    </div>
  );
}

export default LandingPage;
