'use client';

import { useEffect, useRef, useState } from 'react';
import { useTheme } from 'next-themes';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  opacity: number;
  connectionDistance: number;
}

interface Node {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  color: string;
  size: number;
  pulsePhase: number;
}

export function ParticleLogoLarge() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = 400;
    const height = 400;
    canvas.width = width;
    canvas.height = height;

    // Theme-based colors with enhanced palette
    const isDark = theme === 'dark' || theme === 'aurora' || theme === 'ocean' || theme === 'forest';
    const primaryColor = isDark ? '#60a5fa' : '#2563eb';
    const secondaryColor = isDark ? '#06b6d4' : '#0891b2';
    const accentColor = isDark ? '#a78bfa' : '#7c3aed';
    const tertiaryColor = isDark ? '#34d399' : '#10b981';

    let particles: Particle[] = [];
    let nodes: Node[] = [];
    let animationId: number;

    const initializeParticles = () => {
      particles = [];
      nodes = [];

      const centerX = width / 2;
      const centerY = height / 2;

      // Central node
      nodes.push({
        x: centerX,
        y: centerY,
        targetX: centerX,
        targetY: centerY,
        color: primaryColor,
        size: 8,
        pulsePhase: 0,
      });

      // Ring of nodes (6 nodes for larger scale)
      const ringNodeCount = 6;
      for (let i = 0; i < ringNodeCount; i++) {
        const angle = (i / ringNodeCount) * Math.PI * 2;
        const distance = 80;
        const color = i % 2 === 0 ? secondaryColor : accentColor;
        nodes.push({
          x: centerX + Math.cos(angle) * distance,
          y: centerY + Math.sin(angle) * distance,
          targetX: centerX + Math.cos(angle) * distance,
          targetY: centerY + Math.sin(angle) * distance,
          color: color,
          size: 5,
          pulsePhase: i * 0.3,
        });
      }

      // More particles for larger canvas
      for (let i = 0; i < 80; i++) {
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * 100;
        particles.push({
          x: centerX + Math.cos(angle) * distance,
          y: centerY + Math.sin(angle) * distance,
          vx: (Math.random() - 0.5) * 1.2,
          vy: (Math.random() - 0.5) * 1.2,
          radius: Math.random() * 1 + 0.3,
          color: [primaryColor, secondaryColor, accentColor, tertiaryColor][Math.floor(Math.random() * 4)],
          opacity: Math.random() * 0.4 + 0.2,
          connectionDistance: 100,
        });
      }
    };

    const updateParticles = (time: number) => {
      particles.forEach((particle) => {
        particle.x += particle.vx;
        particle.y += particle.vy;

        // Bounce off edges with slight damping
        if (particle.x < 0 || particle.x > width) {
          particle.vx *= -0.95;
          particle.x = Math.max(0, Math.min(width, particle.x));
        }
        if (particle.y < 0 || particle.y > height) {
          particle.vy *= -0.95;
          particle.y = Math.max(0, Math.min(height, particle.y));
        }

        // Pulsing opacity
        particle.opacity = 0.15 + 0.4 * Math.sin(time * 0.008 + particle.x * 0.01);
      });
    };

    const updateNodes = (time: number) => {
      const centerX = width / 2;
      const centerY = height / 2;

      nodes.forEach((node, idx) => {
        if (idx === 0) {
          // Central node with slight bobbing
          node.targetX = centerX + Math.sin(time * 0.004) * 8;
          node.targetY = centerY + Math.cos(time * 0.004) * 8;
        } else {
          // Ring nodes with orbital motion
          const nodeCount = nodes.length - 1;
          const baseAngle = ((idx - 1) / nodeCount) * Math.PI * 2;
          const angle = baseAngle + time * 0.002 + node.pulsePhase;
          const distance = 80 + Math.sin(time * 0.006 + node.pulsePhase) * 10;
          node.targetX = centerX + Math.cos(angle) * distance;
          node.targetY = centerY + Math.sin(angle) * distance;
        }

        // Smooth movement toward target
        node.x += (node.targetX - node.x) * 0.12;
        node.y += (node.targetY - node.y) * 0.12;
      });
    };

    const draw = (time: number) => {
      // Clear with fade effect
      ctx.fillStyle = `rgba(0, 0, 0, 0.02)`;
      ctx.fillRect(0, 0, width, height);

      updateParticles(time);
      updateNodes(time);

      // Draw connections between nodes with gradient
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[j].x - nodes[i].x;
          const dy = nodes[j].y - nodes[i].y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 150) {
            const gradient = ctx.createLinearGradient(nodes[i].x, nodes[i].y, nodes[j].x, nodes[j].y);
            gradient.addColorStop(0, nodes[i].color + '40');
            gradient.addColorStop(0.5, nodes[i].color + '20');
            gradient.addColorStop(1, nodes[j].color + '40');

            ctx.strokeStyle = gradient;
            ctx.globalAlpha = 0.3 * (1 - distance / 150);
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
          }
        }
      }
      ctx.globalAlpha = 1;

      // Draw particles with trail effect
      particles.forEach((particle) => {
        ctx.fillStyle = particle.color;
        ctx.globalAlpha = particle.opacity * 0.6;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.fill();

        // Glow halo
        ctx.globalAlpha = particle.opacity * 0.2;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius * 2.5, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;

      // Draw nodes with enhanced glow
      nodes.forEach((node, idx) => {
        // Outer glow (large)
        const glowSize = node.size * 4;
        const glowGradient = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, glowSize);
        glowGradient.addColorStop(0, node.color + '30');
        glowGradient.addColorStop(0.5, node.color + '10');
        glowGradient.addColorStop(1, node.color + '00');
        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(node.x, node.y, glowSize, 0, Math.PI * 2);
        ctx.fill();

        // Mid glow
        const midGlowSize = node.size * 2.5;
        const midGradient = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, midGlowSize);
        midGradient.addColorStop(0, node.color + '60');
        midGradient.addColorStop(1, node.color + '00');
        ctx.fillStyle = midGradient;
        ctx.beginPath();
        ctx.arc(node.x, node.y, midGlowSize, 0, Math.PI * 2);
        ctx.fill();

        // Core node
        ctx.fillStyle = node.color;
        ctx.globalAlpha = 0.95 + 0.05 * Math.sin(time * 0.005 + node.pulsePhase);
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.size, 0, Math.PI * 2);
        ctx.fill();

        // Highlight
        ctx.globalAlpha = 0.4;
        ctx.beginPath();
        ctx.arc(node.x - node.size * 0.3, node.y - node.size * 0.3, node.size * 0.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.globalAlpha = 1;
      });
    };

    initializeParticles();
    let startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      draw(elapsed);
      animationId = requestAnimationFrame(animate);
    };

    animate();

    // Handle window resize
    const handleResize = () => {
      if (canvas) {
        canvas.width = width;
        canvas.height = height;
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
    };
  }, [theme, mounted]);

  if (!mounted) {
    return <div className="h-96 w-96 rounded-lg bg-gradient-to-br from-primary to-blue-600 animate-pulse" />;
  }

  return (
    <div className="flex justify-center">
      <canvas
        ref={canvasRef}
        className="rounded-2xl shadow-2xl shadow-primary/30 hover:shadow-primary/50 transition-shadow duration-300"
        style={{
          imageRendering: 'auto',
          filter: 'drop-shadow(0 20px 25px rgba(0, 0, 0, 0.1))'
        }}
      />
    </div>
  );
}
