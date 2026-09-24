import React, { useEffect, useRef } from 'react';
import { WeatherEffectType } from './battlemapTypes';

interface WeatherCanvasLayerProps {
  weather: WeatherEffectType;
  width: number;
  height: number;
  shelteredCells?: string[];
  cellSize?: number;
  isEntirelyIndoors?: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  color: string;
  life: number;
  maxLife: number;
  extra?: number;
  rotation?: number;
  rotSpeed?: number;
  bounced?: boolean;
}

interface LightningBranch {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export const WeatherCanvasLayer: React.FC<WeatherCanvasLayerProps> = ({
  weather,
  width,
  height,
  shelteredCells = [],
  cellSize = 48,
  isEntirelyIndoors = false
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const flashAlphaRef = useRef<number>(0);
  const lightningBranchesRef = useRef<LightningBranch[]>([]);
  const shelteredCellsRef = useRef<string[]>(shelteredCells);
  shelteredCellsRef.current = shelteredCells;
  const cellSizeRef = useRef<number>(cellSize);
  cellSizeRef.current = cellSize;
  const isIndoorsRef = useRef<boolean>(isEntirelyIndoors);
  isIndoorsRef.current = isEntirelyIndoors;

  useEffect(() => {
    if (weather === 'none' || isEntirelyIndoors) {
      particlesRef.current = [];
      lightningBranchesRef.current = [];
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, width, height);
      }
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
        animFrameIdRef.current = null;
      }
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Generate lightning bolt path
    const generateLightning = (startX: number, startY: number, endY: number) => {
      const branches: LightningBranch[] = [];
      let curX = startX;
      let curY = startY;

      while (curY < endY) {
        const nextY = curY + 15 + Math.random() * 25;
        const nextX = curX + (Math.random() - 0.5) * 45;
        branches.push({ x1: curX, y1: curY, x2: nextX, y2: nextY });

        // Occasional branch offshoot
        if (Math.random() < 0.25) {
          const branchEndX = nextX + (Math.random() - 0.5) * 60;
          const branchEndY = nextY + 20 + Math.random() * 30;
          branches.push({ x1: nextX, y1: nextY, x2: branchEndX, y2: branchEndY });
        }

        curX = nextX;
        curY = nextY;
      }
      return branches;
    };

    // Determine particle count based on weather condition
    let count = 0;
    switch (weather) {
      case 'rain':
        count = 140;
        break;
      case 'storm':
        count = 220;
        break;
      case 'snow':
        count = 110;
        break;
      case 'blizzard':
        count = 260;
        break;
      case 'hail':
        count = 90;
        break;
      case 'wind':
        count = 65; // leaves and wind streaks
        break;
      case 'sandstorm':
        count = 240;
        break;
      case 'mist':
        count = 22;
        break;
      case 'embers':
        count = 80;
        break;
      case 'ashfall':
        count = 120;
        break;
      case 'acid_rain':
        count = 130;
        break;
      case 'blood_rain':
        count = 140;
        break;
      case 'arcane':
        count = 65;
        break;
      case 'sunbeams':
        count = 70; // celestial dust motes
        break;
      default:
        count = 0;
    }

    const particles: Particle[] = [];

    for (let i = 0; i < count; i++) {
      if (weather === 'rain') {
        particles.push({
          x: Math.random() * (width + 200) - 100,
          y: Math.random() * height,
          vx: -2.2,
          vy: 15 + Math.random() * 6,
          size: 14 + Math.random() * 8,
          alpha: 0.35 + Math.random() * 0.35,
          color: 'rgba(186, 230, 253, ',
          life: 0,
          maxLife: 100
        });
      } else if (weather === 'storm') {
        particles.push({
          x: Math.random() * (width + 300) - 150,
          y: Math.random() * height,
          vx: -5.5 - Math.random() * 2,
          vy: 20 + Math.random() * 8,
          size: 18 + Math.random() * 10,
          alpha: 0.45 + Math.random() * 0.35,
          color: 'rgba(199, 210, 254, ',
          life: 0,
          maxLife: 100
        });
      } else if (weather === 'snow') {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.5,
          vy: 0.8 + Math.random() * 1.4,
          size: 1.5 + Math.random() * 3,
          alpha: 0.4 + Math.random() * 0.5,
          color: '#ffffff',
          life: 0,
          maxLife: 100,
          extra: Math.random() * Math.PI * 2
        });
      } else if (weather === 'blizzard') {
        particles.push({
          x: Math.random() * (width + 300) - 100,
          y: Math.random() * height,
          vx: -7 - Math.random() * 5,
          vy: 2 + Math.random() * 3,
          size: 1 + Math.random() * 3.5,
          alpha: 0.5 + Math.random() * 0.4,
          color: '#ffffff',
          life: 0,
          maxLife: 100,
          extra: Math.random() * Math.PI * 2
        });
      } else if (weather === 'hail') {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: -1 + Math.random() * 0.5,
          vy: 16 + Math.random() * 8,
          size: 2.5 + Math.random() * 3,
          alpha: 0.75 + Math.random() * 0.25,
          color: '#cffafe',
          life: 0,
          maxLife: 100,
          bounced: false
        });
      } else if (weather === 'wind') {
        const leafColors = ['#f59e0b', '#d97706', '#b45309', '#ef4444', '#ca8a04'];
        const isLeaf = Math.random() > 0.4;
        particles.push({
          x: Math.random() * (width + 200) - 100,
          y: Math.random() * height,
          vx: -6 - Math.random() * 5,
          vy: (Math.random() - 0.4) * 2,
          size: isLeaf ? 5 + Math.random() * 4 : 20 + Math.random() * 30, // leaf size or wind streak length
          alpha: isLeaf ? 0.7 + Math.random() * 0.3 : 0.12 + Math.random() * 0.15,
          color: isLeaf ? leafColors[Math.floor(Math.random() * leafColors.length)] : 'rgba(226, 232, 240, ',
          life: 0,
          maxLife: 120,
          rotation: Math.random() * Math.PI * 2,
          rotSpeed: (Math.random() - 0.5) * 0.15,
          extra: isLeaf ? 1 : 0 // 1 = leaf, 0 = streak
        });
      } else if (weather === 'sandstorm') {
        const sandColors = ['#d97706', '#b45309', '#f59e0b', '#fbbf24', '#78350f'];
        particles.push({
          x: Math.random() * (width + 200) - 50,
          y: Math.random() * height,
          vx: -7 - Math.random() * 6,
          vy: 0.5 + (Math.random() - 0.5) * 2,
          size: 1.2 + Math.random() * 2.8,
          alpha: 0.35 + Math.random() * 0.45,
          color: sandColors[Math.floor(Math.random() * sandColors.length)],
          life: 0,
          maxLife: 90,
          extra: Math.random() * Math.PI * 2
        });
      } else if (weather === 'mist') {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: 0.2 + Math.random() * 0.3,
          vy: (Math.random() - 0.5) * 0.08,
          size: 70 + Math.random() * 80,
          alpha: 0.04 + Math.random() * 0.06,
          color: 'rgba(214, 211, 209, ',
          life: 0,
          maxLife: 100
        });
      } else if (weather === 'embers') {
        particles.push({
          x: Math.random() * width,
          y: height + Math.random() * 50,
          vx: (Math.random() - 0.5) * 1.2,
          vy: -(1.2 + Math.random() * 2.2),
          size: 1.5 + Math.random() * 3.5,
          alpha: 0.5 + Math.random() * 0.5,
          color: Math.random() > 0.3 ? '#f97316' : '#fbbf24',
          life: 0,
          maxLife: 120 + Math.random() * 80,
          extra: Math.random() * Math.PI * 2
        });
      } else if (weather === 'ashfall') {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.8,
          vy: 0.7 + Math.random() * 1.1,
          size: 1.5 + Math.random() * 3,
          alpha: 0.35 + Math.random() * 0.4,
          color: Math.random() > 0.4 ? '#78716c' : '#44403c',
          life: 0,
          maxLife: 120,
          extra: Math.random() * Math.PI * 2
        });
      } else if (weather === 'acid_rain') {
        particles.push({
          x: Math.random() * (width + 200) - 100,
          y: Math.random() * height,
          vx: -1.5,
          vy: 14 + Math.random() * 5,
          size: 12 + Math.random() * 7,
          alpha: 0.45 + Math.random() * 0.35,
          color: 'rgba(163, 230, 53, ',
          life: 0,
          maxLife: 100
        });
      } else if (weather === 'blood_rain') {
        particles.push({
          x: Math.random() * (width + 200) - 100,
          y: Math.random() * height,
          vx: -1.8,
          vy: 13 + Math.random() * 5,
          size: 13 + Math.random() * 8,
          alpha: 0.55 + Math.random() * 0.35,
          color: 'rgba(225, 29, 72, ',
          life: 0,
          maxLife: 100
        });
      } else if (weather === 'arcane') {
        const colors = ['#a855f7', '#38bdf8', '#34d399', '#f472b6', '#facc15'];
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.7,
          vy: (Math.random() - 0.5) * 0.7,
          size: 2 + Math.random() * 4,
          alpha: 0.3 + Math.random() * 0.6,
          color: colors[Math.floor(Math.random() * colors.length)],
          life: 0,
          maxLife: 150,
          extra: Math.random() * Math.PI * 2
        });
      } else if (weather === 'sunbeams') {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: 0.2 + (Math.random() - 0.5) * 0.4,
          vy: 0.1 + (Math.random() - 0.5) * 0.3,
          size: 1.5 + Math.random() * 2.5,
          alpha: 0.3 + Math.random() * 0.5,
          color: '#fef08a',
          life: 0,
          maxLife: 180,
          extra: Math.random() * Math.PI * 2
        });
      }
    }

    particlesRef.current = particles;

    let lastTime = performance.now();

    const render = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      ctx.clearRect(0, 0, width, height);

      // Atmospheric background shading per weather type
      if (weather === 'storm') {
        // Dark storm gloom
        ctx.fillStyle = 'rgba(15, 23, 42, 0.14)';
        ctx.fillRect(0, 0, width, height);

        // Thunderstorm lightning flash and forked bolts
        if (Math.random() < 0.003) {
          flashAlphaRef.current = 0.45;
          const startX = Math.random() * width;
          lightningBranchesRef.current = generateLightning(startX, 0, height * (0.6 + Math.random() * 0.4));
        }

        if (flashAlphaRef.current > 0.01) {
          ctx.fillStyle = `rgba(224, 231, 255, ${flashAlphaRef.current})`;
          ctx.fillRect(0, 0, width, height);

          // Draw lightning bolt
          if (lightningBranchesRef.current.length > 0) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(255, 255, 255, ${flashAlphaRef.current * 2})`;
            ctx.lineWidth = 2.5;
            ctx.shadowBlur = 14;
            ctx.shadowColor = '#818cf8';

            for (const branch of lightningBranchesRef.current) {
              ctx.moveTo(branch.x1, branch.y1);
              ctx.lineTo(branch.x2, branch.y2);
            }
            ctx.stroke();
            ctx.shadowBlur = 0;
          }

          flashAlphaRef.current *= 0.78;
        } else {
          lightningBranchesRef.current = [];
        }
      } else if (weather === 'blizzard') {
        // Cold blue-white frost haze
        ctx.fillStyle = 'rgba(224, 242, 254, 0.12)';
        ctx.fillRect(0, 0, width, height);
      } else if (weather === 'sandstorm') {
        // Amber desert dust haze
        ctx.fillStyle = 'rgba(180, 83, 9, 0.14)';
        ctx.fillRect(0, 0, width, height);
      } else if (weather === 'blood_rain') {
        // Eerie crimson miasma
        ctx.fillStyle = 'rgba(136, 19, 55, 0.12)';
        ctx.fillRect(0, 0, width, height);
      } else if (weather === 'sunbeams') {
        // Diagonal golden celestial sunbeams
        const numBeams = 4;
        for (let b = 0; b < numBeams; b++) {
          const beamX = (width / numBeams) * b + 100;
          const grad = ctx.createLinearGradient(beamX, 0, beamX - 250, height);
          grad.addColorStop(0, 'rgba(254, 240, 138, 0.14)');
          grad.addColorStop(0.5, 'rgba(253, 224, 71, 0.08)');
          grad.addColorStop(1, 'rgba(254, 240, 138, 0)');

          ctx.beginPath();
          ctx.moveTo(beamX - 40, 0);
          ctx.lineTo(beamX + 80, 0);
          ctx.lineTo(beamX - 160, height);
          ctx.lineTo(beamX - 280, height);
          ctx.closePath();
          ctx.fillStyle = grad;
          ctx.fill();
        }
      }

      // Update and draw particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        if (weather === 'rain' || weather === 'storm') {
          p.x += p.vx;
          p.y += p.vy;

          if (p.y > height || p.x < -100) {
            p.y = -20;
            p.x = Math.random() * (width + 300) - 100;
          }

          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x + p.vx * 1.5, p.y + p.size);
          ctx.strokeStyle = `${p.color}${p.alpha})`;
          ctx.lineWidth = weather === 'storm' ? 1.6 : 1.2;
          ctx.stroke();

          // Floor splash ripple
          if (p.y > height - 60 && Math.random() < 0.08) {
            ctx.beginPath();
            ctx.ellipse(p.x, p.y, 4, 1.8, 0, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(186, 230, 253, ${p.alpha * 0.6})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        } else if (weather === 'snow') {
          p.extra = (p.extra || 0) + dt * 1.8;
          p.x += p.vx + Math.sin(p.extra) * 0.6;
          p.y += p.vy;

          if (p.y > height) {
            p.y = -10;
            p.x = Math.random() * width;
          }
          if (p.x < 0) p.x = width;
          if (p.x > width) p.x = 0;

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha})`;
          ctx.fill();
        } else if (weather === 'blizzard') {
          p.extra = (p.extra || 0) + dt * 3.5;
          p.x += p.vx;
          p.y += p.vy + Math.sin(p.extra) * 1.2;

          if (p.x < -50 || p.y > height + 20) {
            p.x = width + 20 + Math.random() * 100;
            p.y = Math.random() * height;
          }

          ctx.beginPath();
          // Draw horizontal snow needle streak
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x - p.size * 3.5, p.y + (p.vy / p.vx) * 3);
          ctx.strokeStyle = `rgba(255, 255, 255, ${p.alpha})`;
          ctx.lineWidth = p.size > 2.5 ? 1.8 : 1.0;
          ctx.stroke();
        } else if (weather === 'hail') {
          p.x += p.vx;
          p.y += p.vy;

          // Bouncing hailstone logic
          if (p.y > height - 15) {
            if (!p.bounced) {
              p.vy = -p.vy * 0.35; // bounce up
              p.vx = (Math.random() - 0.5) * 4;
              p.bounced = true;
            } else {
              p.y = -20;
              p.x = Math.random() * width;
              p.vy = 16 + Math.random() * 8;
              p.vx = -1 + Math.random() * 0.5;
              p.bounced = false;
            }
          }

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = p.alpha;
          ctx.fill();
          ctx.globalAlpha = 1;
        } else if (weather === 'wind') {
          p.x += p.vx;
          p.y += p.vy;

          if (p.x < -100) {
            p.x = width + 50;
            p.y = Math.random() * height;
          }

          if (p.extra === 1) {
            // Tumbling autumn leaf
            p.rotation = (p.rotation || 0) + (p.rotSpeed || 0.05);
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rotation);
            ctx.beginPath();
            ctx.ellipse(0, 0, p.size, p.size * 0.5, 0, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.alpha;
            ctx.fill();
            ctx.restore();
          } else {
            // Wind speed streak
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p.x + p.size, p.y);
            ctx.strokeStyle = `${p.color}${p.alpha})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        } else if (weather === 'sandstorm') {
          p.extra = (p.extra || 0) + dt * 4;
          p.x += p.vx;
          p.y += p.vy + Math.sin(p.extra) * 0.8;

          if (p.x < -50) {
            p.x = width + 30;
            p.y = Math.random() * height;
          }

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = p.alpha;
          ctx.fill();
          ctx.globalAlpha = 1;
        } else if (weather === 'mist') {
          p.x += p.vx;
          p.y += p.vy;

          if (p.x > width + p.size) {
            p.x = -p.size;
            p.y = Math.random() * height;
          }

          const grad = ctx.createRadialGradient(p.x, p.y, p.size * 0.1, p.x, p.y, p.size);
          grad.addColorStop(0, `${p.color}${p.alpha})`);
          grad.addColorStop(1, `${p.color}0)`);

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = grad;
          ctx.fill();
        } else if (weather === 'embers') {
          p.extra = (p.extra || 0) + dt * 2.5;
          p.x += p.vx + Math.cos(p.extra) * 0.8;
          p.y += p.vy;
          p.life++;

          if (p.y < -10 || p.life > p.maxLife) {
            p.y = height + 10;
            p.x = Math.random() * width;
            p.life = 0;
          }

          const curAlpha = p.alpha * Math.max(0, 1 - p.life / p.maxLife);
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = curAlpha;
          ctx.fill();

          if (p.size > 2.5) {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * 2.2, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(249, 115, 22, 0.15)';
            ctx.fill();
          }
          ctx.globalAlpha = 1;
        } else if (weather === 'ashfall') {
          p.extra = (p.extra || 0) + dt * 1.5;
          p.x += p.vx + Math.sin(p.extra) * 0.5;
          p.y += p.vy;

          if (p.y > height) {
            p.y = -10;
            p.x = Math.random() * width;
          }

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = p.alpha;
          ctx.fill();
          ctx.globalAlpha = 1;
        } else if (weather === 'acid_rain') {
          p.x += p.vx;
          p.y += p.vy;

          if (p.y > height || p.x < -100) {
            p.y = -20;
            p.x = Math.random() * (width + 200) - 100;
          }

          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x + p.vx * 1.5, p.y + p.size);
          ctx.strokeStyle = `${p.color}${p.alpha})`;
          ctx.lineWidth = 1.3;
          ctx.stroke();

          // Sizzling acid puff on ground
          if (p.y > height - 40 && Math.random() < 0.09) {
            ctx.beginPath();
            ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(163, 230, 53, ${p.alpha * 0.7})`;
            ctx.fill();
          }
        } else if (weather === 'blood_rain') {
          p.x += p.vx;
          p.y += p.vy;

          if (p.y > height || p.x < -100) {
            p.y = -20;
            p.x = Math.random() * (width + 200) - 100;
          }

          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x + p.vx * 1.6, p.y + p.size);
          ctx.strokeStyle = `${p.color}${p.alpha})`;
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Crimson blood splash
          if (p.y > height - 40 && Math.random() < 0.08) {
            ctx.beginPath();
            ctx.ellipse(p.x, p.y, 4.5, 2, 0, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(225, 29, 72, ${p.alpha * 0.7})`;
            ctx.fill();
          }
        } else if (weather === 'arcane') {
          p.extra = (p.extra || 0) + dt * 1.5;
          p.x += p.vx + Math.sin(p.extra) * 0.4;
          p.y += p.vy + Math.cos(p.extra * 0.8) * 0.4;

          if (p.x < 0) p.x = width;
          if (p.x > width) p.x = 0;
          if (p.y < 0) p.y = height;
          if (p.y > height) p.y = 0;

          const pulse = (Math.sin(p.extra * 2) + 1) / 2;
          const curAlpha = 0.2 + p.alpha * 0.8 * (0.6 + pulse * 0.4);

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * (0.8 + pulse * 0.4), 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = curAlpha;
          ctx.shadowBlur = 8;
          ctx.shadowColor = p.color;
          ctx.fill();
          ctx.shadowBlur = 0;
          ctx.globalAlpha = 1;
        } else if (weather === 'sunbeams') {
          p.extra = (p.extra || 0) + dt * 1.2;
          p.x += p.vx + Math.sin(p.extra) * 0.3;
          p.y += p.vy + Math.cos(p.extra * 0.7) * 0.25;

          if (p.x < 0) p.x = width;
          if (p.x > width) p.x = 0;
          if (p.y < 0) p.y = height;
          if (p.y > height) p.y = 0;

          const shimmer = (Math.sin(p.extra * 3) + 1) / 2;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * (0.8 + shimmer * 0.4), 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = p.alpha * (0.5 + shimmer * 0.5);
          ctx.shadowBlur = 6;
          ctx.shadowColor = '#fef08a';
          ctx.fill();
          ctx.shadowBlur = 0;
          ctx.globalAlpha = 1;
        }
      }

      // 5e RAW: Mask out sheltered indoor rooms/caverns from overhead weather
      const sheltered = shelteredCellsRef.current;
      if (sheltered && sheltered.length > 0) {
        const sz = cellSizeRef.current;
        for (let i = 0; i < sheltered.length; i++) {
          const parts = sheltered[i].split(',');
          const cx = parseInt(parts[0], 10) * sz;
          const cy = parseInt(parts[1], 10) * sz;
          ctx.clearRect(cx, cy, sz, sz);
        }
      }

      animFrameIdRef.current = requestAnimationFrame(render);
    };

    animFrameIdRef.current = requestAnimationFrame(render);

    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [weather, width, height, isEntirelyIndoors]);

  if (weather === 'none' || isEntirelyIndoors) return null;

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="absolute inset-0 pointer-events-none z-10"
      style={{
        width: `${width}px`,
        height: `${height}px`
      }}
    />
  );
};
