import {useMemo, useState, useEffect, type ReactNode} from 'react';
import {serverClock} from '@/services/serverClock';
import type {OrgBootstrap} from '@/services/bootstrapGateway';
import {ReadyOrgProvider,type OrgState} from './OrgStore';
import {PREVIEW_ACTOR,PREVIEW_SCOPE,PREVIEW_STATE} from './previewFixtures';
import {createPreviewReducer} from './previewReducer';
import type {Actor,OrgScope,OrgUnit} from '@/domain/types';

import {authStorage} from '@/utils/authStorage';

function getStoredSession(): any {
  return authStorage.getActiveSession();
}

export default function PreviewOrgProvider({children}:{children:ReactNode}){
  const session = getStoredSession();

  const isLeadershipTeam = session?.role === 'leadership_team' || session?.position === 'Leadership Team' || session?.roleType === 'LEADERSHIP_TEAM' || authStorage.isLeadershipTeam();
  const isTrust = !isLeadershipTeam && (session?.position === 'Trust' || session?.role === 'Trust' || session?.roleType === 'TRUST_ADMINISTRATOR' || authStorage.isTrustUser());

  const [dbChapters, setDbChapters] = useState<OrgUnit[]>([]);

  useEffect(() => {
    fetch('/api/chapters')
      .then(r => r.json())
      .then(data => {
        const items = Array.isArray(data) ? data : (data?.value || []);
        if (items.length > 0) {
          const mapped: OrgUnit[] = items.map((c: any) => ({
            id: String(c.id),
            name: c.name || c.id,
            level: 'CHAPTER' as const,
            status: 'Active' as const,
            health: 100,
            memberCount: c.memberCount || 25
          }));
          setDbChapters(mapped);
        }
      })
      .catch(() => {});
  }, []);

  const sessionScopeId = session?.scopeId || session?.activeScope?.id || (isLeadershipTeam ? 'all' : 'ch-hosur');
  const sessionScopeName = session?.scopeName || session?.activeScope?.name || (isLeadershipTeam ? 'All Chapters (Network-Wide)' : 'Hosur Chapter');
  const sessionScopeLevel = session?.scopeLevel || session?.activeScope?.level || (isLeadershipTeam ? 'NATIONAL' : 'CHAPTER');

  const effectiveScope: OrgScope = session?.activeScope || {
    id: sessionScopeId,
    name: sessionScopeName,
    level: sessionScopeLevel
  };

  const effectiveActor: Actor = {
    id: session?.actor?.id || session?.email || PREVIEW_ACTOR.id,
    name: session?.actor?.name || session?.name || (isLeadershipTeam ? 'Leadership Team' : PREVIEW_ACTOR.name),
    position: session?.actor?.position || session?.position || session?.role || (isLeadershipTeam ? 'Leadership Team' : PREVIEW_ACTOR.position),
    scope: effectiveScope,
    effectiveFrom: session?.actor?.effectiveFrom || '2026-04-01'
  };

  const isChapterUnit = (name: string, level?: string) => {
    const l = (level || '').toUpperCase();
    if (l === 'REGION' || l === 'STATE' || l === 'NATIONAL' || l === 'CITY') return false;
    const n = (name || '').toLowerCase();
    return !n.includes('region') && !n.includes('state') && !n.includes('national') && !n.includes('management');
  };

  const fallbackChapterUnits = PREVIEW_STATE.units.filter(u => isChapterUnit(u.name, u.level));
  const cleanChapters = (dbChapters.length > 0 ? dbChapters : fallbackChapterUnits).filter(u => isChapterUnit(u.name, u.level));

  // Only display relevant chapter for chapter leaders/users, but full network of chapters for Leadership Team / Trust
  const relevantUnits = (isLeadershipTeam || isTrust)
    ? [
        { id: 'all', name: 'All Chapters (Network-Wide)', level: 'NATIONAL' as const, status: 'Active' as const, health: 100, memberCount: 200 },
        ...cleanChapters
      ]
    : [{
        id: effectiveScope.id,
        name: effectiveScope.name,
        level: effectiveScope.level,
        status: 'Active' as const,
        health: 100,
        memberCount: 42
      }];

  const relevantScopes = (isLeadershipTeam || isTrust)
    ? [
        { id: 'all', name: 'All Chapters (Network-Wide)', level: 'NATIONAL' as const },
        ...cleanChapters.map(u => ({ id: u.id, name: u.name, level: u.level }))
      ]
    : [{ id: effectiveScope.id, name: effectiveScope.name, level: effectiveScope.level }];

  const previewBootstrap: OrgBootstrap = {
    actor: effectiveActor,
    activeScope: effectiveScope,
    availableScopes: relevantScopes,
    units: relevantUnits,
    permissions: ['preview:*', 'org:*'],
    activeAssignment: {
      id: `asg-${effectiveScope.id}`,
      memberId: effectiveActor.id,
      roleType: session?.roleType || (isLeadershipTeam ? 'LEADERSHIP_TEAM' : 'CHAPTER_PRESIDENT'),
      organisationLevel: effectiveScope.level,
      organisationUnitId: effectiveScope.id,
      effectiveFrom: '2026-04-01',
      status: 'ACTIVE',
      version: 1
    },
    sessionRevision: 'preview',
    serverTime: serverClock.now().toISOString()
  };

  const previewStateFiltered = useMemo(() => {
    if (isTrust || isLeadershipTeam) {
      return {
        ...PREVIEW_STATE,
        units: relevantUnits
      };
    }
    const norm = effectiveScope.name.toLowerCase().replace(/chapter/g, '').trim();
    const filteredMembers = PREVIEW_STATE.members.filter(m => {
      const mCh = (m.chapter || '').toLowerCase().replace(/chapter/g, '').trim();
      return mCh.includes(norm) || norm.includes(mCh);
    });
    return {
      ...PREVIEW_STATE,
      units: relevantUnits,
      members: filteredMembers.length > 0 ? filteredMembers : PREVIEW_STATE.members.slice(0, 1)
    };
  }, [effectiveScope.name, isTrust, isLeadershipTeam, relevantUnits]);

  return <ReadyOrgProvider bootstrap={previewBootstrap} preview initialState={{...previewStateFiltered} as OrgState} reducer={createPreviewReducer(effectiveActor, effectiveScope)}>{children}</ReadyOrgProvider>;
}

