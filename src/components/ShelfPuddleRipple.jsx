import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * ShelfPuddleRipple — "Benda Jatuh ke Genangan" Fluid Puddle Plop Effect
 * 
 * Features:
 * - Concentric water shockwave ripples expanding from drop point
 * - Splash micro-droplets popping upward in parabolic arcs
 * - Ethereal liquid sheen / fluid reflection across the shelf floor
 */
export function ShelfPuddleRipples({ triggerCount = 0, originX = 50, originY = 50 }) {
  const [rings, setRings] = useState([]);

  useEffect(() => {
    if (!triggerCount) return;
    const newRings = [
      { id: `${triggerCount}-r1`, delay: 0, scale: [0.15, 1.4, 2.4], opacity: [0.9, 0.4, 0], strokeWidth: 2.5 },
      { id: `${triggerCount}-r2`, delay: 0.12, scale: [0.15, 1.3, 2.1], opacity: [0.8, 0.35, 0], strokeWidth: 2 },
      { id: `${triggerCount}-r3`, delay: 0.24, scale: [0.15, 1.1, 1.8], opacity: [0.65, 0.25, 0], strokeWidth: 1.5 }
    ];
    setRings(newRings);
    const t = setTimeout(() => setRings([]), 1200);
    return () => clearTimeout(t);
  }, [triggerCount]);

  if (rings.length === 0) return null;

  return (
    <div style={{
      position: 'absolute',
      left: `${originX}%`,
      top: `${originY}%`,
      width: 0,
      height: 0,
      pointerEvents: 'none',
      zIndex: 5
    }}>
      {rings.map(r => (
        <motion.div
          key={r.id}
          initial={{ scale: 0.1, opacity: 0 }}
          animate={{ scale: r.scale, opacity: r.opacity }}
          transition={{ duration: 0.95, ease: [0.22, 1, 0.36, 1], delay: r.delay }}
          style={{
            position: 'absolute',
            left: -50,
            top: -50,
            width: 100,
            height: 100,
            borderRadius: '50%',
            border: `${r.strokeWidth}px solid #38bdf8`,
            boxShadow: '0 0 12px rgba(56, 189, 248, 0.5), inset 0 0 8px rgba(56, 189, 248, 0.3)'
          }}
        />
      ))}
    </div>
  );
}

/**
 * Water splash micro-droplets popping up when an item hits the puddle
 */
export function ShelfSplashDroplets({ triggerCount = 0 }) {
  const [droplets, setDroplets] = useState([]);

  useEffect(() => {
    if (!triggerCount) return;
    const items = [
      { id: `d1-${triggerCount}`, dx: -24, dy: -24, size: 4 },
      { id: `d2-${triggerCount}`, dx: -10, dy: -34, size: 5 },
      { id: `d3-${triggerCount}`, dx: 8, dy: -36, size: 5.5 },
      { id: `d4-${triggerCount}`, dx: 22, dy: -26, size: 4 },
      { id: `d5-${triggerCount}`, dx: 0, dy: -20, size: 3.5 }
    ];
    setDroplets(items);
    const t = setTimeout(() => setDroplets([]), 850);
    return () => clearTimeout(t);
  }, [triggerCount]);

  if (droplets.length === 0) return null;

  return (
    <div style={{
      position: 'absolute',
      left: '50%',
      top: '60%',
      width: 0,
      height: 0,
      pointerEvents: 'none',
      zIndex: 12
    }}>
      {droplets.map(d => (
        <motion.div
          key={d.id}
          initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
          animate={{
            opacity: [0, 1, 0.9, 0],
            scale: [0, 1.3, 1, 0.2],
            x: d.dx,
            y: d.dy
          }}
          transition={{ duration: 0.75, ease: [0.18, 0.89, 0.32, 1.25] }}
          style={{
            position: 'absolute',
            left: -d.size / 2,
            top: -d.size / 2,
            width: d.size,
            height: d.size,
            borderRadius: '50%',
            background: '#38bdf8',
            boxShadow: '0 0 6px #38bdf8'
          }}
        />
      ))}
    </div>
  );
}

/**
 * Ambient Liquid Puddle Canvas Background with subtle caustics & reflections
 */
export function ShelfPuddleBackdrop({ isDragOver = false }) {
  return (
    <div style={{
      position: 'absolute',
      inset: '10px 24px 18px 24px',
      borderRadius: 16,
      overflow: 'hidden',
      pointerEvents: 'none',
      zIndex: 1
    }}>
      {/* Gentle liquid puddle sheen */}
      <motion.div
        animate={{
          opacity: isDragOver ? [0.35, 0.6, 0.35] : [0.12, 0.24, 0.12],
          scale: [1, 1.03, 1]
        }}
        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at 50% 60%, rgba(14, 165, 233, 0.22), transparent 75%)',
          borderRadius: 16
        }}
      />
      {/* Fluid ripple line across the bottom */}
      <motion.div
        animate={{
          x: [-40, 40, -40],
          opacity: [0.2, 0.45, 0.2]
        }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        style={{
          position: 'absolute',
          bottom: 4,
          left: '20%',
          right: '20%',
          height: 1.5,
          background: 'linear-gradient(90deg, transparent, rgba(56, 189, 248, 0.5), transparent)',
          borderRadius: 999
        }}
      />
    </div>
  );
}

