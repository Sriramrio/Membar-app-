import type { ScreenDefinition } from '@/types/screen';

export type ScreenKind =
  | 'dashboard' | 'directory' | 'detail' | 'list' | 'form' | 'workflow' | 'calendar'
  | 'messages' | 'content' | 'settings' | 'matrix' | 'designer' | 'import' | 'report' | 'profile';

const dashboardIds = new Set([2, 43, 56, 59, 64]);
const directoryIds = new Set([3, 4, 7, 8, 15, 18, 19, 21, 28, 29, 30, 32, 33, 34, 35, 36, 37, 38, 45, 46, 55, 63, 65, 74]);
const detailIds = new Set([5, 6, 17, 25, 26, 31]);
const formIds = new Set([11, 16, 20]);
const workflowIds = new Set([9, 10, 12, 13, 14, 44, 47, 49, 50, 51, 52, 53, 54, 57, 60, 61, 62, 67, 75, 79]);
const calendarIds = new Set([13, 24, 25, 26, 48, 52]);
const messageIds = new Set([21, 22]);
const contentIds = new Set([23, 27, 28, 29, 30, 31, 51, 53, 58]);
const settingsIds = new Set([39, 40, 41, 42, 80]);
const matrixIds = new Set([68, 69]);
const designerIds = new Set([66, 70, 71, 72, 76, 77]);
const importIds = new Set([73]);
const reportIds = new Set([36, 37, 38, 55, 63, 74, 78, 79]);
const profileIds = new Set([32, 33, 34, 35]);

export function screenKind(screen: ScreenDefinition): ScreenKind {
  if (dashboardIds.has(screen.id)) return 'dashboard';
  if (importIds.has(screen.id)) return 'import';
  if (matrixIds.has(screen.id)) return 'matrix';
  if (designerIds.has(screen.id)) return 'designer';
  if (reportIds.has(screen.id)) return 'report';
  if (profileIds.has(screen.id)) return 'profile';
  if (messageIds.has(screen.id)) return 'messages';
  if (calendarIds.has(screen.id)) return 'calendar';
  if (settingsIds.has(screen.id)) return 'settings';
  if (formIds.has(screen.id)) return 'form';
  if (workflowIds.has(screen.id)) return 'workflow';
  if (contentIds.has(screen.id)) return 'content';
  if (detailIds.has(screen.id)) return 'detail';
  if (directoryIds.has(screen.id)) return 'directory';
  return 'list';
}

export function statusForAction(action: string): string | undefined {
  const a = action.toLowerCase();
  if (/unblock/.test(a)) return 'Connected';
  if (/reschedule/.test(a)) return 'Rescheduled';
  if (/reactivate/.test(a)) return 'Active';
  if (/reverse/.test(a)) return 'Reversed';
  if (/correct/.test(a)) return 'Correction pending';
  if (/dispute/.test(a)) return 'Disputed';
  if (/approve|confirm/.test(a)) return 'Approved';
  if (/reject|decline/.test(a)) return 'Rejected';
  if (/accept/.test(a)) return 'Accepted';
  if (/publish/.test(a)) return 'Published';
  if (/withdraw/.test(a)) return 'Withdrawn';
  if (/block/.test(a)) return 'Blocked';
  if (/close/.test(a)) return 'Closed';
  if (/activate/.test(a)) return 'Active';
  if (/suspend/.test(a)) return 'Suspended';
  if (/reconcile/.test(a)) return 'Reconciled';
  if (/finalise|finalize/.test(a)) return 'Finalised';
  if (/post/.test(a)) return 'Posted';
  if (/submit/.test(a)) return 'Submitted';
  if (/schedule/.test(a)) return 'Scheduled';
  if (/save draft|draft/.test(a)) return 'Draft';
  if (/complete/.test(a)) return 'Completed';
  if (/cancel/.test(a)) return 'Cancelled';
  if (/expire/.test(a)) return 'Expired';
  if (/pause/.test(a)) return 'Paused';
  return undefined;
}

export function actionTone(action: string): 'default' | 'secondary' | 'accent' | 'ghost' | 'danger' {
  if (/delete|reject|withdraw|block|suspend|reverse|cancel|revoke/i.test(action) && !/unblock/i.test(action)) return 'danger';
  if (/approve|publish|post|finalise|activate|confirm|submit|reconcile/i.test(action)) return 'default';
  if (/create|new|add|invite|register|schedule/i.test(action) && !/reschedule/i.test(action)) return 'accent';
  return 'secondary';
}

export function cleaned(values: string[]): string[] { return values.map(x => x.replace(/[.]+$/, '').trim()).filter(Boolean); }
export function fieldLabel(item: string): string { const x = item.replace(/[.]+$/, '').replace(/\//g, ' / ').trim(); return x.length > 64 ? x.slice(0, 61) + '…' : x; }
export function recordId(row: Record<string, unknown> | null | undefined): string { if (!row) return ''; const id = row.id ?? row.record ?? row.member ?? row.business ?? row.title ?? row.name; return String(id ?? 'record'); }
