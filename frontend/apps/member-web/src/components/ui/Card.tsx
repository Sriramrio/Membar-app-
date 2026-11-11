import type { HTMLAttributes } from 'react'; import { cn } from '@/utils/cn';
export function Card({className,...props}:HTMLAttributes<HTMLDivElement>){return <div className={cn('rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_2px_14px_rgba(11,47,91,.05)]',className)} {...props}/>}
