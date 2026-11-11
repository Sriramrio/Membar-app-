# V6 Member Experience Closure Matrix

| Capability | Runtime source | Drill / return behavior | V5 control-plane / policy | Validation status |
|---|---|---|---|---|
| Member role context | Effective assignments + Role Catalogue | Restores per-workspace context | Role/permission/scope engine | Source validated |
| Navigation origin | Member navigation slice/service | Route/query/entity/return stack | Route allowed rechecked before return | Source validated |
| Unsaved work guard | Dirty guard from Profile/Business | Governs contextual go/back and role change | Uses governed ActionDialog | Source validated |
| Action Required | Existing network/enterprise/domain states | Exact entity/action deep links | Existing permissions/workflows remain authoritative | Source validated |
| Member KPI catalogue | Central metric registry | Each metric defines drill route/filter | Enabled metrics configurable | Source validated |
| Period handling | Shared period resolver | Current/comparison periods consistent | Default period configurable | Source validated |
| Personal dashboard | MemberDashboardProjection | Drillable cards and lists | Metric/recommendation settings consumed | Source validated |
| Multi-business summary | MemberBusinessAffiliation + businesses | Business detail/related domain links | Affiliation/privacy policies retained | Source validated |
| Chapter performance | ChapterMemberViewProjection | Member-safe Chapter drill-downs only | Chapter enablement, minimum aggregation and metric list configurable | Source validated |
| Chapter privacy | Aggregate projection + threshold | Restricted metrics fail closed | Existing privacy/RBAC/scope retained | Source validated |
| Member ↔ Business | Existing member/business graph | Origin-preserving navigation | Field/privacy policy retained | Source validated |
| Meeting/Reference/Outcome links | Existing domain identifiers | Contextual cross-links with back stack | Existing state machines retained | Source validated |
| Messaging entity context | Conversation context metadata | Return to linked business/opportunity/meeting/reference | Existing messaging permissions retained | Source validated |
| Activity / Action Centre | Existing `/app/activity` route | `view=actions` compatibility view | No duplicate workflow database | Source validated |
| Navigation simplification | Existing Member route inventory | Grouping changes only | Module/control-plane compatibility retained | Source validated |
| Member boundary | MemberPageBoundary | Missing/denied/inactive/expired fail closed | V5 route/module policy checked | Source validated |
| V5 backward compatibility | Existing V3/V4/V5 validators | Exact route surface retained | No control-plane bypass | PASS |

**Completion rule:** a dashboard item is not treated as complete merely because it renders. V6 requires domain-backed data, correct permission/privacy behavior, drill-down, return context and compatibility evidence.
