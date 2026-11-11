import type { HTMLAttributes } from 'react';import { cn } from '@/utils/cn';
export function Badge({className,...props}:HTMLAttributes<HTMLSpanElement>){return <span className={cn('inline-flex w-fit items-center rounded-full bg-slate-100 px-2.5 py-1 text-sm font-bold text-slate-700',className)} {...props}/>}
