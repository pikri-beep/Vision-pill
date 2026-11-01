import React from "react";
import { motion } from "framer-motion";
import { Zap, AlertTriangle, ShieldCheck } from "lucide-react";

/**
 * LiquidBatteryHub — Funimated v3.0 Skeuomorphic Liquid Battery Cell
 * 
 * Features:
 * - 3-Layer organic fluid sine wave geometry with parallax timing
 * - Electrolyte micro-bubbles rising and popping at the liquid crest
 * - Dynamic Charging state: glowing neon lightning current, upward energy particle stream, energetic emerald/cyan glow
 * - Dynamic Low-Battery state (< 25%): warning crimson fluid, low-energy cartoon jitter/tremor, pulse danger beacon
 * - Detailed chamber terminal cap, glass reflection sheen, level tick marks, and tactile power health chip
 */
export default function LiquidBatteryHub({ percent = 80, charging = false }) {
  const isLow = percent < 25 && !charging;
  const isFull = percent >= 95;

  // Fluid theme colors based on state
  const fluidColor = charging
    ? "#22c55e"
    : isLow
    ? "#f43f5e"
    : "#10b981";

  const fluidColorDeep = charging
    ? "#15803d"
    : isLow
    ? "#be123c"
    : "#047857";

  const glowAura = charging
    ? "rgba(34, 197, 94, 0.45)"
    : isLow
    ? "rgba(244, 63, 94, 0.45)"
    : "rgba(16, 185, 129, 0.25)";

  const fillScale = Math.max(0.08, Math.min(1, percent / 100));

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 10px',
      userSelect: 'none',
      boxSizing: 'border-box'
    }}>
      {/* Left: Skeuomorphic Glass Capsule with Liquid Fluid Waves */}
      <motion.div
        animate={isLow ? {
          rotate: [0, -1.5, 1.5, -1, 1, 0],
          y: [0, 1, -1, 0]
        } : charging ? {
          scale: [1, 1.02, 1],
          y: [0, -1, 0]
        } : {
          y: [0, -1.5, 0]
        }}
        transition={{
          duration: isLow ? 1.4 : charging ? 1.8 : 3.2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        style={{
          position: 'relative',
          width: 140,
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}
      >
        {/* Ambient Underglow Aura */}
        <motion.div
          animate={{
            scale: charging ? [1, 1.15, 1] : [1, 1.06, 1],
            opacity: charging ? [0.6, 0.9, 0.6] : [0.4, 0.6, 0.4]
          }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          style={{
            position: 'absolute',
            inset: 2,
            borderRadius: 18,
            background: `radial-gradient(ellipse at center, ${glowAura}, transparent 70%)`,
            pointerEvents: 'none',
            zIndex: 0
          }}
        />

        {/* Liquid Battery SVG Cell */}
        <svg
          width="132"
          height="58"
          viewBox="0 0 132 58"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ overflow: 'visible', zIndex: 1 }}
        >
          <defs>
            <linearGradient id="batteryGlassGrad" x1="0" y1="0" x2="114" y2="58" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="rgba(255, 255, 255, 0.14)" />
              <stop offset="100%" stopColor="rgba(255, 255, 255, 0.03)" />
            </linearGradient>

            <linearGradient id="fluidGradFront" x1="0" y1="0" x2="114" y2="0" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor={fluidColorDeep} />
              <stop offset="100%" stopColor={fluidColor} />
            </linearGradient>

            <linearGradient id="fluidGradBack" x1="0" y1="0" x2="114" y2="0" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor={fluidColorDeep} stopOpacity="0.6" />
              <stop offset="100%" stopColor={fluidColor} stopOpacity="0.75" />
            </linearGradient>

            {/* Chamber Clip Path so liquid stays strictly inside rounded capsule */}
            <clipPath id="chamberClip">
              <rect x="6" y="6" width="102" height="46" rx="12" />
            </clipPath>

            {/* Glowing filter for charging bolt */}
            <filter id="chargingGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Battery Outer Glass Housing */}
          <rect
            x="5"
            y="5"
            width="104"
            height="48"
            rx="14"
            fill="url(#batteryGlassGrad)"
            stroke="rgba(255, 255, 255, 0.22)"
            strokeWidth="1.5"
          />

          {/* Terminal Positive Pole (+) Cap */}
          <path
            d="M 110,21 C 113,21 115,23 115,26 L 115,32 C 115,35 113,37 110,37 Z"
            fill="rgba(255, 255, 255, 0.28)"
            stroke="rgba(255, 255, 255, 0.25)"
            strokeWidth="1"
          />

          {/* Liquid Contents (Clipped inside the glass chamber) */}
          <g clipPath="url(#chamberClip)">
            {/* Background wave: parallax layer moving left-right */}
            <motion.path
              d="M 6,52 L 6,18 Q 30,12 56,18 T 108,18 L 108,52 Z"
              fill="url(#fluidGradBack)"
              animate={{
                d: [
                  "M 6,52 L 6,19 Q 31,13 56,19 T 108,19 L 108,52 Z",
                  "M 6,52 L 6,15 Q 31,21 56,15 T 108,15 L 108,52 Z",
                  "M 6,52 L 6,19 Q 31,13 56,19 T 108,19 L 108,52 Z"
                ]
              }}
              transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
              style={{
                transformOrigin: "bottom left",
                transform: `scaleX(${fillScale})`,
                transition: "transform 400ms ease"
              }}
            />

            {/* Foreground Wave: dynamic fluid crest with bubbles */}
            <motion.path
              d="M 6,52 L 6,17 Q 31,22 56,17 T 108,17 L 108,52 Z"
              fill="url(#fluidGradFront)"
              animate={{
                d: [
                  "M 6,52 L 6,16 Q 31,22 56,16 T 108,16 L 108,52 Z",
                  "M 6,52 L 6,20 Q 31,14 56,20 T 108,20 L 108,52 Z",
                  "M 6,52 L 6,16 Q 31,22 56,16 T 108,16 L 108,52 Z"
                ]
              }}
              transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
              style={{
                transformOrigin: "bottom left",
                transform: `scaleX(${fillScale})`,
                transition: "transform 400ms ease"
              }}
            />

            {/* Wave Foam / Specular Crest Shimmer */}
            <motion.path
              d="M 6,17 Q 31,22 56,17 T 108,17"
              stroke="rgba(255, 255, 255, 0.65)"
              strokeWidth="1.2"
              fill="none"
              strokeLinecap="round"
              animate={{
                d: [
                  "M 6,16 Q 31,22 56,16 T 108,16",
                  "M 6,20 Q 31,14 56,20 T 108,20",
                  "M 6,16 Q 31,22 56,16 T 108,16"
                ]
              }}
              transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
              style={{
                transformOrigin: "bottom left",
                transform: `scaleX(${fillScale})`,
                transition: "transform 400ms ease"
              }}
            />

            {/* Rising Electrolyte Bubbles */}
            <motion.circle
              cx="28"
              cy="46"
              r="2"
              fill="rgba(255, 255, 255, 0.65)"
              animate={{
                y: [0, -22, -28],
                x: [0, -3, 2],
                scale: [0.6, 1.2, 0],
                opacity: [0, 0.85, 0]
              }}
              transition={{ duration: 2.1, repeat: Infinity, ease: "easeOut", delay: 0.2 }}
            />
            <motion.circle
              cx="54"
              cy="48"
              r="2.5"
              fill="rgba(255, 255, 255, 0.7)"
              animate={{
                y: [0, -26, -32],
                x: [0, 4, -2],
                scale: [0.5, 1.3, 0],
                opacity: [0, 0.9, 0]
              }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut", delay: 0.9 }}
            />
            {percent > 65 && (
              <motion.circle
                cx="80"
                cy="44"
                r="1.8"
                fill="rgba(255, 255, 255, 0.6)"
                animate={{
                  y: [0, -20, -26],
                  x: [0, -2, 3],
                  scale: [0.7, 1.1, 0],
                  opacity: [0, 0.8, 0]
                }}
                transition={{ duration: 2.4, repeat: Infinity, ease: "easeOut", delay: 1.5 }}
              />
            )}

            {/* Charging Electric Lightning Current & Energy Wave */}
            {charging && (
              <g filter="url(#chargingGlow)">
                <motion.path
                  d="M 59,16 L 49,30 L 56,30 L 53,42 L 65,27 L 58,27 Z"
                  fill="#ffffff"
                  stroke="#38bdf8"
                  strokeWidth="1.2"
                  animate={{
                    scale: [1, 1.15, 0.95, 1],
                    opacity: [0.85, 1, 0.85]
                  }}
                  transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
                />
              </g>
            )}
          </g>

          {/* Tick Marks (25%, 50%, 75%) inside Glass */}
          <line x1="31" y1="10" x2="31" y2="15" stroke="rgba(255, 255, 255, 0.2)" strokeWidth="1" />
          <line x1="57" y1="10" x2="57" y2="16" stroke="rgba(255, 255, 255, 0.25)" strokeWidth="1" />
          <line x1="83" y1="10" x2="83" y2="15" stroke="rgba(255, 255, 255, 0.2)" strokeWidth="1" />

          {/* Diagonal Glass Sheen Highlight */}
          <path
            d="M 10,14 L 38,8 L 48,8 L 20,14 Z"
            fill="rgba(255, 255, 255, 0.15)"
          />
        </svg>
      </motion.div>

      {/* Right Column: Dynamic Status, Readout, and Power Mode Badge */}
      <div style={{
        flex: 1,
        minWidth: 0,
        paddingLeft: 14,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: 4
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <motion.span
            key={percent}
            initial={{ scale: 0.9, opacity: 0.8 }}
            animate={{ scale: 1, opacity: 1 }}
            style={{
              fontSize: 24,
              fontWeight: 800,
              color: '#ffffff',
              fontFamily: 'OpenRunde, system-ui, sans-serif',
              letterSpacing: '-0.5px',
              lineHeight: 1
            }}
          >
            {percent}%
          </motion.span>
          <span style={{
            fontSize: 10.5,
            fontWeight: 700,
            color: fluidColor,
            display: 'flex',
            alignItems: 'center',
            gap: 4
          }}>
            {charging ? (
              <>
                <motion.span
                  animate={{ scale: [1, 1.25, 1] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                  style={{ display: 'flex', alignItems: 'center' }}
                >
                  <Zap size={11} fill={fluidColor} color={fluidColor} />
                </motion.span>
                <span>Charging</span>
              </>
            ) : isLow ? (
              <>
                <motion.span
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                  style={{ display: 'flex', alignItems: 'center' }}
                >
                  <AlertTriangle size={11} color="#f43f5e" />
                </motion.span>
                <span>Low Battery</span>
              </>
            ) : (
              <span>Optimal</span>
            )}
          </span>
        </div>

        {/* Subtitle Status */}
        <span style={{ fontSize: 10, color: 'rgba(255, 255, 255, 0.6)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {charging
            ? 'Plugged into AC power • Fast charging'
            : isLow
            ? 'Battery low • Plug in charger soon'
            : isFull
            ? 'Battery full • Ready to go'
            : 'Running on battery power'}
        </span>

        {/* Tactile Status Chip */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.94 }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '2.5px 8px',
              borderRadius: 6,
              background: charging ? 'rgba(34, 197, 94, 0.14)' : isLow ? 'rgba(244, 63, 94, 0.14)' : 'rgba(255, 255, 255, 0.08)',
              border: `1px solid ${charging ? 'rgba(34, 197, 94, 0.3)' : isLow ? 'rgba(244, 63, 94, 0.3)' : 'rgba(255, 255, 255, 0.12)'}`,
              fontSize: 9.5,
              fontWeight: 600,
              color: charging ? '#22c55e' : isLow ? '#f43f5e' : 'rgba(255, 255, 255, 0.85)'
            }}
          >
            <ShieldCheck size={11} />
            <span>Health 100%</span>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

