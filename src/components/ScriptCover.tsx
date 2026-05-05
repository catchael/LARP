import React from 'react';

interface ScriptCoverProps {
  scriptId: number;
  className?: string;
}

export const ScriptCover: React.FC<ScriptCoverProps> = ({ scriptId, className }) => {
  // 模擬實體書本的邊緣與陰影樣式[cite: 10, 11]
  const bookStyle: React.CSSProperties = {
    boxShadow: '15px 15px 30px rgba(0, 0, 0, 0.9), -5px -5px 15px rgba(255, 255, 255, 0.05), inset 4px 0 10px rgba(255,255,255,0.2)',
    borderRadius: '2px 8px 8px 2px',
    overflow: 'hidden',
    backgroundColor: '#000',
    aspectRatio: '600/900',
    width: '100%',
  };

  // ─── 劇本 1：窒息地下室 ──────────────────────────────────────────
  if (scriptId === 1) {
    return (
      <div style={bookStyle} className={className}>
        <svg viewBox="0 0 600 900" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="bgGrad1" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#11151c" />
              <stop offset="50%" stopColor="#0a0c10" />
              <stop offset="100%" stopColor="#2a0808" />
            </linearGradient>
            <radialGradient id="lightGrad1" cx="50%" cy="40%" r="50%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity={0.15} />
              <stop offset="100%" stopColor="#000000" stopOpacity={0} />
            </radialGradient>
            <radialGradient id="glowGrad1" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ff3300" stopOpacity={1} />
              <stop offset="40%" stopColor="#ff9900" stopOpacity={0.8} />
              <stop offset="100%" stopColor="#ff0000" stopOpacity={0} />
            </radialGradient>
          </defs>
          <rect width="600" height="900" fill="url(#bgGrad1)" />
          <rect width="600" height="900" fill="url(#lightGrad1)" />
          <g stroke="#ffffff" strokeOpacity={0.05} strokeWidth={1}>
            <line x1={50} y1={-50} x2={150} y2={950} />
            <line x1={250} y1={-50} x2={350} y2={950} />
            <line x1={450} y1={-50} x2={550} y2={950} />
            <line x1={100} y1={-50} x2={200} y2={950} />
            <line x1={500} y1={-50} x2={600} y2={950} />
          </g>
          <path d="M 300 0 C 310 100 290 200 300 300" fill="none" stroke="#555" strokeWidth={6} strokeDasharray="4 2" />
          <circle cx={300} cy={350} r={50} fill="none" stroke="#555" strokeWidth={6} strokeDasharray="4 2" />
          <rect x={294} y={290} width={12} height={20} fill="#444" rx={2} />
          <g transform="translate(300, 350)" opacity={0.4}>
            <path d="M -40 -30 L -70 -180 L -10 -60 Z" fill="#111" stroke="#333" strokeWidth={2} />
            <path d="M 40 -30 L 70 -180 L 10 -60 Z" fill="#111" stroke="#333" strokeWidth={2} />
            <circle cx={0} cy={0} r={70} fill="#050505" stroke="#333" strokeWidth={2} />
            <path d="M -30 -10 Q -15 -25 0 -10 Z" fill="#cc0000" />
            <path d="M 30 -10 Q 15 -25 0 -10 Z" fill="#cc0000" />
            <path d="M -40 30 Q 0 60 40 30" fill="none" stroke="#cc0000" strokeWidth={3} />
            <line x1="-30" y1={25} x2="-25" y2={45} stroke="#cc0000" strokeWidth={2} />
            <line x1="-10" y1={35} x2="-5" y2={55} stroke="#cc0000" strokeWidth={2} />
            <line x1={10} y1={35} x2={5} y2={55} stroke="#cc0000" strokeWidth={2} />
            <line x1={30} y1={25} x2={25} y2={45} stroke="#cc0000" strokeWidth={2} />
          </g>
          <circle cx={480} cy={780} r={15} fill="url(#glowGrad1)" />
          <circle cx={480} cy={780} r={3} fill="#ffffff" />
          <text x={300} y={580} fill="#ffffff" fontSize={22} fontFamily="monospace" textAnchor="middle" letterSpacing={8} opacity={0.7}>10-YEAR UNSOLVED CASE</text>
          <text x={300} y={660} fill="#ffffff" fontSize={70} fontFamily="serif" fontWeight={900} textAnchor="middle" letterSpacing={15}>窒息</text>
          <text x={300} y={740} fill="#cc0000" fontSize={60} fontFamily="serif" fontWeight={900} textAnchor="middle" letterSpacing={10}>地下室</text>
          <text x={300} y={820} fill="#888888" fontSize={16} textAnchor="middle" letterSpacing={3}>完美的地下室密室 ╳ 不存在的獵奇兔子</text>
          <text x={300} y={875} fill="#555555" fontSize={12} textAnchor="middle" letterSpacing={2}>本格派懸疑推理劇本</text>
        </svg>
      </div>
    );
  }

  // ─── 劇本 2：黑傘下妄想殺機 ──────────────────────────────────────────
  if (scriptId === 2) {
    return (
      <div style={bookStyle} className={className}>
        <svg viewBox="0 0 600 900" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="bgGrad2" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#4a5d73" />
              <stop offset="40%" stopColor="#697b8f" />
              <stop offset="75%" stopColor="#1f2833" />
              <stop offset="100%" stopColor="#05080a" />
            </linearGradient>
            <radialGradient id="lightGrad2" cx="50%" cy="35%" r="60%">
              <stop offset="0%" stopColor="#fdf0e6" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#000000" stopOpacity={0} />
            </radialGradient>
            <radialGradient id="bloodGrad2" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#8a0303" stopOpacity={0.9} />
              <stop offset="50%" stopColor="#590000" stopOpacity={0.6} />
              <stop offset="100%" stopColor="#000000" stopOpacity={0} />
            </radialGradient>
          </defs>
          <rect width={600} height={900} fill="url(#bgGrad2)" />
          <rect width={600} height={900} fill="url(#lightGrad2)" />
          <g stroke="#ffffff" strokeOpacity={0.15} strokeWidth={1.5}>
            <line x1={150} y1={-50} x2={50} y2={950} />
            <line x1={250} y1={-50} x2={150} y2={950} />
            <line x1={350} y1={-50} x2={250} y2={950} />
            <line x1={450} y1={-50} x2={350} y2={950} />
            <line x1={550} y1={-50} x2={450} y2={950} />
            <line x1={650} y1={-50} x2={550} y2={950} />
          </g>
          <g opacity={0.6}>
            <path d="M 100 550 L 100 200 C 100 50 500 50 500 200 L 500 550" fill="none" stroke="#18202b" strokeWidth={30} />
            <path d="M 150 550 L 150 200 C 150 100 450 100 450 200 L 450 550" fill="none" stroke="#0c1117" strokeWidth={15} />
            <circle cx={300} cy={60} r={8} fill="#0c1117" />
          </g>
          <ellipse cx={320} cy={480} rx={90} ry={25} fill="url(#bloodGrad2)" />
          <g transform="translate(260, 420) rotate(-20)">
            <path d="M 0 0 L 0 80 C 10 95 25 85 20 70" fill="none" stroke="#111" strokeWidth={8} strokeLinecap="round" />
            <path d="M -110 20 C -50 -80 50 -80 110 20 C 50 -10 -50 -10 -110 20 Z" fill="#030303" stroke="#1a1a1a" strokeWidth={2} />
          </g>
          <text x={300} y={580} fill="#a0b0c0" fontSize={22} fontFamily="monospace" textAnchor="middle" letterSpacing={8} opacity={0.8}>ARISTOCRATIC DELUSIONS</text>
          <text x={300} y={660} fill="#ffffff" fontSize={70} fontFamily="serif" fontWeight={900} textAnchor="middle" letterSpacing={15}>黑傘下</text>
          <text x={300} y={740} fill="#cc0000" fontSize={60} fontFamily="serif" fontWeight={900} textAnchor="middle" letterSpacing={10}>妄想殺機</text>
          <text x={300} y={820} fill="#888888" fontSize={16} textAnchor="middle" letterSpacing={3}>名門貴族的妄想 ╳ 清晨涼亭的錯殺</text>
          <text x={300} y={875} fill="#555555" fontSize={12} textAnchor="middle" letterSpacing={2}>歐式豪門懸疑推理劇本</text>
        </svg>
      </div>
    );
  }

  return null;
};