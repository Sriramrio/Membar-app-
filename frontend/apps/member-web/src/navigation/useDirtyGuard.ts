import { useEffect } from 'react';
import { useAppDispatch } from '@/app/hooks';
import { clearDirtyGuard,setDirtyGuard } from '@/features/member/navigation/memberNavigationSlice';

export function useDirtyGuard(dirty:boolean,label:string,options?:{canSaveDraft?:boolean;draftKey?:string}){
 const dispatch=useAppDispatch();
 useEffect(()=>{
  if(dirty)dispatch(setDirtyGuard({dirty:true,label,canSaveDraft:options?.canSaveDraft,draftKey:options?.draftKey}));
  else dispatch(clearDirtyGuard());
  return()=>{dispatch(clearDirtyGuard())};
 },[dirty,label,options?.canSaveDraft,options?.draftKey,dispatch]);
}
