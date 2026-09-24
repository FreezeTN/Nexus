import React, { useEffect } from 'react';
import { BattlemapPing } from './battlemapTypes';

interface BattlemapPingLayerProps {
  pings: BattlemapPing[];
  cellSize: number;
}

export const BattlemapPingLayer: React.FC<BattlemapPingLayerProps> = ({ pings, cellSize }) => {
  return (
    <g className="pointer-events-none z-30">
      {pings.map((ping) => {
        const cx = (ping.x + 0.5) * cellSize;
        const cy = (ping.y + 0.5) * cellSize;
        const colLetter = String.fromCharCode(65 + ping.x);
        const coordLabel = `${colLetter}${ping.y + 1}`;
        const color = ping.color || '#f59e0b';

        return (
          <g key={ping.id} className="ping-beacon">
            {/* Primary radar sonar ripple 1 */}
            <circle
              cx={cx}
              cy={cy}
              r={cellSize * 0.4}
              fill="none"
              stroke={color}
              strokeWidth="2.5"
              className="animate-ping"
              style={{
                animationDuration: '1.4s',
                transformOrigin: `${cx}px ${cy}px`
              }}
            />

            {/* Secondary delayed expanding pulse */}
            <circle
              cx={cx}
              cy={cy}
              r={cellSize * 0.9}
              fill={`${color}15`}
              stroke={color}
              strokeWidth="1.5"
              strokeDasharray="4 3"
              className="animate-pulse"
            />

            {/* Central glowing ping blip */}
            <circle
              cx={cx}
              cy={cy}
              r="6"
              fill={color}
              stroke="#0c0a09"
              strokeWidth="2"
            />

            {/* Floating Coordinate and Author Label Badge */}
            <g transform={`translate(${cx}, ${cy - 24})`}>
              <rect
                x="-42"
                y="-18"
                width="84"
                height="22"
                rx="6"
                fill="#18181b"
                stroke={color}
                strokeWidth="1.5"
                className="shadow-2xl"
              />
              <text
                x="0"
                y="-3"
                textAnchor="middle"
                fill="#fafaf9"
                fontSize="11"
                fontWeight="bold"
                fontFamily="monospace"
              >
                📍 {coordLabel}
              </text>
              {ping.senderName && (
                <text
                  x="0"
                  y="14"
                  textAnchor="middle"
                  fill={color}
                  fontSize="9"
                  fontWeight="bold"
                  fontFamily="sans-serif"
                >
                  {ping.senderName}
                </text>
              )}
            </g>
          </g>
        );
      })}
    </g>
  );
};

/**
 * Play a high-resonance tactical sonar ping chime via Web Audio API
 */
export function playTacticalPingAudio() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    // Frequency sweep: 880Hz (A5) dropping quickly to 587Hz (D5) for a resonant tactical radar ping
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(587.33, ctx.currentTime + 0.35);

    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.45);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.46);

    // Second harmonic chime for rich tabletop tactile feel
    setTimeout(() => {
      try {
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(1174.66, ctx.currentTime);
        gain2.gain.setValueAtTime(0.08, ctx.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start();
        osc2.stop(ctx.currentTime + 0.26);
      } catch {
        // ignore audio failure
      }
    }, 45);
  } catch {
    // AudioContext may be restricted by browser policy before first interaction
  }
}
