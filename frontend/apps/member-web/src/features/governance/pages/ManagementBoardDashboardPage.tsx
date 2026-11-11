import { useMemo,useState,type FormEvent } from 'react';
import { CalendarDays, Megaphone, Pause, Play, Plus, WalletCards } from 'lucide-react';
import { useAppDispatch,useAppSelector } from '@/app/hooks';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/common/Input';
import { createAnnouncement,createEvent,createPromotion,payMembership,setAttendanceStatus,setPromotionStatus,updateMeeting,updateMember,updatePaymentStatus } from '@/features/network/networkSlice';
import { EmptyState,Metric,PageHead,SearchField,StatusPill,Tip } from '@/features/network/components/NetworkUI';
import type { Announcement,Meeting,PromotionStatus } from '@/features/network/types';
import { descendantUnitNames } from '@/features/platform-runtime/organisationScope';
import { selectBoardPacks,selectGovernanceDecisions,selectPolicies } from '@/features/platform-runtime/governanceRuntime';
import { selectRoleAssignments } from '@/features/platform-runtime/authorisationRuntime';
import { useAppNavigation } from '@/navigation/useAppNavigation';
import { useAllowedWorkspaceLinks } from '@/navigation/useAllowedWorkspaceLinks';
const fmt=(n:number)=>new Intl.NumberFormat('en-IN').format(n);const fmtDate=(v:string,time=false)=>new Date(v).toLocaleString('en-IN',time?{day:'numeric',month:'short',year:'numeric',hour:'numeric',minute:'2-digit'}:{day:'numeric',month:'short',year:'numeric'});

export default function GovernanceDashboardPage(){const {go}=useAppNavigation();const allowed=useAllowedWorkspaceLinks();const decisions=useAppSelector(selectGovernanceDecisions);const packs=useAppSelector(selectBoardPacks);const policies=useAppSelector(selectPolicies);const assignments=useAppSelector(selectRoleAssignments);const openDecisions=decisions.filter(d=>!d.immutable&&!['Approved','Rejected'].includes(d.status)).length;const packActions=packs.filter(p=>p.status==='Published').length;const policyReviews=policies.filter(p=>p.status==='In Review'||p.status==='Draft').length;const roleTenures=assignments.filter(a=>['Active','Handover','Scheduled'].includes(a.status)).length;return <div><PageHead title="Governance Dashboard" description="Board decisions, policy obligations, strategy outcomes and role tenure oversight."/><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{([['Open decisions',openDecisions,'/governance/decisions'],['Published board packs',packActions,'/governance/board-packs'],['Policy reviews',policyReviews,'/governance/policies'],['Current role tenures',roleTenures,'/governance/roles']] as const).filter(([, ,path])=>allowed(path)).map(([label,value,path])=><Metric key={path} label={label} value={value} onClick={()=>go(path,{label:'Governance Dashboard'})}/>)}</div></div>}