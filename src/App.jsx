import React, { useState, useEffect, useRef, useCallback } from "react";

/*
  Déjà Vue — a memory match game (SEG3125 Assignment 3)
  Card-matching pairs game with selectable levels and configurable emoji themes.

  Visual design / cognition notes (for the report):
  - Similarity:    matched cards share an identical emoji; every face-down card
                   shares one identical back, so the board reads as one set.
  - Proximity:     a uniform grid groups the cards into a single perceived board.
  - Figure/ground: light cards sit on a dark, low-noise field; a revealed card
                   pops forward as the figure.
  - Closure:       rounded, consistent card shapes read as complete objects.
  - Continuity:    strict row/column alignment leads the eye across the grid.
  - Common region: the board panel groups the cards; the status bar groups state.
  - Common fate:   a matched pair animates together (settle + jade glow).
*/

const THEME = {
  bg: "#0E2A30",
  bgDeep: "#0A2025",
  panel: "#143840",
  cardBack: "#1C4A53",
  cardBackEdge: "#256069",
  cardFace: "#F5EFE2",
  gold: "#E0A458",
  goldSoft: "#F0C98A",
  jade: "#5FB49C",
  text: "#EAF2F0",
  muted: "#85A6AC",
  line: "#1F4B54",
};

const THEMES = {
  animals: { label: "Animals", icon: "🦊", set: ["🐰","🦊","🐼","🐨","🦁","🐯","🐮","🐷","🐸","🐵","🐧","🐔","🦉","🦄","🐝","🦋","🐙","🦀"] },
  food:    { label: "Food",    icon: "🍓", set: ["🍓","🍎","🍊","🍋","🍌","🍉","🍇","🍑","🥝","🍒","🥑","🌽","🥕","🍕","🍔","🍩","🍪","🧁"] },
  faces:   { label: "Faces",   icon: "😄", set: ["😀","😄","😍","🤩","😎","🥳","😴","😭","😡","🤔","🥺","😅","😇","🤓","😜","🙃","😬","🤯"] },
  travel:  { label: "Travel",  icon: "✈️", set: ["✈️","🚀","🚗","🚲","⛵","🏠","🗽","🗼","🏝️","🌋","⛰️","🎡","🎢","🚂","🛸","🏰","⚓","🧳"] },
  nature:  { label: "Nature",  icon: "🌿", set: ["🌿","🌸","🌻","🌵","🍄","🌙","⭐","🌈","🔥","💧","🍁","🌊","🌴","🌷","🪸","🐚","🌾","🪻"] },
};

const LEVELS = {
  beginner:     { label: "Beginner",     pairs: 8,  cols: 4, note: "4 × 4" },
  intermediate: { label: "Intermediate", pairs: 12, cols: 6, note: "4 × 6" },
  advanced:     { label: "Advanced",     pairs: 18, cols: 6, note: "6 × 6" },
};

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildDeck(pairs, themeKey) {
  const chosen = THEMES[themeKey].set.slice(0, pairs);
  const doubled = chosen.flatMap((emoji, i) => [
    { id: `${i}-a`, emoji, flipped: false, matched: false },
    { id: `${i}-b`, emoji, flipped: false, matched: false },
  ]);
  return shuffle(doubled);
}

function fmtTime(s) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

function ratingFor(moves, pairs) {
  if (moves <= pairs * 1.4) return 3;
  if (moves <= pairs * 2.1) return 2;
  return 1;
}

