import { useMemo, useState } from 'react';
import { Bell, CheckCircle2, ChevronRight, CheckCheck } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Tabs, type TabItem } from '@/components/ui/Tabs';
import { toast } from '@/components/ui/Toast';
import { EmptyState, PageHead, StatusPill } from '@/features/network/components/NetworkUI';
import { activeMemberId } from '@/features/network/selectors';
import { makeSelectNotificationsForMember } from '@/features/network/readModel';
import { acknowledgeNotification, markAllNotificationsRead, markNotificationRead } from '@/features/network/networkSlice';
import type { NetworkNotification } from '@/features/network/types';
import { useMemberNavigation } from '@/features/member/navigation/useMemberNavigation';
import { safeNavigationTarget } from '@/navigation/entityTargets';
import { serverClock } from '@/services/time/serverClock';
import { useDomainCursorPage } from '@/hooks/useDomainCursorPage';
import { QueryError, QueryLoading } from '@/components/data/QueryState';
import { useDomainCommandExecutor } from '@/hooks/useDomainCommandExecutor';
import { useRealtimeRefresh } from '@/hooks/useRealtimeRefresh';

 type NotificationTab = 'all' | 'unread' | 'action';
const category = (href?: string, text?: string) => {
  const h = (href ?? '').toLowerCase();
  const t = (text ?? '').toLowerCase();
  return h.includes('opportunit') || h.includes('transaction')
    ? 'Business'
    : h.includes('meeting') || h.includes('message') || h.includes('connection') || h.includes('reference')
    ? 'Network'
    : h.includes('event') || h.includes('announcement')
    ? 'Community'
    : /payment|membership|security/i.test(`${h} ${t}`)
    ? 'Account'
    : 'Update';
};

