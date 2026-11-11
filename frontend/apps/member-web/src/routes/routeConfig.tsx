import { lazy, type ComponentType, type LazyExoticComponent } from 'react';
import type { Workspace } from '@/types/screen';
// const Screen01 = lazy(() => import('@/features/workspaces/pages/WorkspaceHubPage'));
const Screen02 = lazy(() => import('@/features/member/pages/MemberHomePage'));
const Screen03 = lazy(() => import('@/features/member/pages/SmartMemberBusinessDirectoryPage'));
const Screen04 = lazy(() => import('@/features/member/pages/CategoryIndexPage'));
const Screen05 = lazy(() => import('@/features/member/pages/MemberDetailPage'));
const Screen06 = lazy(() => import('@/features/member/pages/BusinessDetailPage'));
const Screen07 = lazy(() => import('@/features/member/pages/ConnectionSuggestionsPage'));
const Screen08 = lazy(() => import('@/features/member/pages/SavedItemsPage'));
const Screen09 = lazy(() => import('@/features/member/pages/ConnectionsPage'));
const Screen10 = lazy(() => import('@/features/member/pages/BusinessReferencesPage'));
const Screen11 = lazy(() => import('@/features/member/pages/CreateReferencePage'));
const Screen12 = lazy(() => import('@/features/member/pages/TransactionsPage'));
const Screen13 = lazy(() => import('@/features/member/pages/OneToOneMeetingsPage'));
const Screen14 = lazy(() => import('@/features/member/pages/ThankYouNotesPage'));
const Screen15 = lazy(() => import('@/features/member/pages/OpportunityMarketplacePage'));
const Screen16 = lazy(() => import('@/features/member/pages/CreateOpportunityPage'));
const Screen17 = lazy(() => import('@/features/member/pages/OpportunityDetailPage'));
const Screen18 = lazy(() => import('@/features/member/pages/MyOpportunitiesPage'));
const Screen19 = lazy(() => import('@/features/member/pages/MyResponsesPage'));
const Screen20 = lazy(() => import('@/features/member/pages/OpportunityResponsePage'));
const Screen21 = lazy(() => import('@/features/member/pages/ConverseInboxPage'));
const Screen22 = lazy(() => import('@/features/member/pages/ConverseThreadPage'));
const Screen23 = lazy(() => import('@/features/member/pages/AnnouncementsPage'));
const Screen24 = lazy(() => import('@/features/member/pages/CalendarPage'));
const Screen25 = lazy(() => import('@/features/member/pages/MeetingDetailAttendancePollPage'));
const Screen26 = lazy(() => import('@/features/member/pages/MemberEventDetailPage'));
const Screen27 = lazy(() => import('@/features/member/pages/PhotoGalleryPage'));
const Screen28 = lazy(() => import('@/features/member/pages/NewsPage'));
const Screen29 = lazy(() => import('@/features/member/pages/PartnersPage'));
const Screen30 = lazy(() => import('@/features/member/pages/ResourcesPage'));
const Screen31 = lazy(() => import('@/features/member/pages/MemberSupportPage'));
const Screen32 = lazy(() => import('@/features/member/pages/MyProfilePage'));
const Screen33 = lazy(() => import('@/features/member/pages/MyBusinessesPage'));
const Screen34 = lazy(() => import('@/features/member/pages/FamilyInformationPage'));
const Screen35 = lazy(() => import('@/features/member/pages/MembershipPage'));
const Screen36 = lazy(() => import('@/features/member/pages/MyAttendancePage'));
const Screen37 = lazy(() => import('@/features/member/pages/MyPaymentsPage'));
const Screen38 = lazy(() => import('@/features/member/pages/MyActivityPage'));
const Screen39 = lazy(() => import('@/features/member/pages/PrivacySettingsPage'));
const Screen40 = lazy(() => import('@/features/member/pages/NotificationSettingsPage'));
const Screen41 = lazy(() => import('@/features/member/pages/SecuritySettingsPage'));
const Screen42 = lazy(() => import('@/features/member/pages/InstallOfflinePage'));
const Screen43 = lazy(() => import('@/features/management/pages/OrganisationalDashboardPage'));
const Screen44 = lazy(() => import('@/features/management/pages/WorkflowInboxPage'));
const Screen45 = lazy(() => import('@/features/management/pages/MemberManagementPage'));
const Screen46 = lazy(() => import('@/features/management/pages/VisitorManagementPage'));
const Screen47 = lazy(() => import('@/features/management/pages/NewMemberOnboardingPage'));
const Screen48 = lazy(() => import('@/features/management/pages/MeetingAdministrationPage'));
const Screen49 = lazy(() => import('@/features/management/pages/AttendanceAdministrationPage'));
const Screen50 = lazy(() => import('@/features/management/pages/PaymentAdministrationPage'));
const Screen51 = lazy(() => import('@/features/management/pages/AnnouncementManagementPage'));
const Screen52 = lazy(() => import('@/features/management/pages/EventManagementPage'));
const Screen53 = lazy(() => import('@/features/management/pages/GalleryManagementPage'));
const Screen54 = lazy(() => import('@/features/management/pages/PromotionManagementPage'));
const Screen55 = lazy(() => import('@/features/management/pages/OperationalReportsPage'));
const Screen56 = lazy(() => import('@/features/governance/pages/ManagementBoardDashboardPage'));
const Screen57 = lazy(() => import('@/features/governance/pages/DecisionRegisterPage'));
const Screen58 = lazy(() => import('@/features/governance/pages/BoardPacksPage'));
const Screen59 = lazy(() => import('@/features/governance/pages/StrategyOutcomesPage'));
const Screen60 = lazy(() => import('@/features/governance/pages/PolicyRegisterPage'));
const Screen61 = lazy(() => import('@/features/governance/pages/PolicyExceptionsPage'));
const Screen62 = lazy(() => import('@/features/governance/pages/RoleTenureOversightPage'));
const Screen63 = lazy(() => import('@/features/governance/pages/GovernanceHistoryPage'));
const Screen64 = lazy(() => import('@/features/platform-admin/pages/PlatformAdministrationDashboardPage'));
const Screen65 = lazy(() => import('@/features/platform-admin/pages/IdentityAdministrationPage'));
const Screen66 = lazy(() => import('@/features/platform-admin/pages/OrganisationHierarchyPage'));
const Screen67 = lazy(() => import('@/features/platform-admin/pages/RoleCatalogueAssignmentsPage'));
const Screen68 = lazy(() => import('@/features/platform-admin/pages/RBACMatrixPage'));
const Screen69 = lazy(() => import('@/features/platform-admin/pages/RACIMatrixPage'));
const Screen70 = lazy(() => import('@/features/platform-admin/pages/WorkflowDesignerPage'));
const Screen71 = lazy(() => import('@/features/platform-admin/pages/LookupsTaxonomiesPage'));
const Screen72 = lazy(() => import('@/features/platform-admin/pages/FormBuilderPage'));
const Screen73 = lazy(() => import('@/features/platform-admin/pages/ImportCentrePage'));
const Screen74 = lazy(() => import('@/features/platform-admin/pages/IntegrationAdministrationPage'));
const Screen75 = lazy(() => import('@/features/platform-admin/pages/ModerationQueuePage'));
const Screen76 = lazy(() => import('@/features/platform-admin/pages/NotificationAdministrationPage'));
const Screen77 = lazy(() => import('@/features/platform-admin/pages/PromotionPolicyInventoryPage'));
const Screen78 = lazy(() => import('@/features/platform-admin/pages/AuditExplorerPage'));
const Screen79 = lazy(() => import('@/features/platform-admin/pages/DataQualityCentrePage'));
const Screen80 = lazy(() => import('@/features/platform-admin/pages/PlatformSettingsPage'));
const Screen81 = lazy(() => import('@/features/member/pages/MemberDashboardPage'));
const Screen82 = lazy(() => import('@/features/member/pages/EventsPage'));
const Screen83 = lazy(() => import('@/features/member/pages/NotificationsPage'));
const Screen84 = lazy(() => import('@/features/member/pages/PromotionDetailPage'));
const Screen85 = lazy(() => import('@/features/management/pages/ChapterWorkflowPage'));
const Screen86 = lazy(() => import('@/features/member/pages/MemberVisitorInvitationsPage'));