export default function App() {
  const [screen, setScreen] = useState("setup"); // setup | play
  const [level, setLevel] = useState("beginner");
  const [themeKey, setThemeKey] = useState("animals");

  const [deck, setDeck] = useState([]);
  const [flipped, setFlipped] = useState([]); // indices currently face-up & unmatched
  const [matched, setMatched] = useState(0);
  const [moves, setMoves] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [locked, setLocked] = useState(false);
  const [won, setWon] = useState(false);

  const timerRef = useRef(null);
  const pairs = LEVELS[level].pairs;

  const startGame = useCallback(() => {
    setDeck(buildDeck(pairs, themeKey));
    setFlipped([]);
    setMatched(0);
    setMoves(0);
    setSeconds(0);
    setLocked(false);
    setWon(false);
    setScreen("play");
  }, [pairs, themeKey]);

  // timer
  useEffect(() => {
    if (screen === "play" && !won) {
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
      return () => clearInterval(timerRef.current);
    }
  }, [screen, won]);

  // win check
  useEffect(() => {
    if (screen === "play" && pairs > 0 && matched === pairs) {
      setWon(true);
      clearInterval(timerRef.current);
    }
  }, [matched, pairs, screen]);

  function handleFlip(index) {
    if (locked || won) return;
    const card = deck[index];
    if (card.flipped || card.matched) return;

    const next = deck.map((c, i) => (i === index ? { ...c, flipped: true } : c));
    const open = [...flipped, index];
    setDeck(next);
    setFlipped(open);

    if (open.length === 2) {
      setMoves((m) => m + 1);
      setLocked(true);
      const [a, b] = open;
      if (next[a].emoji === next[b].emoji) {
        setTimeout(() => {
          setDeck((d) => d.map((c, i) => (i === a || i === b ? { ...c, matched: true } : c)));
          setMatched((m) => m + 1);
          setFlipped([]);
          setLocked(false);
        }, 420);
      } else {
        setTimeout(() => {
          setDeck((d) => d.map((c, i) => (i === a || i === b ? { ...c, flipped: false } : c)));
          setFlipped([]);
          setLocked(false);
        }, 820);
      }
    }
  }

  const cols = LEVELS[level].cols;

  return (
    <div style={styles.root}>
      <StyleTag />
      <div style={styles.frame}>
        <Header
          onMenu={() => setScreen("setup")}
          showMenu={screen === "play"}
        />

        {screen === "setup" && (
          <Setup
            level={level}
            setLevel={setLevel}
            themeKey={themeKey}
            setThemeKey={setThemeKey}
            onStart={startGame}
          />
        )}

        {screen === "play" && (
          <Play
            deck={deck}
            cols={cols}
            matched={matched}
            pairs={pairs}
            moves={moves}
            seconds={seconds}
            onFlip={handleFlip}
            onRestart={startGame}
          />
        )}
      </div>

      {won && (
        <WinOverlay
          moves={moves}
          seconds={seconds}
          pairs={pairs}
          onPlayAgain={startGame}
          onSetup={() => { setWon(false); setScreen("setup"); }}
        />
      )}
    </div>
  );
}

function Header({ onMenu, showMenu }) {
  return (
    <header style={styles.header}>
      <div style={styles.brand}>
        <span style={styles.wordmark}>Déjà Vue</span>
        <span style={styles.tagline}>memory match</span>
      </div>
      {showMenu && (
        <button style={styles.ghostBtn} onClick={onMenu} aria-label="Back to setup">
          ← Setup
        </button>
      )}
    </header>
  );
}

