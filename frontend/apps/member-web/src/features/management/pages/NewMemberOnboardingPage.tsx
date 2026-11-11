import { useMemo,useState,useEffect,type FormEvent } from 'react';
import { CheckCircle2,Save,UserPlus } from 'lucide-react';
import { useAppDispatch,useAppSelector, useNetworkSlice } from '@/app/hooks';
import { descendantUnitNames } from '@/features/platform-runtime/organisationScope';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/common/Input';
import { EmptyState,PageHead,StatusPill,Tip } from '@/features/network/components/NetworkUI';
import { activateNetworkMember,addNotification } from '@/features/network/networkSlice';
import type { Business,Member,Payment } from '@/features/network/types';
import { linkActivatedMember,selectVisitors } from '@/features/platform-runtime/visitorRuntime';
import { localAccounts,registerLocalMemberAccount } from '@/features/auth/authService';
import type { AppAccount } from '@/types/common';
// import { useDirtyGuard } from '@/navigation/useDirtyGuard';
import { toast } from '@/components/ui/Toast';
import { readVersionedDraft, saveVersionedDraft } from '@/services/storage/versionedDraft';
import { sessionStorageService } from '@/services/storage/sessionStorage';
import { stableClientId } from '@/utils/stableId';

const slug=(v:string)=>v.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,28)||'member';
const tempPassword=()=>`Sethu@${stableClientId('tmp').replace(/[^A-Za-z0-9]/g,'').slice(-10)}`;

