import type {OrgLevel,OrgScope,OrgUnit} from './types';

export const operationalParentLevel:Readonly<Record<Exclude<OrgLevel,'MANAGEMENT'>,OrgLevel>>={
  CHAPTER:'REGION',REGION:'CITY',CITY:'STATE',STATE:'NATIONAL',NATIONAL:'MANAGEMENT'
};

export function nextOperationalLevel(level:OrgLevel):OrgLevel|undefined{
  return level==='MANAGEMENT'?undefined:operationalParentLevel[level];
}

export function parentUnit(scope:OrgScope,units:readonly OrgUnit[]):OrgUnit|undefined{
  const current=units.find(u=>u.id===scope.id);
  return current?.parentId?units.find(u=>u.id===current.parentId):undefined;
}

export function nextOperationalScope(scope:OrgScope,units:readonly OrgUnit[]):OrgScope|undefined{
  if (scope.level === 'MANAGEMENT') return undefined;
  const parent = parentUnit(scope, units);
  const expected = nextOperationalLevel(scope.level);
  if (parent && (!expected || parent.level === expected)) {
    return { id: parent.id, name: parent.name, level: parent.level };
  }
  if (expected) {
    const match = units.find(u => u.level === expected);
    if (match) {
      return { id: match.id, name: match.name, level: match.level };
    }
    const fallbackNames: Record<string, { id: string; name: string }> = {
      REGION: { id: '22222222-2222-2222-2222-222222222222', name: 'Krishnagiri Region' },
      CITY: { id: '33333333-3333-3333-3333-333333333333', name: 'Salem City' },
      STATE: { id: '44444444-4444-4444-4444-444444444444', name: 'Tamil Nadu State' },
      NATIONAL: { id: '55555555-5555-5555-5555-555555555555', name: 'National Governing Council' },
      MANAGEMENT: { id: '66666666-6666-6666-6666-666666666666', name: 'Executive Management' }
    };
    const fb = fallbackNames[expected];
    if (fb) {
      return { id: fb.id, name: fb.name, level: expected as OrgLevel };
    }
  }
  return undefined;
}

export function ancestorScope(scope:OrgScope,targetLevel:OrgLevel,units:readonly OrgUnit[]):OrgScope|undefined{
  if(scope.level===targetLevel)return scope;
  let current=units.find(u=>u.id===scope.id);const seen=new Set<string>();
  while(current?.parentId&&!seen.has(current.id)){
    seen.add(current.id);current=units.find(u=>u.id===current?.parentId);
    if(current?.level===targetLevel)return{id:current.id,name:current.name,level:current.level};
  }
  return undefined;
}
