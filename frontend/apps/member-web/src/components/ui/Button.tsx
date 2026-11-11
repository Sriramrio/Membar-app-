import { cva, type VariantProps } from 'class-variance-authority';
import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/utils/cn';
export const buttonVariants=cva('inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 py-2 text-base font-semibold transition focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-sky-300 disabled:pointer-events-none disabled:opacity-50',{variants:{variant:{default:'bg-[var(--navy-900)] text-white hover:bg-[var(--navy-800)]',secondary:'border border-slate-300 bg-white text-[var(--navy-900)] hover:bg-slate-50',accent:'bg-[var(--maroon-700)] text-white hover:bg-[var(--maroon-800)]',ghost:'bg-transparent text-[var(--navy-900)] hover:bg-slate-100',danger:'bg-red-700 text-white hover:bg-red-800'}},defaultVariants:{variant:'default'}});
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants>{}
/** Shared button defaults to type=button so placing an action inside a form cannot accidentally submit it. */
export function Button({className,variant,type='button',...props}:ButtonProps){return <button type={type} className={cn(buttonVariants({variant}),className)} {...props}/>}
