import {createContext,lazy,Suspense,useContext,useEffect,useMemo,useReducer,useState,type ReactNode} from 'react';
import type {Actor,OrgScope,OrgUnit,Task,ActionItem,Approval,Conversation,Message,MemberSummary,Committee,Meeting,MemberCase,Programme,EventItem,SupportRequest,Escalation,Handoff,AuditEvent,WorkStatus,RiskItem,IssueItem,DecisionItem,JobItem,DocumentItem,GoalItem,OperationalPerson,NotificationItem,AlertItem,CommunicationItem,FeedbackItem,DataQualityFinding,OperationalExceptionItem,OrganisationRoleAssignment,ChapterCoordinatorResponsibility} from '@/domain/types';
import {crossTab} from '@/services/crossTab';
import {serverClock} from '@/services/serverClock';
import {env} from '@/config/env';
import type {OrgBootstrap} from '@/services/bootstrapGateway';
import {runtimeProviders} from '@/infrastructure/runtimeProviders';
import type {ApiErrorEnvelope} from '@/types/api';
import type {EffectivePolicySnapshot} from '@/contracts/runtimeContracts';
import {toApiError} from '@/services/errorMapper';import {invalidateQueryMemoryCache} from '@/services/queryGateway';
import {store} from '@/store/store';
import {setOrgState,dispatchLegacyOrgAction} from '@/store/orgSlice';
import {setSession,setActiveScope} from '@/store/sessionSlice';
import {authStorage} from '@/utils/authStorage';

export interface NetworkingSummary{source:string;period:string;connections:number;oneToOnes:number;referencesGiven:number;opportunityResponses:number;recordedOutcomeValue:number}
export interface OrgState{
  tasks:Task[];actions:ActionItem[];approvals:Approval[];conversations:Conversation[];messages:Message[];members:MemberSummary[];units:OrgUnit[];
  committees:Committee[];meetings:Meeting[];cases:MemberCase[];programmes:Programme[];events:EventItem[];support:SupportRequest[];escalations:Escalation[];handoffs:Handoff[];
  operationalExceptions:OperationalExceptionItem[];risks:RiskItem[];issues:IssueItem[];decisions:DecisionItem[];jobs:JobItem[];documents:DocumentItem[];people:OperationalPerson[];
  goals:GoalItem[];communications:CommunicationItem[];feedback:FeedbackItem[];dataQuality:DataQualityFinding[];notifications:NotificationItem[];alerts:AlertItem[];
  assignments:OrganisationRoleAssignment[];chapterCoordinatorResponsibilities:ChapterCoordinatorResponsibility[];networkingSummary?:NetworkingSummary;audits:AuditEvent[];
}

const emptyState=(units:OrgUnit[]=[]):OrgState=>({
  tasks:[],actions:[],approvals:[],conversations:[],messages:[],members:[],units,committees:[],meetings:[],cases:[],programmes:[],events:[],support:[],escalations:[],handoffs:[],
  operationalExceptions:[],risks:[],issues:[],decisions:[],jobs:[],documents:[],people:[],goals:[],communications:[],feedback:[],dataQuality:[],notifications:[],alerts:[],assignments:[],chapterCoordinatorResponsibilities:[],audits:[]
});

export type OrgAction=
 | {type:'TASK_STATUS';payload:{id:string;status:WorkStatus}}
 | {type:'ADD_TASK';payload:Omit<Task,'id'|'version'|'timeline'> & {scope?:OrgScope}}
 | {type:'APPROVAL';payload:{id:string;status:Approval['status'];reason?:string}}
 | {type:'ADD_APPROVAL';payload:Omit<Approval,'id'|'version'> & {id?:string;scope?:OrgScope}}
 | {type:'SEND_MESSAGE';payload:{conversationId:string;text:string}}
 | {type:'ADD_HANDOFF';payload:Omit<Handoff,'id'|'correlationId'|'status'>}
 | {type:'ADD_SUPPORT';payload:{title:string;requesterScope:OrgScope;targetScope:OrgScope;summary:string}}
 | {type:'MEETING_FOLLOW_THROUGH';payload:{meetingId:string;title:string;owner:string;due:string;decision?:string}}
 | {type:'DUES_RECONCILE';payload:{memberId:string}}
 | {type:'ADD_JOB';payload:{kind:JobItem['kind'];title:string}};



export interface OrgRuntimeMeta{permissions:string[];availableScopes:OrgScope[];activeAssignment?:OrganisationRoleAssignment;effectivePolicy?:EffectivePolicySnapshot;sessionRevision:string;preview:boolean}
type OrgContextValue=OrgState&OrgRuntimeMeta&{actor:Actor;scope:OrgScope;setScope:(scope:OrgScope)=>void;dispatch:(action:OrgAction)=>void};
const C=createContext<OrgContextValue|null>(null);

