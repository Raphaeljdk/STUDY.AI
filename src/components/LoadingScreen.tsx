'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Deterministic seeded random — same values on server and client
function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/**
 * Japanese-themed loading screen with cherry blossom petals,
 * bonsai silhouette, and the app logo with a dragon-like entrance.
 * Shows on initial app load and fades out when ready.
 */
export function LoadingScreen() {
  const [visible, setVisible] = useState(true);
  const [hiding, setHiding] = useState(false);

  // Deterministic petal positions — no hydration mismatch
  const petals = useMemo(() => {
    const rng = seededRandom(42);
    return Array.from({ length: 25 }, () => ({
      left: rng() * 100,
      delay: rng() * 5,
      duration: 4 + rng() * 6,
      opacity: 0.3 + rng() * 0.5,
      scale: 0.5 + rng() * 0.8,
      rotate: rng() * 360,
    }));
  }, []);

  useEffect(() => {
    // Hide loading screen once the page is fully loaded
    const hide = () => {
      setHiding(true);
      setTimeout(() => setVisible(false), 800);
    };

    if (document.readyState === 'complete') {
      // Minimum display time so the animation is visible
      const timer = setTimeout(hide, 1800);
      return () => clearTimeout(timer);
    } else {
      window.addEventListener('load', hide);
      return () => window.removeEventListener('load', hide);
    }
  }, []);

  if (!visible) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: hiding ? 0 : 1 }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
          className="fixed inset-0 z-[99999] flex flex-col items-center justify-center overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)' }}
        >
          {/* Sakura / Cherry Blossom Petals */}
          <div className="sakura-petals" aria-hidden="true">
            {petals.map((p, i) => (
              <div
                key={i}
                className="sakura-petal"
                style={{
                  left: `${p.left}%`,
                  animationDelay: `${p.delay}s`,
                  animationDuration: `${p.duration}s`,
                  opacity: p.opacity,
                  transform: `scale(${p.scale}) rotate(${p.rotate}deg)`,
                }}
              />
            ))}
          </div>

          {/* Bonsai Tree Silhouette */}
          <div className="bonsai-container" aria-hidden="true">
            <svg viewBox="0 0 200 260" className="bonsai-tree" fill="none">
              {/* Pot */}
              <rect x="55" y="230" width="90" height="20" rx="3" fill="#8B4513" opacity="0.4" />
              <rect x="50" y="225" width="100" height="10" rx="5" fill="#A0522D" opacity="0.4" />
              {/* Trunk */}
              <path d="M100 225 Q95 200 85 180 Q80 165 90 155 Q85 140 95 125 Q90 110 100 95" 
                    stroke="#8B7355" strokeWidth="4" fill="none" opacity="0.5" strokeLinecap="round" />
              {/* Main branches */}
              <path d="M95 170 Q70 155 45 145" stroke="#8B7355" strokeWidth="2.5" fill="none" opacity="0.4" strokeLinecap="round" />
              <path d="M90 140 Q110 120 140 115" stroke="#8B7355" strokeWidth="2" fill="none" opacity="0.4" strokeLinecap="round" />
              <path d="M100 110 Q80 95 55 90" stroke="#8B7355" strokeWidth="2" fill="none" opacity="0.4" strokeLinecap="round" />
              <path d="M100 95 Q120 80 145 75" stroke="#8B7355" strokeWidth="1.5" fill="none" opacity="0.3" strokeLinecap="round" />
              {/* Foliage clouds */}
              <ellipse cx="45" cy="140" rx="30" ry="18" fill="#2d5016" opacity="0.25" />
              <ellipse cx="140" cy="110" rx="28" ry="16" fill="#2d5016" opacity="0.2" />
              <ellipse cx="55" cy="85" rx="25" ry="15" fill="#2d5016" opacity="0.2" />
              <ellipse cx="145" cy="70" rx="22" ry="13" fill="#2d5016" opacity="0.18" />
              <ellipse cx="100" cy="80" rx="35" ry="22" fill="#2d5016" opacity="0.22" />
              <ellipse cx="80" cy="155" rx="25" ry="14" fill="#2d5016" opacity="0.2" />
              <ellipse cx="120" cy="90" rx="20" ry="12" fill="#2d5016" opacity="0.18" />
            </svg>
          </div>

          {/* Logo with rotating animation */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
            className="relative z-10"
          >
            <div className="logo-glow" />
            <img
              src="/studyai-logo.png"
              alt="StudyAI"
              className="loading-logo"
              width={120}
              height={120}
            />
          </motion.div>

          {/* Brand name */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1 }}
            className="mt-6 text-lg font-light tracking-[0.3em] text-white/80 uppercase"
            style={{ fontFamily: 'var(--font-serif-jp), serif' }}
          >
            Study AI
          </motion.p>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            transition={{ duration: 1, delay: 1.3 }}
            className="mt-2 text-xs tracking-widest text-white/40"
          >
            A beleza de aprender na imperfeição
          </motion.p>

          {/* Loading bar */}
          <motion.div
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ duration: 1.5, delay: 0.5, ease: 'easeInOut' }}
            className="mt-8 h-0.5 w-32 origin-left rounded-full bg-gradient-to-r from-pink-400/60 via-amber-400/60 to-pink-400/60"
          />

          {/* Inline styles for animations */}
          <style jsx>{`
            .sakura-petals {
              position: absolute;
              inset: 0;
              pointer-events: none;
              overflow: hidden;
            }

            .sakura-petal {
              position: absolute;
              top: -20px;
              width: 10px;
              height: 10px;
              background: radial-gradient(ellipse at center, #ffb7c5 0%, #ff8fa3 60%, transparent 100%);
              border-radius: 50% 0 50% 0;
              animation: sakura-fall linear infinite;
            }

            @keyframes sakura-fall {
              0% {
                transform: translateY(-20px) rotate(0deg) scale(var(--scale, 1));
                opacity: 0;
              }
              10% {
                opacity: 1;
              }
              90% {
                opacity: 0.6;
              }
              100% {
                transform: translateY(105vh) rotate(720deg);
                opacity: 0;
              }
            }

            .bonsai-container {
              position: absolute;
              bottom: 0;
              left: 0;
              width: 200px;
              height: 260px;
              opacity: 0.15;
              pointer-events: none;
            }

            @media (min-width: 768px) {
              .bonsai-container {
                left: 5%;
                width: 280px;
                height: 360px;
                opacity: 0.12;
              }
            }

            .bonsai-tree {
              width: 100%;
              height: 100%;
            }

            .loading-logo {
              border-radius: 24px;
              animation: logo-float 3s ease-in-out infinite;
              filter: drop-shadow(0 0 30px rgba(255, 183, 197, 0.3));
            }

            @keyframes logo-float {
              0%, 100% { transform: translateY(0); }
              50% { transform: translateY(-8px); }
            }

            .logo-glow {
              position: absolute;
              inset: -20px;
              border-radius: 40px;
              background: radial-gradient(circle, rgba(255, 183, 197, 0.15) 0%, transparent 70%);
              animation: glow-pulse 2s ease-in-out infinite;
            }

            @keyframes glow-pulse {
              0%, 100% { transform: scale(1); opacity: 0.5; }
              50% { transform: scale(1.2); opacity: 1; }
            }
          `}</style>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
