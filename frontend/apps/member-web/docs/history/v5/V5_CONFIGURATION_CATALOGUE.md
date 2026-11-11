# V5 Configuration Catalogue

| Namespace / entity | Scope / versioning | Primary consumers |
|---|---|---|
| ModuleDefinition | Global, versioned | Navigation, route/module availability |
| ActionDefinition | Global/domain, versioned | Authorization middleware, audit metadata |
| PermissionDefinition | Global, versioned | RBAC engine, admin actions |
| OrganisationUnitTypeDefinition | Global, versioned | Hierarchy validation |
| OrganisationUnitDefinition | Effective-dated | Scope resolution, role/workflow context |
| RoleDefinition | Workspace/unit-type, versioned | RBAC/navigation/workflows |
| AccessPolicyRule | Role/workspace/scope/effective date | `evaluateControlPermission` |
| RaciDefinition | Process/workflow/stage/action | Workflow actor resolution |
| WorkflowBlueprint | Domain/entity, immutable active version | Workflow runtime |
| SlaPolicy | Workflow/stage | Due dates/escalation |
| MakerCheckerPolicy | Entity/action | Approval segregation |
| DynamicFormDefinition | Purpose, versioned | Event/opportunity/member/visitor form consumers |
| TaxonomyDefinition | Domain/hierarchy/effective date | Business profiles, directory, matching |
| NotificationEventDefinition | Domain event | Template/routing validation |
| NotificationTemplateDefinition | Event/channel/language/audience | Notification runtime |
| NotificationRoutingPolicy | Event | Recipient/channel/dedupe/delivery/acknowledgement |
| PromotionPolicyDefinition | Audience/scope | Promotion runtime |
| ImportProfile | Domain/source/version | Import staging/validation/post/reversal |
| IntegrationDefinition | Provider/interface | Runtime connectors/health |
| WebhookDefinition | Domain events | Outbound event subscriptions |
| DataQualityRuleDefinition | Entity/condition | Data-quality remediation |
| SettingDefinition / SettingOverride | Global → scoped inheritance | Functional selectors/runtime adapter |
| FeatureFlagDefinition | Org/role/date | Controlled rollout |
| RetentionPolicyDefinition | Domain | Retention governance |
| NumberingRuleDefinition | Entity/scope | Business identifier sequencing |
| MatchingPolicyDefinition | Directory/search | Explainable matching |

All high-impact edits are represented as governed `ConfigurationChange` records before activation.
