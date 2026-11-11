import type { Workspace } from '@/types/screen';
import { workspaceHomePath } from './routeMetadata';
export interface NavItem { label:string; path:string }
export interface NavGroup { label:string; items:NavItem[] }
export const navigation: Record<string, NavGroup[]> = {
  Member: [
    { label: 'My Dashboard', items: [{ label: 'Featured & Discover', path: '/app/home' }, { label: 'My Dashboard', path: '/app/dashboard' } /*, { label: 'Platform Overview', path: '/workspace' }*/] },
    { label: 'Discover', items: [{ label: 'Directory', path: '/app/directory' }, { label: 'Categories', path: '/app/categories' }, { label: 'Saved', path: '/app/saved' }] },
    { label: 'My Network', items: [{ label: 'Connections', path: '/app/connections' }, { label: 'Converse', path: '/app/messages' }, { label: 'Suggestions', path: '/app/suggestions' }, { label: 'One-to-One Meetings', path: '/app/one-to-one' }, { label: 'References', path: '/app/references' }, { label: 'Thank You & Follow-up', path: '/app/thank-you-notes' }, { label: 'Invite Athithi', path: '/app/visitors/invite' }] },
    { label: 'Business', items: [{ label: 'Opportunities', path: '/app/opportunities' }, { label: 'My Opportunities', path: '/app/opportunities/my' }, { label: 'My Responses', path: '/app/responses/my' }, { label: 'Business Outcomes', path: '/app/transactions' }] },
    { label: 'Community', items: [{ label: 'Events', path: '/app/events' }, { label: 'Calendar', path: '/app/calendar' }, { label: 'Announcements', path: '/app/announcements' }, { label: 'Gallery', path: '/app/gallery' }, { label: 'News', path: '/app/news' }, { label: 'Partners', path: '/app/partners' }, { label: 'Resources', path: '/app/resources' }] },
    { label: 'My Account', items: [{ label: 'Profile', path: '/app/profile' }, { label: 'My Businesses', path: '/app/businesses' }, { label: 'Membership', path: '/app/membership' }, { label: 'Attendance', path: '/app/attendance' }, { label: 'Payments', path: '/app/payments' }, { label: 'Activity & Actions', path: '/app/activity' }, { label: 'Privacy', path: '/app/settings/privacy' }, { label: 'Notifications', path: '/app/settings/notifications' }, { label: 'Security', path: '/app/settings/security' }, { label: 'Install & Offline', path: '/app/settings/install' }, { label: 'Support', path: '/app/support' }] },
  ],
  'Platform Admin': [
    {
      label: 'Platform Overview',
      items: [
        { label: 'Admin Dashboard', path: '/platform-admin/dashboard' }
      ]
    },
    {
      label: 'Identity & Access',
      items: [
        { label: 'Identity Administration', path: '/platform-admin/identity' },
        { label: 'Organisation Hierarchy', path: '/platform-admin/hierarchy' },
        { label: 'Role Catalogue & Assignments', path: '/platform-admin/roles' },
        { label: 'RBAC Permissions', path: '/platform-admin/rbac' },
        { label: 'RACI Matrix', path: '/platform-admin/raci' }
      ]
    },
    {
      label: 'Configuration & Workflows',
      items: [
        { label: 'Workflow Designer', path: '/platform-admin/workflows' },
        { label: 'Lookups & Taxonomies', path: '/platform-admin/lookups' },
        { label: 'Form Builder', path: '/platform-admin/forms' }
      ]
    },
    {
      label: 'Data Operations',
      items: [
        { label: 'Import Centre', path: '/platform-admin/imports' },
        { label: 'Integrations', path: '/platform-admin/integrations' },
        { label: 'Data Quality Centre', path: '/platform-admin/data-quality' }
      ]
    },
    {
      label: 'Trust & Communications',
      items: [
        { label: 'Moderation Queue', path: '/platform-admin/moderation' },
        { label: 'Notification Administration', path: '/platform-admin/notifications' },
        { label: 'Promotion Policies', path: '/platform-admin/promotions' }
      ]
    },
    {
      label: 'Parivars & Governance',
      items: [
        { label: 'Parivar Management', path: '/platform-admin/chapters' },
        { label: 'Parivar Workflow', path: '/platform-admin/chapter-workflow' }
      ]
    },
    {
      label: 'Assurance & Core',
      items: [
        { label: 'Audit Explorer', path: '/platform-admin/audit' },
        { label: 'Platform Settings', path: '/platform-admin/settings' }
      ]
    }
  ]
};
export const workspaceHome = (workspace?: Workspace | null) => workspaceHomePath(workspace ?? null);
