import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch,useAppSelector } from '@/app/hooks';
import { ActionDialog } from '@/components/ui/ActionDialog';
import { Button } from '@/components/ui/Button';
import { clearDirtyGuard,clearPendingNavigation,popNavigationOrigin,pushNavigationOrigin,rememberWorkspaceContext } from './memberNavigationSlice';
import { saveRegisteredNavigationDraft } from './navigationDraftRegistry';

export function NavigationGuardDialog(){
 const pending=useAppSelector(s=>s.memberNavigation.pendingNavigation);const dirty=useAppSelector(s=>s.memberNavigation.dirtyGuard);const dispatch=useAppDispatch();const nav=useNavigate();const [saving,setSaving]=useState(false);const [saveError,setSaveError]=useState('');
 const close=()=>{setSaveError('');dispatch(clearPendingNavigation())};
 const proceed=()=>{if(!pending)return;if(pending.kind==='go'&&pending.origin){dispatch(pushNavigationOrigin(pending.origin));dispatch(rememberWorkspaceContext(pending.origin));}if(pending.kind==='back')dispatch(popNavigationOrigin());dispatch(clearDirtyGuard());dispatch(clearPendingNavigation());nav(pending.to,{replace:pending.replace});if(pending.kind==='back'&&pending.restoreScrollY!==undefined&&typeof window!=='undefined')requestAnimationFrame(()=>window.scrollTo({top:pending.restoreScrollY,behavior:'auto'}));};
 const saveAndProceed=async()=>{setSaving(true);setSaveError('');try{const ok=await saveRegisteredNavigationDraft(dirty.draftKey);if(!ok){setSaveError('The draft could not be saved. Stay on this page and review the form.');return}proceed()}finally{setSaving(false)}};
 if(!pending)return null;
 return <><ActionDialog open title="Leave with unsaved changes?" description={`You have unsaved changes${dirty.label?` in ${dirty.label}`:''}. Save the draft or discard the edits before leaving.`} confirmLabel="Discard & continue" confirmVariant="danger" onClose={close} onConfirm={proceed}/>{dirty.canSaveDraft&&<div className="fixed inset-x-0 bottom-5 z-[110] mx-auto flex w-fit max-w-[calc(100%-2rem)] flex-col items-center gap-2 rounded-xl border border-sky-200 bg-white p-3 shadow-xl"><Button type="button" disabled={saving} onClick={saveAndProceed}>{saving?'Saving…':'Save Draft & Continue'}</Button>{saveError&&<p role="alert" className="max-w-sm text-center text-sm font-semibold text-rose-700">{saveError}</p>}</div>}</>;
}
