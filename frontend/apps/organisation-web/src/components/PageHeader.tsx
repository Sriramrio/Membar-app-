import {useEffect} from 'react';import type {ReactNode} from 'react';
export function PageHeader({title,eyebrow,actions,children}:{title:string;eyebrow?:string;actions?:ReactNode;children?:ReactNode}){
  useEffect(()=>{document.title=`${title} · SETHU`},[title]);
  return <header className="page-header flex flex-col md:flex-row md:items-start justify-between gap-3 sm:gap-4 mb-4 sm:mb-5 pb-3 border-b border-slate-200/80 w-full min-w-0 max-w-full box-border"><div className="space-y-1 min-w-0 flex-1"><div className="eyebrow text-xs font-bold uppercase tracking-wider text-[#1b5fa7] truncate">{eyebrow||'Organisational Operations'}</div><h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 leading-tight break-words">{title}</h1>{children&&<div className="page-subtitle text-xs sm:text-sm text-slate-600 mt-1 max-w-3xl leading-relaxed break-words">{children}</div>}</div>{actions&&<div className="header-actions flex items-center gap-2 flex-wrap shrink-0 min-w-0">{actions}</div>}</header>;
}