export interface RouteDefinition { id:number; path:string; workspace:Workspace; component:LazyExoticComponent<ComponentType>; }
export const routeConfig:RouteDefinition[] = [
  { id:87, path:"/platform-admin/chapters", workspace:"Platform Admin" as Workspace, component:Screen85 },
  { id:88, path:"/platform-admin/chapter-workflow", workspace:"Platform Admin" as Workspace, component:Screen85 },
  { id:85, path:"/manage/chapter-workflow", workspace:"Management" as Workspace, component:Screen85 },
  { id:1, path:"/workspace", workspace:"Workspace" as Workspace, component:Screen02 },
  { id:2, path:"/app/home", workspace:"Member" as Workspace, component:Screen02 },
  { id:86, path:"/app/visitors/invite", workspace:"Member" as Workspace, component:Screen86 },
  { id:3, path:"/app/directory", workspace:"Member" as Workspace, component:Screen03 },
  { id:4, path:"/app/categories", workspace:"Member" as Workspace, component:Screen04 },
  { id:5, path:"/app/members/:id", workspace:"Member" as Workspace, component:Screen05 },
  { id:6, path:"/app/businesses/:id", workspace:"Member" as Workspace, component:Screen06 },
  { id:7, path:"/app/suggestions", workspace:"Member" as Workspace, component:Screen07 },
  { id:8, path:"/app/saved", workspace:"Member" as Workspace, component:Screen08 },
  { id:9, path:"/app/connections", workspace:"Member" as Workspace, component:Screen09 },
  { id:10, path:"/app/references", workspace:"Member" as Workspace, component:Screen10 },
  { id:11, path:"/app/references/new", workspace:"Member" as Workspace, component:Screen11 },
  { id:12, path:"/app/transactions", workspace:"Member" as Workspace, component:Screen12 },
  { id:13, path:"/app/one-to-one", workspace:"Member" as Workspace, component:Screen13 },
  { id:14, path:"/app/thank-you-notes", workspace:"Member" as Workspace, component:Screen14 },
  { id:15, path:"/app/opportunities", workspace:"Member" as Workspace, component:Screen15 },
  { id:16, path:"/app/opportunities/new", workspace:"Member" as Workspace, component:Screen16 },
  { id:17, path:"/app/opportunities/:id", workspace:"Member" as Workspace, component:Screen17 },
  { id:18, path:"/app/opportunities/my", workspace:"Member" as Workspace, component:Screen18 },
  { id:19, path:"/app/responses/my", workspace:"Member" as Workspace, component:Screen19 },
  { id:20, path:"/app/opportunities/:id/respond", workspace:"Member" as Workspace, component:Screen20 },
  { id:21, path:"/app/messages", workspace:"Member" as Workspace, component:Screen21 },
  { id:22, path:"/app/messages/:conversationId", workspace:"Member" as Workspace, component:Screen22 },
  { id:23, path:"/app/announcements", workspace:"Member" as Workspace, component:Screen23 },
  { id:24, path:"/app/calendar", workspace:"Member" as Workspace, component:Screen24 },
  { id:25, path:"/app/meetings/:id", workspace:"Member" as Workspace, component:Screen25 },
  { id:26, path:"/app/events/:id", workspace:"Member" as Workspace, component:Screen26 },
  { id:27, path:"/app/gallery", workspace:"Member" as Workspace, component:Screen27 },
  { id:28, path:"/app/news", workspace:"Member" as Workspace, component:Screen28 },
  { id:29, path:"/app/partners", workspace:"Member" as Workspace, component:Screen29 },
  { id:30, path:"/app/resources", workspace:"Member" as Workspace, component:Screen30 },
  { id:31, path:"/app/support", workspace:"Member" as Workspace, component:Screen31 },
  { id:32, path:"/app/profile", workspace:"Member" as Workspace, component:Screen32 },
  { id:33, path:"/app/businesses", workspace:"Member" as Workspace, component:Screen33 },
  { id:34, path:"/app/family", workspace:"Member" as Workspace, component:Screen34 },
  { id:35, path:"/app/membership", workspace:"Member" as Workspace, component:Screen35 },
  { id:36, path:"/app/attendance", workspace:"Member" as Workspace, component:Screen36 },
  { id:37, path:"/app/payments", workspace:"Member" as Workspace, component:Screen37 },
  { id:38, path:"/app/activity", workspace:"Member" as Workspace, component:Screen38 },
  { id:39, path:"/app/settings/privacy", workspace:"Member" as Workspace, component:Screen39 },
  { id:40, path:"/app/settings/notifications", workspace:"Member" as Workspace, component:Screen40 },
  { id:41, path:"/app/settings/security", workspace:"Member" as Workspace, component:Screen41 },
  { id:42, path:"/app/settings/install", workspace:"Member" as Workspace, component:Screen42 },
  { id:43, path:"/manage/dashboard", workspace:"Management" as Workspace, component:Screen43 },
  { id:44, path:"/manage/workflows", workspace:"Management" as Workspace, component:Screen44 },
  { id:45, path:"/manage/members", workspace:"Management" as Workspace, component:Screen45 },
  { id:46, path:"/manage/visitors", workspace:"Management" as Workspace, component:Screen46 },
  { id:47, path:"/manage/onboarding", workspace:"Management" as Workspace, component:Screen47 },
  { id:48, path:"/manage/meetings", workspace:"Management" as Workspace, component:Screen48 },
  { id:49, path:"/manage/attendance", workspace:"Management" as Workspace, component:Screen49 },
  { id:50, path:"/manage/payments", workspace:"Management" as Workspace, component:Screen50 },
  { id:51, path:"/manage/announcements", workspace:"Management" as Workspace, component:Screen51 },
  { id:52, path:"/manage/events", workspace:"Management" as Workspace, component:Screen52 },
  { id:53, path:"/manage/gallery", workspace:"Management" as Workspace, component:Screen53 },
  { id:54, path:"/manage/promotions", workspace:"Management" as Workspace, component:Screen54 },
  { id:55, path:"/manage/reports", workspace:"Management" as Workspace, component:Screen55 },
  { id:56, path:"/governance/dashboard", workspace:"Governance" as Workspace, component:Screen56 },
  { id:57, path:"/governance/decisions", workspace:"Governance" as Workspace, component:Screen57 },
  { id:58, path:"/governance/board-packs", workspace:"Governance" as Workspace, component:Screen58 },
  { id:59, path:"/governance/strategy", workspace:"Governance" as Workspace, component:Screen59 },
  { id:60, path:"/governance/policies", workspace:"Governance" as Workspace, component:Screen60 },
  { id:61, path:"/governance/exceptions", workspace:"Governance" as Workspace, component:Screen61 },
  { id:62, path:"/governance/roles", workspace:"Governance" as Workspace, component:Screen62 },
  { id:63, path:"/governance/history", workspace:"Governance" as Workspace, component:Screen63 },
  { id:64, path:"/platform-admin/dashboard", workspace:"Platform Admin" as Workspace, component:Screen64 },
  { id:65, path:"/platform-admin/identity", workspace:"Platform Admin" as Workspace, component:Screen65 },
  { id:66, path:"/platform-admin/hierarchy", workspace:"Platform Admin" as Workspace, component:Screen66 },
  { id:67, path:"/platform-admin/roles", workspace:"Platform Admin" as Workspace, component:Screen67 },
  { id:68, path:"/platform-admin/rbac", workspace:"Platform Admin" as Workspace, component:Screen68 },
  { id:69, path:"/platform-admin/raci", workspace:"Platform Admin" as Workspace, component:Screen69 },
  { id:70, path:"/platform-admin/workflows", workspace:"Platform Admin" as Workspace, component:Screen70 },
  { id:71, path:"/platform-admin/lookups", workspace:"Platform Admin" as Workspace, component:Screen71 },
  { id:72, path:"/platform-admin/forms", workspace:"Platform Admin" as Workspace, component:Screen72 },
  { id:73, path:"/platform-admin/imports", workspace:"Platform Admin" as Workspace, component:Screen73 },
  { id:74, path:"/platform-admin/integrations", workspace:"Platform Admin" as Workspace, component:Screen74 },
  { id:75, path:"/platform-admin/moderation", workspace:"Platform Admin" as Workspace, component:Screen75 },
  { id:76, path:"/platform-admin/notifications", workspace:"Platform Admin" as Workspace, component:Screen76 },
  { id:77, path:"/platform-admin/promotions", workspace:"Platform Admin" as Workspace, component:Screen77 },
  { id:78, path:"/platform-admin/audit", workspace:"Platform Admin" as Workspace, component:Screen78 },
  { id:79, path:"/platform-admin/data-quality", workspace:"Platform Admin" as Workspace, component:Screen79 },
  { id:80, path:"/platform-admin/settings", workspace:"Platform Admin" as Workspace, component:Screen80 },
  { id:81, path:"/app/dashboard", workspace:"Member" as Workspace, component:Screen81 },
  { id:82, path:"/app/events", workspace:"Member" as Workspace, component:Screen82 },
  { id:83, path:"/app/notifications", workspace:"Member" as Workspace, component:Screen83 },
  { id:84, path:"/app/promotions/:id", workspace:"Member" as Workspace, component:Screen84 },
];

