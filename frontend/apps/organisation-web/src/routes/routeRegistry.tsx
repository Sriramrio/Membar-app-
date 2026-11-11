import { lazy, type ComponentType } from 'react';
import type { OrgLevel } from '@/domain/types';
import { routeAccessPolicy } from '@/config/routeAccessPolicy';
const NotificationsPage = lazy(() => import('@/pages/NotificationsPage'));
const AlertsPage = lazy(() => import('@/pages/AlertsPage'));
const PeoplePage = lazy(() => import('@/pages/PeoplePage'));
const RolesAccessPage = lazy(() => import('@/pages/RolesAccessPage'));
const JobsPage = lazy(() => import('@/pages/JobsPage'));
const ReportsPage = lazy(() => import('@/pages/ReportsPage'));
const AnalyticsPage = lazy(() => import('@/pages/AnalyticsPage'));
const AuditPage = lazy(() => import('@/pages/AuditPage'));
const TimelinePage = lazy(() => import('@/pages/TimelinePage'));
const DataQualityPage = lazy(() => import('@/pages/DataQualityPage'));
const HandoffsPage = lazy(() => import('@/pages/HandoffsPage'));
const DocumentsPage = lazy(() => import('@/pages/DocumentsPage'));
const ContinuityPage = lazy(() => import('@/pages/ContinuityPage'));
const CommunicationsPage = lazy(() => import('@/pages/CommunicationsPage'));
const EscalationsPage = lazy(() => import('@/pages/EscalationsPage'));
const ExceptionsPage = lazy(() => import('@/pages/ExceptionsPage'));
const RiskPage = lazy(() => import('@/pages/RiskPage'));
const DecisionsPage = lazy(() => import('@/pages/DecisionsPage'));
const IssuesPage = lazy(() => import('@/pages/IssuesPage'));
const CityPage = lazy(() => import('@/pages/CityPage'));
const RegionPage = lazy(() => import('@/pages/RegionPage'));
const ChapterCoordinatorsPage = lazy(() => import('@/pages/ChapterCoordinatorsPage'));
const StatePage = lazy(() => import('@/pages/StatePage'));
const NationalPage = lazy(() => import('@/pages/NationalPage'));
const ManagementPage = lazy(() => import('@/pages/ManagementPage'));
const RegionDetailPage = lazy(() => import('@/pages/HierarchyUnitDetailPage').then(m => ({ default: m.RegionDetailPage })));
const CityDetailPage = lazy(() => import('@/pages/HierarchyUnitDetailPage').then(m => ({ default: m.CityDetailPage })));
const StateDetailPage = lazy(() => import('@/pages/HierarchyUnitDetailPage').then(m => ({ default: m.StateDetailPage })));
const SupportPage = lazy(() => import('@/pages/SupportPage'));
const DuesPage = lazy(() => import('@/pages/DuesPage'));
const EventsPage = lazy(() => import('@/pages/EventsPage'));
const AttendancePage = lazy(() => import('@/pages/AttendancePage'));
const KytPage = lazy(() => import('@/pages/KytPage'));
const MemberPresentationsPage = lazy(() => import('@/pages/MemberPresentationsPage'));
const ProgrammesPage = lazy(() => import('@/pages/ProgrammesPage'));
const PlansPage = lazy(() => import('@/pages/PlansPage'));
const CommitteesPage = lazy(() => import('@/pages/CommitteesPage'));
const GrowthNetworkingPage = lazy(() => import('@/pages/GrowthNetworkingPage'));
const MemberGrowthPage = lazy(() => import('@/pages/MemberGrowthPage'));
const VisitorManagementPage = lazy(() => import('@/pages/VisitorManagementPage'));
const MembersPage = lazy(() => import('@/pages/MembersPage'));
const MemberOnboardingPage = lazy(() => import('@/pages/MemberOnboardingPage'));
const TrustPaymentVerificationPage = lazy(() => import('@/pages/TrustPaymentVerificationPage'));
const TrusteeLeadershipPage = lazy(() => import('@/pages/TrusteeLeadershipPage'));
const ChapterMcPage = lazy(() => import('@/pages/ChapterMcPage'));
const MemberDetailPage = lazy(() => import('@/pages/MemberDetailPage'));
const MemberCasesPage = lazy(() => import('@/pages/MemberCasesPage'));
const ChaptersPage = lazy(() => import('@/pages/ChaptersPage'));
const ChapterDetailPage = lazy(() => import('@/pages/ChapterDetailPage'));
const MeetingsPage = lazy(() => import('@/pages/MeetingsPage'));
const MeetingDetailPage = lazy(() => import('@/pages/MeetingDetailPage'));
const MorePage = lazy(() => import('@/pages/MorePage'));
const SearchPage = lazy(() => import('@/pages/SearchPage'));
const TodayPage = lazy(() => import('@/pages/TodayPage'));
const TasksPage = lazy(() => import('@/pages/TasksPage'));
const ConversePage = lazy(() => import('@/pages/ConversePage'));
const ActionCentrePage = lazy(() => import('@/pages/ActionCentrePage'));
const ApprovalsPage = lazy(() => import('@/pages/ApprovalsPage'));
const CalendarPage = lazy(() => import('@/pages/CalendarPage'));
const TaskDetailPage = lazy(() => import('@/pages/OperationalRecordDetailPage').then(m => ({ default: m.TaskDetailPage })));
const ActionDetailPage = lazy(() => import('@/pages/OperationalRecordDetailPage').then(m => ({ default: m.ActionDetailPage })));
const ApprovalDetailPage = lazy(() => import('@/pages/OperationalRecordDetailPage').then(m => ({ default: m.ApprovalDetailPage })));
const MemberCaseDetailPage = lazy(() => import('@/pages/OperationalRecordDetailPage').then(m => ({ default: m.MemberCaseDetailPage })));
const CommitteeDetailPage = lazy(() => import('@/pages/OperationalRecordDetailPage').then(m => ({ default: m.CommitteeDetailPage })));
const ProgrammeDetailPage = lazy(() => import('@/pages/OperationalRecordDetailPage').then(m => ({ default: m.ProgrammeDetailPage })));
const EventDetailPage = lazy(() => import('@/pages/OperationalRecordDetailPage').then(m => ({ default: m.EventDetailPage })));
const SupportDetailPage = lazy(() => import('@/pages/OperationalRecordDetailPage').then(m => ({ default: m.SupportDetailPage })));
const EscalationDetailPage = lazy(() => import('@/pages/OperationalRecordDetailPage').then(m => ({ default: m.EscalationDetailPage })));
const HandoffDetailPage = lazy(() => import('@/pages/OperationalRecordDetailPage').then(m => ({ default: m.HandoffDetailPage })));
const ExceptionDetailPage = lazy(() => import('@/pages/OperationalRecordDetailPage').then(m => ({ default: m.ExceptionDetailPage })));
const RiskDetailPage = lazy(() => import('@/pages/OperationalRecordDetailPage').then(m => ({ default: m.RiskDetailPage })));
const IssueDetailPage = lazy(() => import('@/pages/OperationalRecordDetailPage').then(m => ({ default: m.IssueDetailPage })));
const DecisionDetailPage = lazy(() => import('@/pages/OperationalRecordDetailPage').then(m => ({ default: m.DecisionDetailPage })));
const JobDetailPage = lazy(() => import('@/pages/OperationalRecordDetailPage').then(m => ({ default: m.JobDetailPage })));
const DocumentDetailPage = lazy(() => import('@/pages/OperationalRecordDetailPage').then(m => ({ default: m.DocumentDetailPage })));
const CommunicationDetailPage = lazy(() => import('@/pages/OperationalRecordDetailPage').then(m => ({ default: m.CommunicationDetailPage })));
const FeedbackDetailPage = lazy(() => import('@/pages/OperationalRecordDetailPage').then(m => ({ default: m.FeedbackDetailPage })));
const GoalDetailPage = lazy(() => import('@/pages/OperationalRecordDetailPage').then(m => ({ default: m.GoalDetailPage })));
const DataQualityDetailPage = lazy(() => import('@/pages/OperationalRecordDetailPage').then(m => ({ default: m.DataQualityDetailPage })));
const NotificationDetailPage = lazy(() => import('@/pages/OperationalRecordDetailPage').then(m => ({ default: m.NotificationDetailPage })));
const AlertDetailPage = lazy(() => import('@/pages/OperationalRecordDetailPage').then(m => ({ default: m.AlertDetailPage })));
export interface OrgRoute { path: string; title: string; component: ComponentType; description: string; minimumLevel?: OrgLevel; requiredPermission: string; capability: string; navigationGroup: string; mobilePriority: 'PRIMARY' | 'SECONDARY' | 'CONTEXTUAL' }
type OrgRouteInput = Omit<OrgRoute, 'requiredPermission' | 'capability' | 'navigationGroup' | 'mobilePriority'>;
const route = (input: OrgRouteInput): OrgRoute => ({ ...input, ...routeAccessPolicy(input.path), minimumLevel: input.minimumLevel ?? routeAccessPolicy(input.path).minimumLevel });
export const orgRoutes: OrgRoute[] = [
    route({ path: '/org/more', title: 'More', component: MorePage, description: 'Workspace modules' }),
    route({ path: '/org/search', title: 'Search', component: SearchPage, description: 'Scoped organisational search' }),
    route({ path: '/org/today', title: 'Today', component: TodayPage, description: 'Volunteer priority view' }),
    route({ path: '/org/action-centre', title: 'Action Centre', component: ActionCentrePage, description: 'Action projection' }),
    route({ path: '/org/approvals/:id', title: 'Approval', component: ApprovalDetailPage, description: 'Approval detail' }),
    route({ path: '/org/approvals', title: 'Approvals', component: ApprovalsPage, description: 'Operational approvals' }),
    route({ path: '/org/converse', title: 'Converse', component: ConversePage, description: 'Organisational converse' }),
    route({ path: '/org/calendar', title: 'Calendar', component: CalendarPage, description: 'Calendar' }),
    route({ path: '/org/tasks/:id', title: 'Task', component: TaskDetailPage, description: 'Task detail' }),
    route({ path: '/org/tasks', title: 'Tasks', component: TasksPage, description: 'Tasks and assignments' }),
    route({ path: '/org/actions/:id', title: 'Action', component: ActionDetailPage, description: 'Action detail' }),
    route({ path: '/org/actions', title: 'Actions', component: TasksPage, description: 'Action register' }),
    route({ path: '/org/meetings', title: 'Meetings', component: MeetingsPage, description: 'Meeting administration' }),
    route({ path: '/org/meetings/:id', title: 'Meeting', component: MeetingDetailPage, description: 'Meeting, quorum and MoM' }),
    route({ path: '/org/mom', title: 'MoM', component: MeetingsPage, description: 'Minutes and follow-through' }),
    route({ path: '/org/chapters', title: 'Chapters', component: ChaptersPage, description: 'Chapter portfolio' }),
    route({ path: '/org/chapters/:id', title: 'Chapter', component: ChapterDetailPage, description: 'Chapter operating workspace' }),
    route({ path: '/org/mc', title: 'Chapter MC', component: ChapterMcPage, description: 'Chapter President, Secretary, Treasurer and MC operating workspace' }),
    route({ path: '/org/trustee/leadership', title: 'Chapter Leadership Governance', component: TrusteeLeadershipPage, description: 'Trustee governance of chapter executive appointments' }),
    route({ path: '/org/chapter-leadership', title: 'Chapter Leadership Governance', component: TrusteeLeadershipPage, description: 'Trustee governance of chapter executive appointments' }),
    route({ path: '/org/trust-payments', title: 'Trust Payment Verification', component: TrustPaymentVerificationPage, description: 'Tenant-wide member payment verification and activation' }),
    route({ path: '/org/trust/payments', title: 'Trust Payment Verification', component: TrustPaymentVerificationPage, description: 'Tenant-wide member payment verification and activation' }),
    route({ path: '/org/member-onboarding', title: 'Member Onboarding', component: MemberOnboardingPage, description: 'DBN Sri Matre member verification, committee approval and Trust payment activation' }),
    route({ path: '/org/member-applications', title: 'Member Applications', component: MemberOnboardingPage, description: 'Member applications' }),
    route({ path: '/org/visitors', title: 'Visitor Management', component: VisitorManagementPage, description: 'Chapter visitor registration and attribution' }),
    route({ path: '/org/members', title: 'Members', component: MembersPage, description: 'Member operations' }),
    route({ path: '/org/members/:id', title: 'Member', component: MemberDetailPage, description: 'Member operational detail' }),
    route({ path: '/org/member-cases/:id', title: 'Member Case', component: MemberCaseDetailPage, description: 'Member Case detail' }),
    route({ path: '/org/member-cases', title: 'Member Cases', component: MemberCasesPage, description: 'Member operational cases' }),
    route({ path: '/org/growth', title: 'Membership Growth', component: MemberGrowthPage, description: 'Growth pipeline' }),
    route({ path: '/org/networking', title: 'Networking Operations', component: GrowthNetworkingPage, description: 'Networking performance' }),
    route({ path: '/org/committees/:id', title: 'Committee', component: CommitteeDetailPage, description: 'Committee detail' }),
    route({ path: '/org/committees', title: 'Committees', component: CommitteesPage, description: 'Working Committees' }),
    route({ path: '/org/plans', title: 'Annual Plan', component: PlansPage, description: 'Annual and tenure plan' }),
    route({ path: '/org/goals/:id', title: 'Goal', component: GoalDetailPage, description: 'Goal detail' }),
    route({ path: '/org/goals', title: 'Goals', component: PlansPage, description: 'Goals and targets' }),
    route({ path: '/org/programmes/:id', title: 'Programme', component: ProgrammeDetailPage, description: 'Programme detail' }),
    route({ path: '/org/programmes', title: 'Programmes', component: ProgrammesPage, description: 'Programme operations' }),
    route({ path: '/org/events/:id', title: 'Event', component: EventDetailPage, description: 'Event detail' }),
    route({ path: '/org/events', title: 'Events', component: EventsPage, description: 'Events' }),
    route({ path: '/org/attendance', title: 'Attendance', component: AttendancePage, description: 'Attendance oversight' }),
    route({ path: '/org/kyt', title: 'KYT', component: KytPage, description: 'Know Your Team / Member engagement journey' }),
    route({ path: '/org/member-presentations', title: 'Member Presentations', component: MemberPresentationsPage, description: 'Member presentation scheduling and follow-through' }),
    route({ path: '/org/membership-dues', title: 'Membership Dues', component: DuesPage, description: 'Dues operations' }),
    route({ path: '/org/payment-exceptions', title: 'Payment Exceptions', component: DuesPage, description: 'Payment reconciliation exceptions' }),
    route({ path: '/org/support/:id', title: 'Support Request', component: SupportDetailPage, description: 'Support request detail' }),
    route({ path: '/org/support', title: 'Support', component: SupportPage, description: 'Support and intervention requests' }),
    route({ path: '/org/cities/:id', title: 'City', component: CityDetailPage, description: 'City roll-up and drill-down', minimumLevel: 'CITY' }),
    route({ path: '/org/cities', title: 'City / Cluster', component: CityPage, description: 'City coordination', minimumLevel: 'CITY' }),
    route({ path: '/org/chapter-coordinators', title: 'Chapter Coordinators', component: ChapterCoordinatorsPage, description: 'Region-facing Chapter coordination responsibilities', minimumLevel: 'REGION' }),
    route({ path: '/org/regions/:id', title: 'Region', component: RegionDetailPage, description: 'Region roll-up and drill-down', minimumLevel: 'REGION' }),
    route({ path: '/org/regions', title: 'Regions', component: RegionPage, description: 'Region operations', minimumLevel: 'REGION' }),
    route({ path: '/org/states/:id', title: 'State', component: StateDetailPage, description: 'State roll-up and drill-down', minimumLevel: 'STATE' }),
    route({ path: '/org/states', title: 'States', component: StatePage, description: 'State operations', minimumLevel: 'STATE' }),
    route({ path: '/org/national', title: 'National', component: NationalPage, description: 'National operations', minimumLevel: 'NATIONAL' }),
    route({ path: '/org/management', title: 'Management', component: ManagementPage, description: 'Management and Board operational oversight', minimumLevel: 'MANAGEMENT' }),
    route({ path: '/org/escalations/:id', title: 'Escalation', component: EscalationDetailPage, description: 'Escalation detail' }),
    route({ path: '/org/escalations', title: 'Escalations', component: EscalationsPage, description: 'Escalations' }),
    route({ path: '/org/exceptions/:id', title: 'Operational Exception', component: ExceptionDetailPage, description: 'Operational exception detail' }),
    route({ path: '/org/exceptions', title: 'Operational Exceptions', component: ExceptionsPage, description: 'Exceptions' }),
    route({ path: '/org/risks/:id', title: 'Risk', component: RiskDetailPage, description: 'Risk detail' }),
    route({ path: '/org/risks', title: 'Risk', component: RiskPage, description: 'Risk register' }),
    route({ path: '/org/issues/:id', title: 'Issue', component: IssueDetailPage, description: 'Issue detail' }),
    route({ path: '/org/issues', title: 'Issues', component: IssuesPage, description: 'Issues and incidents' }),
    route({ path: '/org/decisions/:id', title: 'Decision', component: DecisionDetailPage, description: 'Operational decision detail' }),
    route({ path: '/org/decisions', title: 'Decision Register', component: DecisionsPage, description: 'Operational decisions' }),
    route({ path: '/org/communications/:id', title: 'Communication', component: CommunicationDetailPage, description: 'Communication detail' }),
    route({ path: '/org/communications', title: 'Communications', component: CommunicationsPage, description: 'Communications' }),
    route({ path: '/org/polls/:id', title: 'Poll', component: FeedbackDetailPage, description: 'Poll detail' }),
    route({ path: '/org/polls', title: 'Polls', component: CommunicationsPage, description: 'Polls' }),
    route({ path: '/org/surveys/:id', title: 'Survey', component: FeedbackDetailPage, description: 'Survey detail' }),
    route({ path: '/org/surveys', title: 'Surveys', component: CommunicationsPage, description: 'Surveys and feedback' }),
    route({ path: '/org/availability', title: 'Availability & Delegation', component: ContinuityPage, description: 'Availability, leave and delegation' }),
    route({ path: '/org/delegations', title: 'Availability & Delegation', component: ContinuityPage, description: 'Availability, leave and delegation' }),
    route({ path: '/org/handover', title: 'Handover', component: ContinuityPage, description: 'Handover continuity' }),
    route({ path: '/org/documents/:id', title: 'Document', component: DocumentDetailPage, description: 'Document/reference detail' }),
    route({ path: '/org/documents', title: 'Documents', component: DocumentsPage, description: 'Documents and SOPs' }),
    route({ path: '/org/resources', title: 'Resources', component: DocumentsPage, description: 'Operational resources' }),
    route({ path: '/org/handoffs/:id', title: 'Handoff', component: HandoffDetailPage, description: 'Handoff detail' }),
    route({ path: '/org/handoffs', title: 'Handoffs', component: HandoffsPage, description: 'Cross-workspace handoffs' }),
    route({ path: '/org/audit', title: 'Audit', component: AuditPage, description: 'Audit and diagnostic trail' }),
    route({ path: '/org/data-quality/:id', title: 'Data Quality Finding', component: DataQualityDetailPage, description: 'Data-quality finding detail' }),
    route({ path: '/org/data-quality', title: 'Data Quality', component: DataQualityPage, description: 'Data quality and corrections' }),
    route({ path: '/org/timeline', title: 'Timeline', component: TimelinePage, description: 'Operational timeline' }),
    route({ path: '/org/reports', title: 'Reports', component: ReportsPage, description: 'Reports' }),
    route({ path: '/org/analytics', title: 'Analytics', component: AnalyticsPage, description: 'Operational intelligence' }),
    route({ path: '/org/jobs/:id', title: 'Job', component: JobDetailPage, description: 'Background job detail' }),
    route({ path: '/org/jobs', title: 'Jobs', component: JobsPage, description: 'Background jobs' }),
    route({ path: '/org/imports', title: 'Imports', component: JobsPage, description: 'Imports' }),
    route({ path: '/org/exports', title: 'Exports', component: JobsPage, description: 'Exports' }),
    route({ path: '/org/notifications/:id', title: 'Notification', component: NotificationDetailPage, description: 'Notification detail' }),
    route({ path: '/org/notifications', title: 'Notifications', component: NotificationsPage, description: 'Notification inbox' }),
    route({ path: '/org/alerts/:id', title: 'Alert', component: AlertDetailPage, description: 'Operational alert detail' }),
    route({ path: '/org/alerts', title: 'Alerts', component: AlertsPage, description: 'Operational alerts' }),
    route({ path: '/org/roles-access', title: 'Roles, RACI & SoD', component: RolesAccessPage, description: 'Organisational roles, responsibilities and effective-access model' }),
    route({ path: '/org/people', title: 'People', component: PeoplePage, description: 'Operational people directory' }),
    route({ path: '/org/projects', title: 'Projects', component: ProgrammesPage, description: 'Special project operations' }),
    route({ path: '/org/projects/:id', title: 'Project', component: ProgrammeDetailPage, description: 'Special project detail' }),
    route({ path: '/org/plans/:id', title: 'Plan Goal', component: GoalDetailPage, description: 'Plan goal detail' }),
];
