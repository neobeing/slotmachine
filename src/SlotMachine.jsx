import React, { useState, useEffect, useRef } from "react";
import "./SlotMachine.css";

const SYMBOLS = ["🍒", "💎", "🔔", "🍋", "🍊", "7️⃣"];

const stopOrder = [
  [0, 0],
  [0, 1],
  [0, 2],
  [1, 0],
  [1, 1],
  [1, 2],
  [2, 0],
  [2, 1],
  [2, 2],
];

const RollingDigit = ({ targetSymbol, stop }) => {
  const stripRef = useRef(null);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    if (stop) {
      if (stripRef.current) {
        stripRef.current.style.animationPlayState = "paused";
        const finalIndex = SYMBOLS.indexOf(targetSymbol);
        setOffset(-finalIndex * 60);
      }
    } else {
      if (stripRef.current) {
        stripRef.current.style.animationPlayState = "running";
        setOffset(0);
      }
    }
  }, [stop, targetSymbol]);

  return (
    <div className="slot-digit-container">
      <div
        ref={stripRef}
        className={`slot-digit-strip ${stop ? "stopped" : "rolling"}`}
        style={{ transform: `translateY(${offset}px)` }}
      >
        {SYMBOLS.map((sym, i) => (
          <div key={i} className="slot-digit">
            {sym}
          </div>
        ))}
        {SYMBOLS.map((sym, i) => (
          <div key={`dup-${i}`} className="slot-digit">
            {sym}
          </div>
        ))}
      </div>
    </div>
  );
};

const SlotMachine = () => {
  const [rows, setRows] = useState(
    Array(3)
      .fill(null)
      .map(() => Array(3).fill(null))
  );
  const [rolling, setRolling] = useState(false);
  const [stoppedSlots, setStoppedSlots] = useState(
    Array(3)
      .fill(null)
      .map(() => Array(3).fill(false))
  );
  const [finalSymbols, setFinalSymbols] = useState(
    Array(3)
      .fill(null)
      .map(() => Array(3).fill(SYMBOLS[0]))
  );
  const [jackpotLines, setJackpotLines] = useState([]);
  const audioRef = useRef(null);

  const startRolling = () => {
    if (rolling) return;

    // 사용자 클릭 이벤트 안에서 사운드 재생 권한 확보 시도
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current
        .play()
        .then(() => {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
          audioRef.current.volume = 1;
        })
        .catch(() => {});
    }

    setRolling(true);
    setJackpotLines([]);
    setStoppedSlots(
      Array(3)
        .fill(null)
        .map(() => Array(3).fill(false))
    );
    setRows(
      Array(3)
        .fill(null)
        .map(() => Array(3).fill(null))
    );

    const newFinalSymbols = [
      generateRandomRow(),
      generateRandomRow(),
      generateRandomRow(),
    ];
    setFinalSymbols(newFinalSymbols);

    stopOrder.forEach(([r, c], idx) => {
      setTimeout(() => {
        setStoppedSlots((prev) => {
          const copy = prev.map((row) => row.slice());
          copy[r][c] = true;
          return copy;
        });
        setRows((prev) => {
          const copy = prev.map((row) => row.slice());
          copy[r][c] = newFinalSymbols[r][c];
          return copy;
        });

        if (idx === stopOrder.length - 1) {
          setRolling(false);
          checkJackpot(newFinalSymbols);
        }
      }, 2000 + idx * 400);
    });
  };

  function generateRandomRow() {
    return Array(3)
      .fill()
      .map(() => SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]);
  }

  const checkJackpot = (symbols) => {
    const lines = [];

    // 가로
    for (let r = 0; r < 3; r++) {
      if (symbols[r][0] === symbols[r][1] && symbols[r][1] === symbols[r][2]) {
        lines.push({ type: "row", index: r });
      }
    }
    // 세로
    for (let c = 0; c < 3; c++) {
      if (symbols[0][c] === symbols[1][c] && symbols[1][c] === symbols[2][c]) {
        lines.push({ type: "col", index: c });
      }
    }
    // 대각선
    if (symbols[0][0] === symbols[1][1] && symbols[1][1] === symbols[2][2]) {
      lines.push({ type: "diag", index: 0 });
    }
    if (symbols[0][2] === symbols[1][1] && symbols[1][1] === symbols[2][0]) {
      lines.push({ type: "diag", index: 1 });
    }

    if (lines.length > 0) {
      setJackpotLines(lines);
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {
          // 권한 없으면 무시
        });
      }
    }
  };

  const isJackpotSlot = (r, c) => {
    for (const line of jackpotLines) {
      if (line.type === "row" && line.index === r) return true;
      if (line.type === "col" && line.index === c) return true;
      if (line.type === "diag") {
        if (line.index === 0 && r === c) return true;
        if (line.index === 1 && r + c === 2) return true;
      }
    }
    return false;
  };

  return (
    <div className="machine-wrapper">
      <h1>🎰 SLOT MACHINE</h1>
      <div className="machine">
        {rows.map((row, rIdx) => (
          <div key={rIdx} className="slot-row">
            {row.map((symbol, cIdx) => (
              <div
                key={`${rIdx}-${cIdx}`}
                className={`slot-cell ${
                  isJackpotSlot(rIdx, cIdx) ? "jackpot" : ""
                }`}
              >
                <RollingDigit
                  targetSymbol={finalSymbols[rIdx][cIdx]}
                  stop={stoppedSlots[rIdx][cIdx]}
                />
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className="lever-wrapper">
        <button
          className={`lever-button ${rolling ? "disabled" : ""}`}
          onClick={startRolling}
          disabled={rolling}
        >
          🎯 당기기!
        </button>
      </div>

      {/* 사운드 파일: public/sounds/jackpot.mp3 */}
      <audio
        ref={audioRef}
        src="/sounds/playful-casino-slot-machine-jackpot.mp3"
        preload="auto"
      />
    </div>
  );
};

export default SlotMachine;