export function ReadyOrgProvider({children,bootstrap,preview=false,initialState,reducer:providedReducer}:{children:ReactNode;bootstrap:OrgBootstrap;preview?:boolean;initialState?:OrgState;reducer?:(state:OrgState,action:OrgAction)=>OrgState}){
  const effectiveAvailableScopes = bootstrap.availableScopes;
  const effectiveUnits = bootstrap.units;
  const effectiveActiveScope = bootstrap.activeScope;

  const initial = useMemo(() => initialState ?? emptyState(effectiveUnits), [initialState, effectiveUnits]);
  const reducer=providedReducer??((state:OrgState,_action:OrgAction)=>state);
  const [state,dispatch]=useReducer(reducer,initial);
  const [scope,setScopeState]=useState<OrgScope>(effectiveActiveScope);
  const allowedScopeIds=useMemo(()=>new Set(effectiveAvailableScopes.map(x=>x.id)),[effectiveAvailableScopes]);

  useEffect(() => {
    store.dispatch(setOrgState(initial));
    store.dispatch(setSession({
      actor: bootstrap.actor,
      scope,
      availableScopes: effectiveAvailableScopes,
      permissions: bootstrap.permissions,
      activeAssignment: bootstrap.activeAssignment,
      effectivePolicy: bootstrap.effectivePolicy,
      sessionRevision: bootstrap.sessionRevision,
      preview,
    }));
  }, [initial, bootstrap, preview, effectiveAvailableScopes, scope]);

  const setScope=(next:OrgScope)=>{
    if(!allowedScopeIds.has(next.id)||next.id===scope.id)return;
    setScopeState(next);
    store.dispatch(setActiveScope(next));
    invalidateQueryMemoryCache();
    runtimeProviders().realtime.stop();
    crossTab.publish({type:'SCOPE_CHANGED',payload:next});
  };

  const reduxDispatch = (action: OrgAction) => {
    dispatch(action);
    store.dispatch(dispatchLegacyOrgAction(action));
  };

  useEffect(()=>crossTab.subscribe(event=>{if(event.type==='SCOPE_CHANGED'&&event.payload&&typeof event.payload==='object'&&'id' in event.payload&&'name' in event.payload&&'level' in event.payload){const next=event.payload as OrgScope;if(allowedScopeIds.has(next.id)){setScopeState(next);store.dispatch(setActiveScope(next));}}}),[allowedScopeIds]);
  useEffect(()=>{runtimeProviders().realtime.start(scope.id,bootstrap.sessionRevision);return()=>runtimeProviders().realtime.stop()},[scope.id,bootstrap.sessionRevision]);
  const value=useMemo<OrgContextValue>(()=>({...state,actor:bootstrap.actor,scope,permissions:bootstrap.permissions,availableScopes:bootstrap.availableScopes,activeAssignment:bootstrap.activeAssignment,effectivePolicy:bootstrap.effectivePolicy,sessionRevision:bootstrap.sessionRevision,preview,setScope,dispatch:reduxDispatch}),[state,bootstrap.actor,bootstrap.permissions,bootstrap.availableScopes,bootstrap.activeAssignment,bootstrap.effectivePolicy,bootstrap.sessionRevision,scope,preview]);
  return <C.Provider value={value}>{children}</C.Provider>;
}


const PreviewOrgProvider=lazy(()=>import('./PreviewOrgProvider'));

export function OrgProvider({children}:{children:ReactNode}){
  const [bootstrap,setBootstrap]=useState<OrgBootstrap|undefined>();
  const [error,setError]=useState<ApiErrorEnvelope>();
  const [revision,setRevision]=useState(0);
  const [useFallback,setUseFallback]=useState(false);

  const hasSession = Boolean(authStorage.getActiveSession() && authStorage.getToken());

  useEffect(()=>{
    if(env.useMocks || !hasSession) return;
    const ctl=new AbortController();setError(undefined);
    runtimeProviders().bootstrap.load(ctl.signal).then(setBootstrap).catch(e=>{if(!ctl.signal.aborted)setError(toApiError(e))});
    return()=>ctl.abort();
  },[revision, hasSession]);

  useEffect(()=>crossTab.subscribe(event=>{
    if(env.useMocks)return;
    if(['LOGOUT','SESSION_REVOKED','ROLE_CHANGED','ASSIGNMENT_CHANGED'].includes(event.type)){
      invalidateQueryMemoryCache();
      runtimeProviders().realtime.stop();
      setBootstrap(undefined);
      setRevision(v=>v+1);
    }
  }),[]);

  useEffect(() => {
    const handleAuthChange = () => {
      invalidateQueryMemoryCache();
      runtimeProviders().realtime.stop();
      setBootstrap(undefined);
      setRevision(v => v + 1);
    };
    window.addEventListener('dbn_auth_changed', handleAuthChange);
    return () => window.removeEventListener('dbn_auth_changed', handleAuthChange);
  }, []);

  if(env.useMocks || useFallback || !hasSession) {
    return (
      <Suspense fallback={<main className="content"><div className="card" role="status">Loading workspace…</div></main>}>
        <PreviewOrgProvider>{children}</PreviewOrgProvider>
      </Suspense>
    );
  }

  if(error) {
    if (error.status === 401 || (error.detail && error.detail.includes('401')) || error.code === 'UNAUTHORIZED') {
      authStorage.clearAll();
      return (
        <Suspense fallback={<main className="content"><div className="card" role="status">Redirecting to login…</div></main>}>
          <PreviewOrgProvider>{children}</PreviewOrgProvider>
        </Suspense>
      );
    }
    return (
      <main className="content">
        <div className="card" role="alert">
          <h1>Organisational workspace unavailable</h1>
          <p>{error.detail}</p>
          {error.correlationId&&<p className="row-meta">Reference: {error.correlationId}</p>}
          <div className="row-actions flex gap-2 mt-3">
            <button className="btn primary" onClick={()=>setRevision(v=>v+1)}>Retry</button>
            <button className="btn" onClick={()=>setUseFallback(true)}>Continue in Offline Preview</button>
          </div>
        </div>
      </main>
    );
  }

  if(!bootstrap) return (
    <main className="content">
      <div className="card" role="status" aria-live="polite">
        <h1>Loading organisational workspace</h1>
        <p>Verifying session, effective assignment and organisational scope…</p>
      </div>
    </main>
  );

  return <ReadyOrgProvider bootstrap={bootstrap}>{children}</ReadyOrgProvider>;
}

export const useOrg=()=>{const value=useContext(C);if(!value)throw new Error('useOrg must be used inside OrgProvider after bootstrap');return value};
