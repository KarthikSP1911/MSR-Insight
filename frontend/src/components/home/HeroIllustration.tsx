export default function HeroIllustration() {
    return (
        <svg
            className="mockup-image"
            viewBox="0 0 900 600"
            width={900}
            height={600}
            role="img"
            aria-label="Academic analytics dashboard preview"
            xmlns="http://www.w3.org/2000/svg"
        >
            <defs>
                <linearGradient id="hero-bg" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#141414" />
                    <stop offset="100%" stopColor="#0a0a0a" />
                </linearGradient>
                <linearGradient id="hero-accent" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#00F5FF" />
                    <stop offset="100%" stopColor="#00ADB5" />
                </linearGradient>
                <linearGradient id="hero-bar" x1="0" y1="1" x2="0" y2="0">
                    <stop offset="0%" stopColor="#00ADB5" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="#00F5FF" stopOpacity="0.9" />
                </linearGradient>
                <linearGradient id="hero-area" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00F5FF" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#00F5FF" stopOpacity="0" />
                </linearGradient>
            </defs>

            <rect x="0" y="0" width="900" height="600" rx="20" fill="url(#hero-bg)" />
            <rect x="0.5" y="0.5" width="899" height="599" rx="19.5" fill="none" stroke="rgba(255,255,255,0.08)" />

            {/* window chrome */}
            <circle cx="30" cy="30" r="5" fill="#3a3a3a" />
            <circle cx="48" cy="30" r="5" fill="#3a3a3a" />
            <circle cx="66" cy="30" r="5" fill="#3a3a3a" />
            <rect x="700" y="18" width="180" height="24" rx="8" fill="rgba(255,255,255,0.04)" />

            {/* sidebar */}
            <rect x="24" y="64" width="150" height="512" rx="12" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.06)" />
            {[0, 1, 2, 3, 4].map((i) => (
                <rect
                    key={i}
                    x="40"
                    y={92 + i * 44}
                    width={i === 0 ? 118 : 100}
                    height="14"
                    rx="7"
                    fill={i === 0 ? "url(#hero-accent)" : "rgba(255,255,255,0.08)"}
                />
            ))}

            {/* header row */}
            <rect x="196" y="64" width="220" height="18" rx="6" fill="rgba(255,255,255,0.14)" />
            <rect x="196" y="90" width="140" height="10" rx="5" fill="rgba(255,255,255,0.06)" />

            {/* stat cards */}
            {[
                { x: 196, label: "Attendance", value: "92%" },
                { x: 358, label: "Avg CGPA", value: "8.4" },
                { x: 520, label: "At Risk", value: "12" },
                { x: 682, label: "Reports", value: "348" },
            ].map((card, i) => (
                <g key={i}>
                    <rect x={card.x} y="116" width="148" height="84" rx="12" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.07)" />
                    <rect x={card.x + 16} y="134" width="60" height="8" rx="4" fill="rgba(255,255,255,0.35)" />
                    <text x={card.x + 16} y="176" fontSize="24" fontWeight="800" fill="#ffffff" fontFamily="Arial, sans-serif">
                        {card.value}
                    </text>
                    <circle cx={card.x + 122} cy="150" r="14" fill="rgba(0,245,255,0.1)" />
                    <path d={`M${card.x + 116} 150 l4 4 l8 -9`} stroke="#00F5FF" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </g>
            ))}

            {/* bar chart panel */}
            <rect x="196" y="216" width="336" height="220" rx="12" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.07)" />
            <rect x="216" y="234" width="120" height="10" rx="5" fill="rgba(255,255,255,0.25)" />
            {[52, 88, 66, 110, 74, 96, 60].map((h, i) => (
                <rect
                    key={i}
                    x={220 + i * 42}
                    y={410 - h}
                    width="24"
                    height={h}
                    rx="5"
                    fill="url(#hero-bar)"
                />
            ))}
            <line x1="216" y1="412" x2="512" y2="412" stroke="rgba(255,255,255,0.1)" />

            {/* trend / area chart panel */}
            <rect x="548" y="216" width="314" height="220" rx="12" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.07)" />
            <rect x="568" y="234" width="140" height="10" rx="5" fill="rgba(255,255,255,0.25)" />
            <path
                d="M568 380 L610 360 L652 372 L694 330 L736 345 L778 300 L820 318 L842 296"
                fill="none"
                stroke="url(#hero-accent)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M568 380 L610 360 L652 372 L694 330 L736 345 L778 300 L820 318 L842 296 L842 412 L568 412 Z"
                fill="url(#hero-area)"
                stroke="none"
            />
            {[
                [568, 380], [610, 360], [652, 372], [694, 330],
                [736, 345], [778, 300], [820, 318], [842, 296],
            ].map(([cx, cy], i) => (
                <circle key={i} cx={cx} cy={cy} r="3.5" fill="#0a0a0a" stroke="#00F5FF" strokeWidth="2" />
            ))}

            {/* table panel */}
            <rect x="196" y="452" width="666" height="124" rx="12" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.07)" />
            <rect x="216" y="470" width="160" height="10" rx="5" fill="rgba(255,255,255,0.25)" />
            {[0, 1, 2].map((row) => (
                <g key={row}>
                    <circle cx="228" cy={502 + row * 24} r="8" fill="rgba(0,245,255,0.15)" />
                    <rect x="244" y={498 + row * 24} width="140" height="8" rx="4" fill="rgba(255,255,255,0.18)" />
                    <rect x="640" y={498 + row * 24} width="60" height="8" rx="4" fill="rgba(255,255,255,0.1)" />
                    <rect
                        x="740"
                        y={496 + row * 24}
                        width="90"
                        height="12"
                        rx="6"
                        fill={row === 1 ? "rgba(245,158,11,0.18)" : "rgba(16,185,129,0.18)"}
                    />
                </g>
            ))}
        </svg>
    );
}
