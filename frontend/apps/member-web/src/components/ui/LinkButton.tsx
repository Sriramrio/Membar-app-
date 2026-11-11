import type { ComponentProps } from 'react';
import { Link } from 'react-router-dom';
import type { VariantProps } from 'class-variance-authority';
import { buttonVariants } from './Button';
import { cn } from '@/utils/cn';
export interface LinkButtonProps extends ComponentProps<typeof Link>, VariantProps<typeof buttonVariants>{}
export function LinkButton({className,variant,...props}:LinkButtonProps){return <Link className={cn(buttonVariants({variant}),className)} {...props}/>}
