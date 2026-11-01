import React, { useEffect, useRef, useState } from 'react';
import { playClickSound } from '@/lib/audio';

interface DialloTerminalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface LogEntry {
  type: 'cmd' | 'resp' | 'error' | 'success';
  text: string;
}

export const DialloTerminal: React.FC<DialloTerminalProps> = ({ isOpen, onClose }) => {
  const [input, setInput] = useState('');
  const [logs, setLogs] = useState<LogEntry[]>([
    { type: 'resp', text: 'YOURCTF TELEMETRY SHELL v0.1.0' },
    { type: 'resp', text: 'Type "help" for a list of tactical commands.' },
  ]);
  const inputRef = useRef<HTMLInputElement>(null);
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  if (!isOpen) return null;

  const handleCommand = (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = input.trim().toLowerCase();
    if (!cmd) return;

    playClickSound('snap');
    const newLogs: LogEntry[] = [...logs, { type: 'cmd', text: `> ${input}` }];

    switch (cmd) {
      case 'help':
        newLogs.push({
          type: 'resp',
          text: 'AVAILABLE COMMANDS:\n  targets   - View active challenges & points\n  top       - View podium standings\n  rules     - Security & submission rules\n  status    - Backend telemetry check\n  clear     - Reset terminal screen\n  exit      - Close terminal',
        });
        break;

      case 'targets':
        newLogs.push({
          type: 'resp',
          text: 'ACTIVE TARGET OBJECTIVES:\n  [WEB]     Blog Vault (350 pts) - Medium\n  [WEB]     Cookie Jar (200 pts) - Easy\n  [CRYPTO]  Caesar\'s Lunch (150 pts) - Easy\n  [CRYPTO]  Pad Again (450 pts) - Hard\n  [PWN]     Echo Chamber (300 pts) - Medium\n  [FORENS]  Memory Lane (250 pts) - Medium',
        });
        break;

      case 'top':
        newLogs.push({
          type: 'resp',
          text: 'SCOREBOARD LEADERBOARD:\n  #1  Kernel Panic   - 2150 pts (9 solves)\n  #2  Cyber Zero     - 1850 pts (8 solves)\n  #3  Bit Shifters   - 1600 pts (7 solves)\n  #4  Null Pointers  - 1350 pts (6 solves)\n  #5  Shadow Byte    - 1100 pts (5 solves)',
        });
        break;

      case 'rules':
        newLogs.push({
          type: 'resp',
          text: 'RULES OF ENGAGEMENT:\n  1. Flags follow format: flag{...}\n  2. Brute forcing flags is prohibited & rate-limited.\n  3. Zero denial of service against competition infrastructure.',
        });
        break;

      case 'status':
        newLogs.push({
          type: 'success',
          text: '[ONLINE] API: http://localhost:4000/api/v1 (OK)\nDATABASE: SQLite dev.db (13 flags / 12 targets)\nLATENCY: 1ms (Localhost)',
        });
        break;

      case 'clear':
        setLogs([]);
        setInput('');
        return;

      case 'exit':
      case 'quit':
        onClose();
        return;

      default:
        newLogs.push({
          type: 'error',
          text: `Command not recognized: "${cmd}". Type "help" for tactical commands.`,
        });
        break;
    }

    setLogs(newLogs);
    setInput('');
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Command Terminal"
      className="fixed bottom-6 left-1/2 z-50 w-[min(640px,calc(100vw-32px))] -translate-x-1/2 border border-line bg-[#080808]/95 p-4 font-mono text-[12px] shadow-2xl backdrop-blur-md"
    >
      {/* Top Bar */}
      <div className="flex items-center justify-between border-b border-line pb-2 text-[11px] uppercase tracking-wider text-faint">
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-lit" />
          <span className="text-ink font-semibold">YOURCTF COMMAND SHELL</span>
        </div>
        <button
          onClick={() => {
            playClickSound('low');
            onClose();
          }}
          className="hover:text-ink text-faint transition-colors"
        >
          CLOSE <kbd className="border border-line px-1 text-[9px]">ESC</kbd>
        </button>
      </div>

      {/* Terminal Output Stream */}
      <div className="my-3 max-h-48 overflow-y-auto space-y-1.5 text-dim scrollbar-thin">
        {logs.map((log, i) => (
          <div
            key={i}
            className={`whitespace-pre-wrap leading-relaxed ${
              log.type === 'cmd'
                ? 'text-lit font-semibold'
                : log.type === 'error'
                ? 'text-alert'
                : log.type === 'success'
                ? 'text-cyan-lit'
                : 'text-dim'
            }`}
          >
            {log.text}
          </div>
        ))}
        <div ref={logEndRef} />
      </div>

      {/* Input Prompt */}
      <form onSubmit={handleCommand} className="flex items-center gap-2 pt-2 border-t border-line">
        <span className="text-lit font-bold">&gt;</span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type 'help' or command..."
          className="flex-1 bg-transparent text-ink placeholder:text-faint/50 outline-none caret-lit"
        />
        <button
          type="submit"
          className="text-[10px] text-faint hover:text-lit uppercase tracking-wider border border-line px-2 py-0.5"
        >
          RUN
        </button>
      </form>
    </div>
  );
};
