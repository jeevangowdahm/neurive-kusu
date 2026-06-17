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
}

export function ParticleLogo() {
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

    const width = 32;
    const height = 32;
    canvas.width = width;
    canvas.height = height;

    // Theme-based colors
    const isDark = theme === 'dark' || theme === 'aurora' || theme === 'ocean' || theme === 'forest';
    const primaryColor = isDark ? '#60a5fa' : '#2563eb';
    const secondaryColor = isDark ? '#06b6d4' : '#0891b2';
    const accentColor = isDark ? '#a78bfa' : '#7c3aed';

    let particles: Particle[] = [];
    let nodes: Node[] = [];
    let animationId: number;

    const initializeParticles = () => {
      particles = [];
      nodes = [];

      const centerX = width / 2;
      const centerY = height / 2;

      nodes.push({
        x: centerX,
        y: centerY,
        targetX: centerX,
        targetY: centerY,
        color: primaryColor,
        size: 2.5,
      });

      const branchCount = 4;
      for (let i = 0; i < branchCount; i++) {
        const angle = (i / branchCount) * Math.PI * 2;
        const distance = 8;
        nodes.push({
          x: centerX + Math.cos(angle) * distance,
          y: centerY + Math.sin(angle) * distance,
          targetX: centerX + Math.cos(angle) * distance,
          targetY: centerY + Math.sin(angle) * distance,
          color: secondaryColor,
          size: 1.5,
        });
      }

      for (let i = 0; i < 20; i++) {
        particles.push({
          x: centerX + (Math.random() - 0.5) * 8,
          y: centerY + (Math.random() - 0.5) * 8,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          radius: Math.random() * 0.3 + 0.1,
          color: Math.random() > 0.5 ? primaryColor : secondaryColor,
          opacity: Math.random() * 0.5 + 0.2,
          connectionDistance: 6,
        });
      }
    };

    const updateParticles = (time: number) => {
      particles.forEach((particle) => {
        particle.x += particle.vx;
        particle.y += particle.vy;

        if (particle.x < 0 || particle.x > width) particle.vx *= -1;
        if (particle.y < 0 || particle.y > height) particle.vy *= -1;

        particle.x = Math.max(0, Math.min(width, particle.x));
        particle.y = Math.max(0, Math.min(height, particle.y));

        particle.opacity = 0.2 + 0.3 * Math.sin(time * 0.01 + particle.x);
      });
    };

    const updateNodes = (time: number) => {
      nodes.forEach((node, idx) => {
        if (idx === 0) {
          node.targetX = width / 2 + Math.sin(time * 0.005) * 2;
          node.targetY = height / 2 + Math.cos(time * 0.005) * 2;
        } else {
          const angle = ((idx - 1) / (nodes.length - 1)) * Math.PI * 2 + time * 0.002;
          const distance = 8;
          node.targetX = width / 2 + Math.cos(angle) * distance;
          node.targetY = height / 2 + Math.sin(angle) * distance;
        }

        node.x += (node.targetX - node.x) * 0.15;
        node.y += (node.targetY - node.y) * 0.15;
      });
    };

    const draw = (time: number) => {
      ctx.fillStyle = 'transparent';
      ctx.clearRect(0, 0, width, height);

      updateParticles(time);
      updateNodes(time);

      // Draw connections between nodes
      ctx.strokeStyle = primaryColor;
      ctx.globalAlpha = 0.2;
      ctx.lineWidth = 0.5;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[j].x - nodes[i].x;
          const dy = nodes[j].y - nodes[i].y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance < 12) {
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
          }
        }
      }
      ctx.globalAlpha = 1;

      // Draw particles
      particles.forEach((particle) => {
        ctx.fillStyle = particle.color;
        ctx.globalAlpha = particle.opacity;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;

      // Draw nodes with glow
      nodes.forEach((node) => {
        const glowSize = node.size * 2.5;
        const gradient = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, glowSize);
        gradient.addColorStop(0, node.color + '40');
        gradient.addColorStop(1, node.color + '00');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(node.x, node.y, glowSize, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = node.color;
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.size, 0, Math.PI * 2);
        ctx.fill();
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

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [theme, mounted]);

  if (!mounted) {
    return <div className="h-8 w-8 rounded-lg bg-primary" />;
  }

  return (
    <canvas
      ref={canvasRef}
      className="h-8 w-8 animate-pulse-slow"
      style={{ imageRendering: 'pixelated' }}
    />
  );
}