export default function NotificationsPage(){
  const {go}=useMemberNavigation();const dispatch=useAppDispatch();const executeCommand=useDomainCommandExecutor();const memberId=useAppSelector(activeMemberId);const selectForMember=useMemo(makeSelectNotificationsForMember,[]);const localAll=useAppSelector(s=>selectForMember(s,memberId));const [tab,setTab]=useState<NotificationTab>('all');
  const available=useMemo(()=>localAll.filter(n=>!n.availableAt||new Date(n.availableAt).getTime()<=serverClock.nowMs()),[localAll]);
  const localRows=useMemo(()=>available.filter(n=>tab==='unread'?!n.read:tab==='action'?Boolean(n.acknowledgementRequired&&!n.acknowledgedAt):true),[available,tab]);
  const filters=useMemo(()=>[{field:'memberId',operator:'eq' as const,value:memberId},...(tab==='unread'?[{field:'read',operator:'eq' as const,value:false}]:[]),...(tab==='action'?[{field:'acknowledgementRequired',operator:'eq' as const,value:true},{field:'acknowledgedAt',operator:'exists' as const,value:false}]:[])],[memberId,tab]);
  const request=useMemo(()=>({queryId:'member.notifications.list',domain:'member' as const,filters,sort:[{field:'createdAt',direction:'desc' as const}],pagination:{pageSize:40},timezone:Intl.DateTimeFormat().resolvedOptions().timeZone}),[filters]);
  const query=useDomainCursorPage<NetworkNotification>(request,localRows,[tab,memberId]);useRealtimeRefresh(['notification.*'],query.reload);const rows=query.page?.items??[];
  const unread=available.filter(n=>!n.read).length;const action=available.filter(n=>n.acknowledgementRequired&&!n.acknowledgedAt).length;
  const handleMarkAllRead=async()=>{const result=await executeCommand({domain:'member',policyId:'notification.read',command:'notifications.mark-all-read',aggregateType:'NotificationInbox',aggregateId:memberId,payload:{memberId},previewAction:()=>dispatch(markAllNotificationsRead(memberId))});if(result.ok){toast.success('All notifications marked as read','Notifications');query.reload()}else toast.error(result.error instanceof Error?result.error.message:'Unable to mark notifications as read')};
  const markRead=async(notificationId:string)=>{const result=await executeCommand({domain:'member',policyId:'notification.read',command:'notification.mark-read',aggregateType:'Notification',aggregateId:notificationId,payload:{notificationId,memberId},previewAction:()=>dispatch(markNotificationRead({ notificationId, memberId }))});if(result.ok)query.reload();return result.ok};
  const acknowledge=async(notificationId:string)=>{const result=await executeCommand({domain:'member',policyId:'notification.acknowledge',command:'notification.acknowledge',aggregateType:'Notification',aggregateId:notificationId,payload:{notificationId,memberId},previewAction:()=>dispatch(acknowledgeNotification({ notificationId, memberId }))});if(result.ok){toast.success('Notification acknowledged');query.reload()}else toast.error(result.error instanceof Error?result.error.message:'Unable to acknowledge notification')};
  const tabItems:TabItem<NotificationTab>[]=[{key:'all',label:'All',badge:available.length},{key:'unread',label:'Unread',badge:unread},{key:'action',label:'Action Required',badge:action}];
  return <div className="space-y-6"><PageHead title="Notifications" description="Prioritised updates with clear acknowledgement and direct links back to the affected business workflow." actions={<Button variant="secondary" onClick={handleMarkAllRead} disabled={!unread}><CheckCheck className="size-4 text-emerald-600"/>Mark all read</Button>}/><Tabs value={tab} onChange={setTab} items={tabItems} variant="pill" ariaLabel="Notification Filters"/>
  {query.loading&&!query.page?<QueryLoading label="Loading notifications…"/>:query.error?<QueryError error={query.error} onRetry={query.reload}/>:<div className="grid gap-3">{rows.map(n=><Card key={n.id} className={n.read?'':'border-sky-200 bg-sky-50/50'}><div className="flex flex-col gap-3 sm:flex-row sm:items-center"><span className="grid size-11 shrink-0 place-items-center rounded-xl bg-white shadow-xs"><Bell className={`size-5 ${n.read?'text-slate-400':'text-sky-600'}`}/></span><button type="button" onClick={async()=>{if(await markRead(n.id))go(safeNavigationTarget(n.href),{label:'Notifications'})}} className="min-w-0 flex-1 text-left"><div className="flex flex-wrap items-center gap-2"><span className={n.read?'text-base font-semibold text-slate-700':'text-base font-bold text-slate-900'}>{n.text}</span><StatusPill>{category(n.href,n.text)}</StatusPill>{!n.read&&<StatusPill tone="info">Unread</StatusPill>}</div><div className="mt-1 text-sm font-semibold text-slate-400">{new Date(n.createdAt).toLocaleString('en-IN')}{n.deliveryMode?` · ${n.deliveryMode}`:''}</div></button><div className="flex flex-wrap items-center gap-2">{n.acknowledgementRequired&&!n.acknowledgedAt&&<Button variant="secondary" onClick={()=>void acknowledge(n.id)}><CheckCircle2 className="size-4 text-emerald-600"/>Acknowledge</Button>}{n.acknowledgedAt&&<StatusPill tone="good">Acknowledged</StatusPill>}<button type="button" aria-label="Open notification" onClick={async()=>{if(await markRead(n.id))go(safeNavigationTarget(n.href),{label:'Notifications'})}} className="grid size-11 place-items-center rounded-xl hover:bg-slate-100"><ChevronRight className="size-5 text-slate-400"/></button></div></div></Card>)}{!rows.length&&<EmptyState title={tab==='action'?'No actions waiting':'No notifications in this view'} body={tab==='action'?'There are no notifications requiring acknowledgement.':'Updates will appear here as activity occurs across SETHU.'}/>}<div className="flex items-center justify-between gap-3"><Button variant="secondary" onClick={query.previous} disabled={!query.canPrevious}>Previous</Button><span className="text-xs font-semibold text-slate-500">{query.page?.page.totalEstimate??rows.length} result{(query.page?.page.totalEstimate??rows.length)===1?'':'s'}</span><Button variant="secondary" onClick={query.next} disabled={!query.canNext}>Next</Button></div></div>}</div>;
}
