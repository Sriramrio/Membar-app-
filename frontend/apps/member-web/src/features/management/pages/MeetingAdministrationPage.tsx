import { useMemo,useState,type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, Megaphone, Pause, Play, Plus, WalletCards } from 'lucide-react';
import { useAppDispatch,useAppSelector, useNetworkSlice } from '@/app/hooks';
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
const fmt=(n:number)=>new Intl.NumberFormat('en-IN').format(n);const fmtDate=(v:string,time=false)=>new Date(v).toLocaleString('en-IN',time?{day:'numeric',month:'short',year:'numeric',hour:'numeric',minute:'2-digit'}:{day:'numeric',month:'short',year:'numeric'});

export default function MeetingAdministrationLivePage(){const dispatch=useAppDispatch();const n=useNetworkSlice(['meetings', 'members'] as const);const auth=useAppSelector(s=>s.auth);const units=useAppSelector(s=>s.controlPlane.organisationUnits);const unitScope=descendantUnitNames(units,auth.activeUnit);const scopedMemberIds=new Set(n.members.filter(m=>!unitScope.length||unitScope.includes(m.chapter)).map(m=>m.id));const [q,setQ]=useState('');const rows=n.meetings.filter(m=>m.participantIds.some(id=>scopedMemberIds.has(id))).filter(m=>!q||`${m.title} ${m.mode} ${m.location} ${m.agenda}`.toLowerCase().includes(q.toLowerCase())).sort((a,b)=>a.dateTime.localeCompare(b.dateTime));const names=(m:Meeting)=>m.participantIds.map(id=>n.members.find(x=>x.id===id)?.name).filter(Boolean).join(', ');return <div><PageHead title="Meeting Administration" description="Review member one-to-one meetings and resolve status exceptions."/><div className="mb-5"><SearchField value={q} onChange={setQ} placeholder="Search meeting, location or agenda…"/></div><div className="grid gap-3">{rows.map(m=><Card key={m.id} className="flex flex-col gap-3 lg:flex-row lg:items-center"><div className="flex-1"><div className="font-black">{m.title}</div><div className="text-sm text-slate-600">{names(m)} · {fmtDate(m.dateTime,true)} · {m.mode}</div></div><StatusPill tone={m.status==='confirmed'?'good':m.status==='proposed'?'warn':m.status==='completed'?'info':'bad'}>{m.status}</StatusPill>{m.status==='proposed'&&<Button onClick={()=>dispatch(updateMeeting({id:m.id,status:'confirmed'}))}>Confirm</Button>}{m.status!=='completed'&&m.status!=='cancelled'&&<Button variant="secondary" onClick={()=>dispatch(updateMeeting({id:m.id,status:'cancelled'}))}>Cancel</Button>}</Card>)}{!rows.length&&<EmptyState title="No meetings match" body="Adjust the search phrase."/>}</div></div>}