function Setup({ level, setLevel, themeKey, setThemeKey, onStart }) {
  return (
    <div style={styles.setup}>
      <div style={styles.lead}>
        <h1 style={styles.h1}>Find every pair.</h1>
        <p style={styles.sub}>
          Flip two cards at a time and remember where each symbol hides. Match all
          pairs in as few moves as you can.
        </p>
      </div>

      <section style={styles.group}>
        <div style={styles.groupLabel}>Difficulty</div>
        <div style={styles.optionRow}>
          {Object.entries(LEVELS).map(([key, l]) => (
            <button
              key={key}
              onClick={() => setLevel(key)}
              aria-pressed={level === key}
              style={{
                ...styles.levelCard,
                ...(level === key ? styles.levelCardActive : {}),
              }}
            >
              <span style={styles.levelName}>{l.label}</span>
              <span style={styles.levelNote}>{l.note}</span>
              <span style={styles.levelPairs}>{l.pairs} pairs</span>
            </button>
          ))}
        </div>
      </section>

      <section style={styles.group}>
        <div style={styles.groupLabel}>Symbols</div>
        <div style={styles.themeRow}>
          {Object.entries(THEMES).map(([key, t]) => (
            <button
              key={key}
              onClick={() => setThemeKey(key)}
              aria-pressed={themeKey === key}
              style={{
                ...styles.themeChip,
                ...(themeKey === key ? styles.themeChipActive : {}),
              }}
            >
              <span style={styles.themeIcon}>{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>
      </section>

      <button style={styles.primaryBtn} onClick={onStart}>
        Start game
      </button>
    </div>
  );
}

function Play({ deck, cols, matched, pairs, moves, seconds, onFlip, onRestart }) {
  return (
    <div style={styles.play}>
      <div style={styles.status}>
        <Stat label="Pairs" value={`${matched} / ${pairs}`} accent />
        <Stat label="Moves" value={moves} />
        <Stat label="Time" value={fmtTime(seconds)} />
        <button style={styles.ghostBtn} onClick={onRestart} aria-label="Restart game">
          ↻ Restart
        </button>
      </div>

      <div style={styles.progressTrack} aria-hidden="true">
        <div
          style={{
            ...styles.progressFill,
            width: `${pairs ? (matched / pairs) * 100 : 0}%`,
          }}
        />
      </div>

      <div style={styles.boardWrap}>
        <div
          style={{
            ...styles.board,
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
          }}
        >
          {deck.map((card, i) => (
            <Card key={card.id} card={card} onFlip={() => onFlip(i)} />
          ))}
        </div>
      </div>
    </div>
  );
}

function Card({ card, onFlip }) {
  const up = card.flipped || card.matched;
  return (
    <button
      className="deja-card"
      onClick={onFlip}
      aria-label={up ? `Card showing ${card.emoji}` : "Hidden card"}
      style={styles.cardBtn}
    >
      <div
        className="deja-inner"
        style={{
          ...styles.cardInner,
          transform: up ? "rotateY(180deg)" : "rotateY(0deg)",
        }}
      >
        <div className="deja-face deja-back" style={styles.faceBack}>
          <span style={styles.backMark}>◆</span>
        </div>
        <div
          className="deja-face deja-front"
          style={{
            ...styles.faceFront,
            ...(card.matched ? styles.faceMatched : {}),
          }}
        >
          <span style={styles.emoji}>{card.emoji}</span>
        </div>
      </div>
    </button>
  );
}

function Stat({ label, value, accent }) {
  return (
    <div style={styles.stat}>
      <span style={styles.statLabel}>{label}</span>
      <span style={{ ...styles.statValue, ...(accent ? { color: THEME.gold } : {}) }}>
        {value}
      </span>
    </div>
  );
}

function WinOverlay({ moves, seconds, pairs, onPlayAgain, onSetup }) {
  const stars = ratingFor(moves, pairs);
  return (
    <div style={styles.overlay}>
      <div className="deja-pop" style={styles.winCard}>
        <div style={styles.winEyebrow}>You matched them all</div>
        <h2 style={styles.winTitle}>Déjà vu, solved.</h2>
        <div style={styles.starRow} aria-label={`${stars} out of 3 stars`}>
          {[1, 2, 3].map((n) => (
            <span
              key={n}
              style={{
                ...styles.star,
                color: n <= stars ? THEME.gold : THEME.line,
              }}
            >
              ★
            </span>
          ))}
        </div>
        <div style={styles.winStats}>
          <div style={styles.winStat}>
            <span style={styles.statLabel}>Time</span>
            <span style={styles.winStatValue}>{fmtTime(seconds)}</span>
          </div>
          <div style={styles.winDivider} />
          <div style={styles.winStat}>
            <span style={styles.statLabel}>Moves</span>
            <span style={styles.winStatValue}>{moves}</span>
          </div>
        </div>
        <div style={styles.winActions}>
          <button style={styles.primaryBtn} onClick={onPlayAgain}>Play again</button>
          <button style={styles.ghostBtnWide} onClick={onSetup}>Change setup</button>
        </div>
      </div>
    </div>
  );
}

function StyleTag() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Outfit:wght@400;500;600&display=swap');

      * { box-sizing: border-box; }

      .deja-card {
        perspective: 700px;
        border: none;
        background: transparent;
        padding: 0;
        cursor: pointer;
        aspect-ratio: 1 / 1;
        width: 100%;
        outline: none;
      }
      .deja-inner {
        position: relative;
        width: 100%;
        height: 100%;
        transition: transform 0.45s cubic-bezier(.2,.7,.2,1);
        transform-style: preserve-3d;
      }
      .deja-face {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        backface-visibility: hidden;
        -webkit-backface-visibility: hidden;
        border-radius: 14px;
      }
      .deja-front { transform: rotateY(180deg); }
      .deja-card:focus-visible .deja-inner {
        box-shadow: 0 0 0 3px ${THEME.goldSoft};
        border-radius: 14px;
      }
      .deja-card:hover .deja-back {
        filter: brightness(1.12);
      }
      .deja-pop { animation: dejaPop .35s cubic-bezier(.2,.8,.2,1); }
      @keyframes dejaPop {
        from { opacity: 0; transform: translateY(14px) scale(.96); }
        to   { opacity: 1; transform: translateY(0) scale(1); }
      }
      @media (prefers-reduced-motion: reduce) {
        .deja-inner { transition-duration: 0.001s; }
        .deja-pop { animation: none; }
      }
    `}</style>
  );
}

const styles = {
  root: {
    minHeight: "100vh",
    width: "100%",
    background: `radial-gradient(120% 90% at 50% -10%, ${THEME.bg} 0%, ${THEME.bgDeep} 70%)`,
    color: THEME.text,
    fontFamily: "'Outfit', system-ui, sans-serif",
    display: "flex",
    justifyContent: "center",
    padding: "28px 18px 56px",
  },
  frame: { width: "100%", maxWidth: 760 },

  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 26,
  },
  brand: { display: "flex", alignItems: "baseline", gap: 12 },
  wordmark: {
    fontFamily: "'Fraunces', Georgia, serif",
    fontSize: 30,
    fontWeight: 600,
    letterSpacing: "-0.01em",
    color: THEME.text,
  },
  tagline: {
    fontSize: 13,
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    color: THEME.muted,
  },

  setup: { display: "flex", flexDirection: "column", gap: 30 },
  lead: { maxWidth: 520 },
  h1: {
    fontFamily: "'Fraunces', Georgia, serif",
    fontSize: 40,
    lineHeight: 1.04,
    fontWeight: 600,
    margin: "0 0 12px",
    letterSpacing: "-0.02em",
  },
  sub: { fontSize: 16, lineHeight: 1.55, color: THEME.muted, margin: 0 },

  group: { display: "flex", flexDirection: "column", gap: 14 },
  groupLabel: {
    fontSize: 12,
    letterSpacing: "0.2em",
    textTransform: "uppercase",
    color: THEME.muted,
  },

  optionRow: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 },
  levelCard: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
    padding: "18px 16px",
    borderRadius: 16,
    border: `1px solid ${THEME.line}`,
    background: THEME.panel,
    color: THEME.text,
    cursor: "pointer",
    textAlign: "left",
    transition: "border-color .15s, background .15s, transform .1s",
  },
  levelCardActive: {
    borderColor: THEME.gold,
    background: "#163E47",
    boxShadow: `inset 0 0 0 1px ${THEME.gold}`,
  },
  levelName: { fontSize: 17, fontWeight: 600 },
  levelNote: { fontSize: 13, color: THEME.muted, fontVariantNumeric: "tabular-nums" },
  levelPairs: { fontSize: 12, color: THEME.gold, marginTop: 2 },

  themeRow: { display: "flex", flexWrap: "wrap", gap: 10 },
  themeChip: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 16px",
    borderRadius: 999,
    border: `1px solid ${THEME.line}`,
    background: THEME.panel,
    color: THEME.text,
    fontSize: 15,
    cursor: "pointer",
    transition: "border-color .15s, background .15s",
  },
  themeChipActive: { borderColor: THEME.gold, background: "#163E47" },
  themeIcon: { fontSize: 18 },

  primaryBtn: {
    alignSelf: "flex-start",
    padding: "15px 34px",
    borderRadius: 14,
    border: "none",
    background: THEME.gold,
    color: "#1A1208",
    fontSize: 16,
    fontWeight: 600,
    fontFamily: "'Outfit', sans-serif",
    cursor: "pointer",
    boxShadow: `0 10px 24px -10px ${THEME.gold}`,
  },

  play: { display: "flex", flexDirection: "column", gap: 16 },
  status: { display: "flex", alignItems: "center", gap: 22 },
  stat: { display: "flex", flexDirection: "column", gap: 2 },
  statLabel: {
    fontSize: 11,
    letterSpacing: "0.16em",
    textTransform: "uppercase",
    color: THEME.muted,
  },
  statValue: { fontSize: 20, fontWeight: 600, fontVariantNumeric: "tabular-nums" },

  progressTrack: {
    height: 4,
    width: "100%",
    background: THEME.line,
    borderRadius: 999,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    background: THEME.jade,
    borderRadius: 999,
    transition: "width .35s ease",
  },

  boardWrap: { display: "flex", justifyContent: "center", marginTop: 6 },
  board: {
    display: "grid",
    gap: 12,
    width: "100%",
    maxWidth: 560,
  },

  cardBtn: {},
  cardInner: {},
  faceBack: {
    background: `linear-gradient(155deg, ${THEME.cardBack}, ${THEME.bgDeep})`,
    border: `1px solid ${THEME.cardBackEdge}`,
  },
  backMark: { color: THEME.cardBackEdge, fontSize: 20 },
  faceFront: {
    background: THEME.cardFace,
    border: `1px solid #E4DAC4`,
  },
  faceMatched: {
    background: "#E7F2EC",
    border: `2px solid ${THEME.jade}`,
    boxShadow: `0 0 0 4px rgba(95,180,156,0.18)`,
  },
  emoji: { fontSize: "clamp(22px, 6vw, 38px)", lineHeight: 1 },

  ghostBtn: {
    marginLeft: "auto",
    padding: "9px 16px",
    borderRadius: 10,
    border: `1px solid ${THEME.line}`,
    background: "transparent",
    color: THEME.text,
    fontSize: 14,
    cursor: "pointer",
    fontFamily: "'Outfit', sans-serif",
  },
  ghostBtnWide: {
    padding: "14px 28px",
    borderRadius: 14,
    border: `1px solid ${THEME.line}`,
    background: "transparent",
    color: THEME.text,
    fontSize: 15,
    fontWeight: 500,
    cursor: "pointer",
    fontFamily: "'Outfit', sans-serif",
  },

  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(8,24,28,0.74)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    zIndex: 50,
    backdropFilter: "blur(3px)",
  },
  winCard: {
    width: "100%",
    maxWidth: 400,
    background: THEME.panel,
    border: `1px solid ${THEME.line}`,
    borderRadius: 22,
    padding: "34px 30px",
    textAlign: "center",
    boxShadow: "0 30px 60px -20px rgba(0,0,0,0.6)",
  },
  winEyebrow: {
    fontSize: 12,
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    color: THEME.muted,
    marginBottom: 8,
  },
  winTitle: {
    fontFamily: "'Fraunces', Georgia, serif",
    fontSize: 28,
    fontWeight: 600,
    margin: "0 0 16px",
    letterSpacing: "-0.01em",
  },
  starRow: { display: "flex", justifyContent: "center", gap: 8, marginBottom: 22 },
  star: { fontSize: 30 },
  winStats: { display: "flex", alignItems: "center", justifyContent: "center", gap: 22, marginBottom: 26 },
  winStat: { display: "flex", flexDirection: "column", gap: 4 },
  winStatValue: { fontSize: 24, fontWeight: 600, fontVariantNumeric: "tabular-nums" },
  winDivider: { width: 1, height: 34, background: THEME.line },
  winActions: { display: "flex", flexDirection: "column", gap: 10 },
};
