import {useEffect,useState} from 'react';import type {ComponentType} from 'react';import {NavLink,useLocation} from 'react-router-dom';
import {Home,CheckSquare,Users,Building2,ShieldCheck,MessageSquare,BriefcaseBusiness,ChevronDown,Lock} from 'lucide-react';
import type {NavGroupState} from '@/config/navigation';
const groupIcons:Record<string,ComponentType<{size?:number}>>={'Workspace':Home,'Chapter Operations':Users,'Execution & Planning':CheckSquare,'Hierarchy':Building2,'Control & Support':ShieldCheck,'Communication & Knowledge':MessageSquare,'Governance & Assurance':BriefcaseBusiness};
export function NavTree({groups,onNavigate}:{groups:NavGroupState[];onNavigate?:()=>void}){
  const loc=useLocation();
  const activeGroup=groups.find(g=>g.items.some(i=>loc.pathname===i.to||loc.pathname.startsWith(i.to+'/')))?.title;
  const [open,setOpen]=useState<Record<string,boolean>>({'Chapter Operations':true,Workspace:true,...(activeGroup?{[activeGroup]:true}:{})});
  const [lockedNotice,setLockedNotice]=useState<string | null>(null);

  useEffect(()=>{if(activeGroup)setOpen(o=>o[activeGroup]?o:{...o,[activeGroup]:true})},[activeGroup]);
  useEffect(()=>{
    if(!lockedNotice) return;
    const t = setTimeout(()=>setLockedNotice(null), 3500);
    return ()=>clearTimeout(t);
  },[lockedNotice]);

  const allOpen = groups.every(g => open[g.title]);
  return <nav className="nav-tree flex flex-col gap-1 pr-1 relative shrink-0" aria-label="Organisational modules">
    {lockedNotice && (
      <div className="mx-2 mb-2 p-2 rounded-lg bg-amber-500/20 border border-amber-400/40 text-amber-200 text-xs font-semibold flex items-center justify-between gap-2 shadow-sm animate-in fade-in">
        <span className="flex items-center gap-1.5"><Lock size={13} className="shrink-0 text-amber-300" /> {lockedNotice}</span>
        <button type="button" onClick={()=>setLockedNotice(null)} className="text-amber-300 hover:text-white text-xs font-bold px-1">&times;</button>
      </div>
    )}
    <button type="button" className="nav-toggle-all bg-transparent border-0 text-[#b9c8da] hover:text-white text-[11px] text-right cursor-pointer py-1 px-2 font-medium transition-colors" onClick={()=>setOpen(Object.fromEntries(groups.map(g=>[g.title,!allOpen])))}>{allOpen?'Collapse all':'Expand all'}</button>
    {groups.map(g=>{const Icon=groupIcons[g.title]??Home;const expanded=Boolean(open[g.title]);const id=`nav-group-${g.title.replace(/[^a-z]/gi,'-').toLowerCase()}`;
      return <div className="nav-group grid gap-0.5" key={g.title}>
        <button type="button" className="nav-group-title flex items-center gap-2 w-full bg-transparent border-0 text-[#b9c8da] hover:text-white hover:bg-[#1d3d69] text-[11px] font-extrabold tracking-wider uppercase py-2 px-2.5 rounded-lg cursor-pointer min-h-[44px] text-left transition-colors" aria-expanded={expanded} aria-controls={id} onClick={()=>setOpen(o=>({...o,[g.title]:!o[g.title]}))}><Icon size={16}/><span className="flex-1">{g.title}</span><ChevronDown size={14} className={expanded?'chev open transform rotate-180 transition-transform duration-150':'chev transition-transform duration-150'}/></button>
        {expanded&&<div id={id} className="nav-items grid gap-0.5 pl-2">{g.items.map(i=>{
          const isItemLocked = Boolean(i.locked);
          const lockTitle = isItemLocked
            ? `${i.label} is locked. Requires ${i.minimumLevel ? i.minimumLevel + '-level' : 'higher'} scope.`
            : i.recommended
            ? 'Priority for current organisational role'
            : undefined;

          if (isItemLocked) {
            return (
              <div
                key={i.to}
                title={lockTitle}
                aria-disabled="true"
                onClick={(e: React.MouseEvent) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setLockedNotice(`${i.label} is locked. Requires ${i.minimumLevel ? i.minimumLevel : 'higher'} scope.`);
                }}
                className="no-underline py-2 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-between gap-2 min-h-[40px] text-slate-400 hover:text-slate-300 opacity-50 cursor-not-allowed select-none bg-slate-900/20"
              >
                <span>{i.label}</span>
                <Lock size={12} className="text-amber-400 shrink-0" aria-label="Locked item" />
              </div>
            );
          }

          return (
            <NavLink
              key={i.to}
              to={i.to}
              onClick={onNavigate}
              title={lockTitle}
              className={({isActive}:{isActive:boolean})=>[isActive?'active bg-[#1d3d69] text-white':'text-[#f1f5fa] hover:bg-[#1d3d69] hover:text-white','no-underline py-2 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-between gap-2 min-h-[40px] transition-colors'].filter(Boolean).join(' ')}
            >
              <span>{i.label}{i.recommended?' · Priority':''}</span>
            </NavLink>
          );
        })}</div>}
      </div>})}
  </nav>
}
