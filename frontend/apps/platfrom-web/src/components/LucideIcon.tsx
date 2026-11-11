import type {ReactNode, SVGProps} from 'react';

/**
 * Offline-safe Lucide visual-language subset.
 * These outline icons intentionally use Lucide's 24px/2px conventions so the
 * application does not depend on a CDN. When registry access is available,
 * this adapter can be swapped to lucide-react without changing call sites.
 */
export type LucideIconName =
  | 'activity'|'alert-triangle'|'archive'|'arrow-right'|'bell'|'calendar'|'check'|'check-circle-2'|'chevron-down'|'chevron-left'|'chevron-right'|'chevron-up'
  | 'circle-help'|'clipboard-check'|'database'|'download'|'eye'|'file-check'|'file-text'|'filter'|'git-branch'|'history'|'inbox'|'key-round'
  | 'layout-dashboard'|'list-checks'|'lock-keyhole'|'log-out'|'maximize-2'|'menu'|'minus'|'network'|'plus'|'refresh-cw'|'search'|'settings'|'shield'|'shield-alert'|'shield-check'
  | 'sliders'|'sliders-horizontal'|'upload'|'user-round-cog'|'users'|'workflow'|'x';

const paths:Record<LucideIconName,ReactNode[]> = {
  'maximize-2':[<polyline key="p1" points="15 3 21 3 21 9"/>,<polyline key="p2" points="9 21 3 21 3 15"/>,<line key="l1" x1="21" y1="3" x2="14" y2="10"/>,<line key="l2" x1="3" y1="21" x2="10" y2="14"/>],
  'minus':[<line key="p" x1="5" y1="12" x2="19" y2="12"/>],
  'activity':[<path key="p" d="M22 12h-4l-3 9L9 3l-3 9H2"/>],
  'alert-triangle':[<path key="p" d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>,<path key="p2" d="M12 9v4"/>,<path key="p3" d="M12 17h.01"/>],
  'archive':[<rect key="r" width="20" height="5" x="2" y="3" rx="1"/>,<path key="p" d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8"/>,<path key="p2" d="M10 12h4"/>],
  'arrow-right':[<path key="p1" d="M5 12h14"/>,<path key="p2" d="m12 5 7 7-7 7"/>],
  'bell':[<path key="p" d="M10.27 21h3.46"/>,<path key="p2" d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/>],
  'calendar':[<path key="p" d="M8 2v4M16 2v4M3 10h18"/>,<rect key="r" width="18" height="18" x="3" y="4" rx="2"/>],
  'check':[<path key="p" d="m20 6-11 11-5-5"/>],
  'check-circle-2':[<circle key="c" cx="12" cy="12" r="10"/>,<path key="p" d="m9 12 2 2 4-4"/>],
  'chevron-down':[<path key="p" d="m6 9 6 6 6-6"/>],
  'chevron-left':[<path key="p" d="m15 18-6-6 6-6"/>],
  'chevron-right':[<path key="p" d="m9 18 6-6-6-6"/>],
  'chevron-up':[<path key="p" d="m18 15-6-6-6 6"/>],
  'circle-help':[<circle key="c" cx="12" cy="12" r="10"/>,<path key="p" d="M9.1 9a3 3 0 1 1 5.8 1c0 2-3 2-3 4"/>,<path key="p2" d="M12 18h.01"/>],
  'clipboard-check':[<rect key="r" width="16" height="18" x="4" y="4" rx="2"/>,<path key="p" d="M9 4V2h6v2"/>,<path key="p2" d="m9 13 2 2 4-4"/>],
  'database':[<ellipse key="e" cx="12" cy="5" rx="9" ry="3"/>,<path key="p" d="M3 5v14c0 1.7 4 3 9 3s9-1.3 9-3V5"/>,<path key="p2" d="M3 12c0 1.7 4 3 9 3s9-1.3 9-3"/>],
  'download':[<path key="p" d="M12 3v12"/>,<path key="p2" d="m7 10 5 5 5-5"/>,<path key="p3" d="M5 21h14"/>],
  'eye':[<path key="p" d="M2.06 12.35a1 1 0 0 1 0-.7C3.7 7.6 7.5 5 12 5c4.5 0 8.3 2.6 9.94 6.65a1 1 0 0 1 0 .7C20.3 16.4 16.5 19 12 19c-4.5 0-8.3-2.6-9.94-6.65"/>,<circle key="c" cx="12" cy="12" r="3"/>],
  'file-check':[<path key="p1" d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/>,<path key="p2" d="M14 2v4a2 2 0 0 0 2 2h4"/>,<path key="p3" d="m9 15 2 2 4-4"/>],
  'file-text':[<path key="p" d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/>,<path key="p2" d="M14 2v6h6M8 13h8M8 17h8M8 9h2"/>],
  'filter':[<path key="p" d="M22 3H2l8 9.5V19l4 2v-8.5Z"/>],
  'git-branch':[<path key="p" d="M6 3v12M18 9a3 3 0 0 0-3-3H9"/>,<circle key="c1" cx="6" cy="18" r="3"/>,<circle key="c2" cx="18" cy="12" r="3"/>],
  'history':[<path key="p" d="M3 12a9 9 0 1 0 3-6.7L3 8"/>,<path key="p2" d="M3 3v5h5M12 7v5l4 2"/>],
  'inbox':[<polyline key="p1" points="22 12 16 12 14 15 10 15 8 12 2 12"/>,<path key="p2" d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>],
  'key-round':[<path key="p" d="M21 2l-2 2m-2 2 2 2-3 3-2-2-2 2"/>,<circle key="c" cx="7" cy="17" r="5"/>],
  'layout-dashboard':[<rect key="r1" width="7" height="9" x="3" y="3" rx="1"/>,<rect key="r2" width="7" height="5" x="14" y="3" rx="1"/>,<rect key="r3" width="7" height="9" x="14" y="12" rx="1"/>,<rect key="r4" width="7" height="5" x="3" y="16" rx="1"/>],
  'list-checks':[<path key="p" d="m3 6 2 2 4-4M3 12l2 2 4-4M3 18l2 2 4-4M13 6h8M13 12h8M13 18h8"/>],
  'lock-keyhole':[<rect key="r" width="18" height="12" x="3" y="10" rx="2"/>,<path key="p" d="M7 10V7a5 5 0 0 1 10 0v3M12 14v4"/>],
  'log-out':[<path key="p1" d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>,<polyline key="p2" points="16 17 21 12 16 7"/>,<line key="p3" x1="21" y1="12" x2="9" y2="12"/>],
  'menu':[<path key="p" d="M4 6h16M4 12h16M4 18h16"/>],
  'network':[<rect key="r1" width="6" height="4" x="9" y="2" rx="1"/>,<rect key="r2" width="6" height="4" x="2" y="18" rx="1"/>,<rect key="r3" width="6" height="4" x="16" y="18" rx="1"/>,<path key="p" d="M12 6v4M5 18v-4h14v4"/>],
  'plus':[<path key="p" d="M5 12h14M12 5v14"/>],
  'refresh-cw':[<path key="p" d="M20 11a8 8 0 0 0-14.9-4L3 9"/>,<path key="p2" d="M3 4v5h5M4 13a8 8 0 0 0 14.9 4L21 15"/>,<path key="p3" d="M21 20v-5h-5"/>],
  'search':[<circle key="c" cx="11" cy="11" r="8"/>,<path key="p" d="m21 21-4.3-4.3"/>],
  'settings':[<circle key="c" cx="12" cy="12" r="3"/>,<path key="p" d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21h-4v-.1A1.7 1.7 0 0 0 8.6 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H3v-4h.1A1.7 1.7 0 0 0 4.6 8.6a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V3h4v.1A1.7 1.7 0 0 0 15.4 4.6a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.4 9c.4.3.7.6.9 1 .2.4.3.8.3 1.2v.8c0 .4-.1.8-.3 1.2-.2.4-.5.7-.9 1Z"/>],
  'shield':[<path key="p" d="M20 13c0 5-3.5 7.5-8 9-4.5-1.5-8-4-8-9V5l8-3 8 3z"/>],
  'shield-alert':[<path key="p1" d="M20 13c0 5-3.5 7.5-8 9-4.5-1.5-8-4-8-9V5l8-3 8 3z"/>,<path key="p2" d="M12 8v4"/>,<path key="p3" d="M12 16h.01"/>],
  'shield-check':[<path key="p1" d="M20 13c0 5-3.5 7.5-8 9-4.5-1.5-8-4-8-9V5l8-3 8 3z"/>,<path key="p2" d="m9 12 2 2 4-4"/>],
  'sliders':[<line key="l1" x1="4" x2="4" y1="21" y2="14"/>,<line key="l2" x1="4" x2="4" y1="10" y2="3"/>,<line key="l3" x1="12" x2="12" y1="21" y2="12"/>,<line key="l4" x1="12" x2="12" y1="8" y2="3"/>,<line key="l5" x1="20" x2="20" y1="21" y2="16"/>,<line key="l6" x1="20" x2="20" y1="12" y2="3"/>,<line key="l7" x1="1" x2="7" y1="14" y2="14"/>,<line key="l8" x1="9" x2="15" y1="8" y2="8"/>,<line key="l9" x1="17" x2="23" y1="16" y2="16"/>],
  'sliders-horizontal':[<path key="p" d="M21 4h-7M10 4H3M21 12h-9M8 12H3M21 20h-5M12 20H3"/>,<circle key="c1" cx="12" cy="4" r="2"/>,<circle key="c2" cx="10" cy="12" r="2"/>,<circle key="c3" cx="14" cy="20" r="2"/>],
  'upload':[<path key="p" d="M12 21V9"/>,<path key="p2" d="m17 14-5-5-5 5"/>,<path key="p3" d="M5 3h14"/>],
  'user-round-cog':[<circle key="c" cx="10" cy="8" r="4"/>,<path key="p" d="M2 21a8 8 0 0 1 12.3-6.7"/>,<circle key="c2" cx="18" cy="18" r="3"/>,<path key="p2" d="M18 13v2M18 21v2M13 18h2M21 18h2"/>],
  'users':[<path key="p" d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>,<circle key="c" cx="9" cy="7" r="4"/>,<path key="p2" d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>],
  'workflow':[<rect key="r1" width="8" height="8" x="3" y="3" rx="2"/>,<rect key="r2" width="8" height="8" x="13" y="13" rx="2"/>,<path key="p" d="M11 7h2a4 4 0 0 1 4 4v2M7 11v2a4 4 0 0 0 4 4h2"/>],
  'x':[<path key="p" d="M18 6 6 18M6 6l12 12"/>]
};

export function LucideIcon({name,size=18,...props}:{name:LucideIconName;size?:number}&Omit<SVGProps<SVGSVGElement>,'name'>){
  return <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>{paths[name]}</svg>;
}
