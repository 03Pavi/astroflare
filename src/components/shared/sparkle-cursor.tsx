'use client';

import { useEffect, useRef } from 'react';

export default function SparkleCursor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width: number, height: number;
    let particles: Particle[] = [];
    const mouse = { x: -100, y: -100, active: false };
    let animationFrameId: number;

    // Configuration - specific to Cosmic Insight theme
    const colors = ['#F59E0B', '#FFF', '#06B6D4', '#a490c2']; // Gold, White, Cyan, Lavender
    const particleCount = 2; // How many particles to create per move event

    function init() {
      resize();
      window.addEventListener('resize', resize);
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('touchmove', handleTouchMove);

      animate();
    }

    function resize() {
      width = window.innerWidth;
      height = window.innerHeight;
      if (canvas) {
        canvas.width = width;
        canvas.height = height;
      }
    }

    function handleMouseMove(e: MouseEvent) {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      createParticles();
    }

    function handleTouchMove(e: TouchEvent) {
      if (e.touches.length > 0) {
        mouse.x = e.touches[0].clientX;
        mouse.y = e.touches[0].clientY;
        createParticles();
      }
    }

    class Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      maxLife: number;
      life: number;
      color: string;
      rot: number;
      rotSpeed: number;

      constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
        // Random velocity
        this.vx = (Math.random() - 0.5) * 4;
        this.vy = (Math.random() - 0.5) * 4;
        // Random size
        this.size = Math.random() * 3 + 1;
        this.maxLife = Math.random() * 40 + 20;
        this.life = this.maxLife;
        this.color = colors[Math.floor(Math.random() * colors.length)];
        this.rot = Math.random() * Math.PI * 2;
        this.rotSpeed = (Math.random() - 0.5) * 0.2;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.05; // Gentle gravity
        this.life--;
        this.rot += this.rotSpeed;
        this.size *= 0.96; // Shrink over time
      }

      draw() {
        if (!ctx) return;
        const opacity = this.life / this.maxLife;
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rot);
        ctx.globalAlpha = opacity;
        ctx.fillStyle = this.color;

        // Draw a 4-pointed star
        ctx.beginPath();
        for (let i = 0; i < 4; i++) {
          ctx.lineTo(0, -this.size * 2);
          ctx.rotate(Math.PI / 4);
          ctx.lineTo(0, -this.size / 2);
          ctx.rotate(Math.PI / 4);
        }
        ctx.closePath();
        ctx.fill();

        // Add a small glow
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;

        ctx.restore();
      }
    }

    function createParticles() {
      for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle(mouse.x, mouse.y));
      }
    }

    function animate() {
      if (!ctx) return;
      // Semi-transparent clear for a slight motion blur effect
      ctx.clearRect(0, 0, width, height);

      for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update();
        particles[i].draw();

        if (particles[i].life <= 0 || particles[i].size <= 0.2) {
          particles.splice(i, 1);
        }
      }

      animationFrameId = requestAnimationFrame(animate);
    }

    // Start the engine
    init();

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        pointerEvents: 'none',
        zIndex: 9999,
      }}
    />
  );
}
