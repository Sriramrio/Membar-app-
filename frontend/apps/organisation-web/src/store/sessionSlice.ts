import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Actor, OrgScope, OrganisationRoleAssignment } from '@/domain/types';
import type { EffectivePolicySnapshot } from '@/contracts/runtimeContracts';

export interface SessionState {
  actor: Actor;
  scope: OrgScope;
  availableScopes: OrgScope[];
  permissions: string[];
  activeAssignment?: OrganisationRoleAssignment;
  effectivePolicy?: EffectivePolicySnapshot;
  sessionRevision: string;
  preview: boolean;
  initialized: boolean;
}

const initialSessionState: SessionState = {
  actor: {
    id: 'ACTOR-ANON',
    name: 'Anonymous',
    position: 'Viewer',
    scope: { id: 'OU-TN', name: 'Tamil Nadu', level: 'STATE' },
    effectiveFrom: '2026-04-01',
  },
  scope: { id: 'OU-TN', name: 'Tamil Nadu', level: 'STATE' },
  availableScopes: [{ id: 'OU-TN', name: 'Tamil Nadu', level: 'STATE' }],
  permissions: [],
  sessionRevision: '1',
  preview: false,
  initialized: false,
};

export const sessionSlice = createSlice({
  name: 'session',
  initialState: initialSessionState,
  reducers: {
    setSession: (state, action: PayloadAction<Partial<SessionState>>) => {
      Object.assign(state, action.payload);
      state.initialized = true;
    },
    setActiveScope: (state, action: PayloadAction<OrgScope>) => {
      state.scope = action.payload;
    },
    clearSession: () => initialSessionState,
  },
});

export const { setSession, setActiveScope, clearSession } = sessionSlice.actions;
export default sessionSlice.reducer;
