import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/features/network/components/NetworkUI';

export function QueryLoading({label='Loading results…'}:{label?:string}){return <Card><div className="flex min-h-28 items-center justify-center gap-3 text-sm font-semibold text-slate-600" role="status" aria-live="polite"><RefreshCw className="size-5 animate-spin"/>{label}</div></Card>}
export function QueryError({error,onRetry}:{error:any;onRetry?:()=>void}){
  const message = typeof error === 'string'
    ? error
    : (error?.detail && typeof error.detail === 'string' && error.detail !== '[object Object]')
    ? error.detail
    : (error?.message && typeof error.message === 'string' && error.message !== '[object Object]')
    ? error.message
    : (error?.title && typeof error.title === 'string' && error.title !== '[object Object]')
    ? error.title
    : 'The requested data could not be loaded. Please check your connection or retry.';
  return <Card><div className="flex flex-col items-start gap-3" role="alert"><div className="flex items-center gap-2 font-black text-rose-700"><AlertTriangle className="size-5"/>Unable to load results</div><p className="text-sm text-slate-600">{message}</p>{onRetry&&<Button variant="secondary" onClick={onRetry}>Retry</Button>}</div></Card>;
}
export function QueryEmpty({title='No results',body='No records match the current view.'}:{title?:string;body?:string}){return <EmptyState title={title} body={body}/>}

export function QueryRefreshStatus({refreshing,stale,lastUpdatedAt}:{refreshing?:boolean;stale?:boolean;lastUpdatedAt?:string}){if(!refreshing&&!stale)return null;return <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-slate-500" role="status" aria-live="polite"><RefreshCw className={`size-3.5 ${refreshing?'animate-spin':''}`}/>{refreshing?'Refreshing latest data…':`Showing last available data${lastUpdatedAt?` · updated ${new Date(lastUpdatedAt).toLocaleTimeString()}`:''}`}</div>}
