import type { AppAccount } from '@/types/common';
import type { Workspace } from '@/types/screen';
export interface AuthState {
  authenticated:boolean;
  account:AppAccount|null;
  activeWorkspace:Workspace|null;
  activeUnit:string|null;
  activeAssignmentId:string|null;
  status:'idle'|'loading'|'succeeded'|'failed';
  error?:string;
}