export default function NewMemberOnboardingPage(){
  const dispatch=useAppDispatch();
  const auth=useAppSelector(s=>s.auth);
  const account=auth.account;
  const network=useNetworkSlice(['categories', 'members'] as const);
  const visitors=useAppSelector(selectVisitors);
  const units=useAppSelector(s=>s.controlPlane.organisationUnits);
  const unitScope=useMemo(()=>descendantUnitNames(units,auth.activeUnit),[units,auth.activeUnit]);
  const eligible=useMemo(()=>visitors.filter(v=>!unitScope.length||unitScope.includes(v.chapter)).filter(v=>v.status==='Approved'||v.status==='Activated'),[visitors,unitScope]);
  const [visitorId,setVisitorId]=useState(eligible.find(v=>v.status==='Approved')?.id??eligible[0]?.id??'');
  const visitor=visitors.find(v=>v.id===visitorId);
  const [feedback,setFeedback]=useState<{email:string;password:string}|null>(null);
  const [error,setError]=useState('');
  const [form,setForm]=useState({designation:'Director',city:'Hosur',region:'Tamil Nadu North',state:'Tamil Nadu',country:'India',password:tempPassword()});
  const category=network.categories.find(c=>visitor?.category.toLowerCase().includes(c.name.toLowerCase()))??network.categories[0];

  const draftKey = visitorId ? `sethu.onboardDraft.${visitorId}` : '';

  type OnboardingDraft=typeof form;
  const isOnboardingDraft=(value:unknown):value is OnboardingDraft=>{
    if(!value||typeof value!=='object'||Array.isArray(value))return false;
    const draft=value as Partial<OnboardingDraft>;
    return ['designation','city','region','state','country','password'].every(key=>typeof draft[key as keyof OnboardingDraft]==='string');
  };

  useEffect(() => {
    if (!draftKey) return;
    const restored=readVersionedDraft(draftKey,'member-onboarding',1,isOnboardingDraft);
    if(restored.status==='ready')setForm(restored.payload);
    else if(restored.status==='invalid'||restored.status==='incompatible'){
      sessionStorageService.remove(draftKey);
      toast.info('An outdated or unreadable onboarding draft was cleared.', 'Draft Reset');
    }
  }, [draftKey]);

  const saveDraft = () => {
    if (!draftKey) return;
    const result=saveVersionedDraft<OnboardingDraft>(draftKey,'member-onboarding',1,form);
    if(!result.ok){toast.error('The onboarding draft could not be saved in this browser session.');return;}
    toast.success(`Onboarding draft saved for ${visitor?.applicantName || 'visitor'}!`, 'Draft Saved');
  };

  const choose=(id:string)=>{
    setVisitorId(id);
    setFeedback(null);
    setError('');
    setForm({designation:'Director',city:'Hosur',region:'Tamil Nadu North',state:'Tamil Nadu',country:'India',password:tempPassword()});
  };

  const submit=(e:FormEvent)=>{
    e.preventDefault();
    if(!visitor||visitor.status!=='Approved')return setError('Only an independently approved Athithi can be activated.');
    if(!visitor.emailVerified)return setError('Contact verification must be complete before activation.');
    if(visitor.checks.some(c=>c.status!=='Passed'))return setError('All due-diligence checks must pass before activation.');
    if(form.password.length<12)return setError('Temporary password must contain at least 12 characters.');
    if(network.members.some(m=>m.email.toLowerCase()===visitor.email.toLowerCase())||localAccounts().some(a=>a.email.toLowerCase()===visitor.email.toLowerCase()))return setError('A member or login already uses this verified email address.');
    const suffix=stableClientId('member').replace(/[^A-Za-z0-9]/g,'').slice(-8);
    const accountId=`${slug(visitor.email.split('@')[0])}-${suffix}`;
    const memberId=`member-${accountId}`;
    const businessId=`business-${accountId}`;
    const today=new Date().toISOString().slice(0,10);
    const login:AppAccount={id:accountId,name:visitor.applicantName,email:visitor.email.toLowerCase(),password:form.password,baseChapter:visitor.chapter,workspaces:['Member'],role:'Member',unit:visitor.chapter,status:'active',assignments:[{id:`ASN-${accountId}`,workspace:'Member',role:'Member',unit:visitor.chapter,unitType:'Chapter',startsAt:today,endsAt:`${Number(today.slice(0,4))+1}${today.slice(4)}`,status:'Active'}]};
    const reg=registerLocalMemberAccount(login);
    if(!reg.ok)return setError(reg.message);
    const business:Business={id:businessId,name:visitor.businessName,legalName:visitor.businessName,tradeName:visitor.businessName,businessType:'MSME',categoryIds:category?[category.id]:[],city:form.city,region:form.region,state:form.state,country:form.country,chapter:visitor.chapter,description:`${visitor.businessName} activated from verified visitor application ${visitor.id}.`,capabilities:category?[category.name]:[],products:[],services:[],logoText:visitor.businessName.split(/\s+/).map(x=>x[0]).slice(0,2).join('').toUpperCase(),email:visitor.email,phone:visitor.phone,visibility:'network',verified:true};
    const member:Member={id:memberId,name:visitor.applicantName,designation:form.designation,chapter:visitor.chapter,city:form.city,region:form.region,state:form.state,country:form.country,bio:`${form.designation} at ${visitor.businessName}.`,expertise:category?[category.name]:[],email:visitor.email,phone:visitor.phone,avatarText:visitor.applicantName.split(/\s+/).map(x=>x[0]).slice(0,2).join('').toUpperCase(),profileCompleteness:72,status:'active',verificationStatus:'verified'};
    const payment:Payment={id:`PAY-${accountId}`,memberId,description:'Initial annual membership',amount:5900,status:'paid',dueDate:today,paidAt:today};
    dispatch(activateNetworkMember({member,business,payment}));
    dispatch(linkActivatedMember({visitorId:visitor.id,memberId,actor:account?.name??'Onboarding desk'}));
    dispatch(addNotification({memberId,text:'Welcome to SETHU. Review your privacy, profile and business details before networking.',href:'/app/profile'}));
    if (draftKey) sessionStorageService.remove(draftKey);
    setFeedback({email:login.email,password:form.password});
    toast.success(`Member ${member.name} activated successfully!`, 'Member Activated');
    setError('');
  };
  return <div><PageHead title="Member Activation" description="Activate only independently approved Athithis; reuse verified identity and business data rather than re-keying it."/><div className="grid gap-5 xl:grid-cols-[350px_1fr]"><Card className="h-fit"><h2 className="font-black">Approved Athithi records</h2><div className="mt-4 grid gap-2">{eligible.map(v=><button type="button" key={v.id} onClick={()=>choose(v.id)} className={`rounded-xl border p-3 text-left ${visitorId===v.id?'border-sky-400 bg-sky-50':'border-slate-200 hover:border-sky-300'}`}><div className="font-bold">{v.businessName}</div><div className="mt-1 text-sm text-slate-500">{v.applicantName} · {v.chapter}</div><div className="mt-2"><StatusPill tone={v.status==='Activated'?'good':'info'}>{v.status}</StatusPill></div></button>)}</div>{!eligible.length&&<EmptyState title="No approved Athithis" body="Complete due diligence and independent approval first."/>}</Card>{visitor?<Card><form onSubmit={submit} className="grid gap-5"><div><h2 className="text-xl font-black">{visitor.applicantName}</h2><p className="mt-1 text-sm text-slate-600">{visitor.businessName} · {visitor.email} · {visitor.phone}</p></div>{error&&<div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-800">{error}</div>}{feedback&&<div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900"><div className="flex items-center gap-2 font-black"><CheckCircle2 className="size-4"/>Member activated and Athithi linked</div><div className="mt-2 font-mono text-sm">{feedback.email}<br/>{feedback.password}</div></div>}<div className="grid gap-4 sm:grid-cols-2"><Input required label="Designation" value={form.designation} onChange={e=>setForm({...form,designation:e.target.value})}/><Input required label="City" value={form.city} onChange={e=>setForm({...form,city:e.target.value})}/><Input label="Region" value={form.region} onChange={e=>setForm({...form,region:e.target.value})}/><Input required label="State" value={form.state} onChange={e=>setForm({...form,state:e.target.value})}/><Input required label="Country" value={form.country} onChange={e=>setForm({...form,country:e.target.value})}/><Input required minLength={12} label="Temporary password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})}/></div><div className="rounded-xl bg-slate-50 p-4 text-sm"><strong>Reused verified fields:</strong> name, business, email, phone, chapter and category from {visitor.id}. No duplicate visitor/member record is created.</div><Tip>Activation creates login identity, member record, business profile, initial membership payment and a welcome notification in one action, then stores the retained visitor → member link.</Tip><div className="flex flex-wrap items-center gap-2"><Button type="submit" disabled={visitor.status==='Activated'}><UserPlus className="size-4"/>{visitor.status==='Activated'?'Already activated':'Activate approved visitor'}</Button>{visitor.status!=='Activated'&&<Button type="button" variant="secondary" onClick={saveDraft}><Save className="size-4"/>Save Draft</Button>}</div></form></Card>:<EmptyState title="Select an approved Athithi" body="Choose a record from the left."/>}</div></div>;
}

