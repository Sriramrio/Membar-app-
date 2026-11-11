export function TempleSkyline({ className = 'w-full h-auto', ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 600 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      preserveAspectRatio="none"
      {...props}
    >
      <defs>
        <linearGradient id="templeGlow" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.28" />
          <stop offset="70%" stopColor="#D97706" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#B45309" stopOpacity="0.08" />
        </linearGradient>
        <linearGradient id="templeGlowSoft" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FBBF24" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.05" />
        </linearGradient>
      </defs>

      {/* Far Background Skyline */}
      <g fill="url(#templeGlowSoft)">
        {/* Distant Temple Spire 1 */}
        <polygon points="60,180 85,90 90,90 90,75 92,75 92,60 93,60 93,45 94,45 94,30 95,30 95,45 96,45 96,60 97,60 97,75 99,75 99,90 104,90 130,180" />
        {/* Distant Small Gopuram */}
        <polygon points="170,180 185,115 205,115 220,180" />
        <rect x="187" y="105" width="16" height="10" rx="1" />
        <polygon points="190,105 195,85 200,105" />
        {/* Distant Bridge/Arches */}
        <rect x="235" y="145" width="120" height="8" rx="2" />
        <path d="M245,180 A12,12 0 0,1 265,180 L275,180 A12,12 0 0,1 295,180 L305,180 A12,12 0 0,1 325,180 L335,180 A12,12 0 0,1 355,180" />
      </g>

      {/* Main Foreground Gopuram & Heritage Architecture */}
      <g fill="url(#templeGlow)">
        {/* Majestic Gopuram (Right Aligned) */}
        {/* Tier 1 - Base */}
        <polygon points="410,180 430,140 550,140 570,180" />
        <rect x="440" y="132" width="100" height="8" rx="1" />
        {/* Tier 2 */}
        <polygon points="445,132 455,105 525,105 535,132" />
        <rect x="458" y="99" width="64" height="6" rx="1" />
        {/* Tier 3 */}
        <polygon points="462,99 470,75 510,75 518,99" />
        <rect x="472" y="70" width="36" height="5" rx="1" />
        {/* Tier 4 */}
        <polygon points="475,70 480,50 500,50 505,70" />
        <rect x="482" y="46" width="16" height="4" rx="1" />
        {/* Top Dome & Kalasams */}
        <path d="M480,46 C480,36 500,36 500,46 Z" />
        {/* 5 Sacred Kalasams */}
        <rect x="484" y="24" width="2" height="14" />
        <polygon points="483,24 485,18 487,24" />
        <rect x="489" y="18" width="2" height="20" />
        <polygon points="488,18 490,10 492,18" />
        <rect x="494" y="24" width="2" height="14" />
        <polygon points="493,24 495,18 497,24" />

        {/* Archway inside Gopuram Base */}
        <path d="M472,180 A18,18 0 0,1 508,180 Z" fill="#FDF3E3" opacity="0.6" />

        {/* Side Mandapam & Pillars */}
        <rect x="375" y="145" width="45" height="6" rx="1" />
        <rect x="382" y="151" width="4" height="29" />
        <rect x="395" y="151" width="4" height="29" />
        <rect x="408" y="151" width="4" height="29" />
        <polygon points="378,145 397,125 417,145" />

        {/* Traditional Heritage Arch / Torana on Left */}
        <rect x="330" y="155" width="40" height="5" rx="1" />
        <rect x="335" y="160" width="3" height="20" />
        <rect x="362" y="160" width="3" height="20" />
        <path d="M336,155 C336,140 364,140 364,155" stroke="#D97706" strokeWidth="2.5" strokeOpacity="0.25" fill="none" />

        {/* Flying Birds in Golden Sky */}
        <path d="M320,60 Q325,55 330,60 Q335,55 340,60" stroke="#B45309" strokeWidth="1.2" strokeOpacity="0.4" fill="none" />
        <path d="M345,48 Q349,44 353,48 Q357,44 361,48" stroke="#B45309" strokeWidth="1" strokeOpacity="0.35" fill="none" />
        <path d="M370,55 Q373,52 376,55 Q379,52 382,55" stroke="#B45309" strokeWidth="0.8" strokeOpacity="0.3" fill="none" />
      </g>
    </svg>
  );
}
