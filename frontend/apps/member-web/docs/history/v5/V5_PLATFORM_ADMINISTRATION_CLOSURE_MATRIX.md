# V5 Platform Administration Closure Matrix

**Baseline:** V4 FINAL 4.0.0  
**Target:** V5 Platform Administration 5.0.0

A capability is marked **Implemented / source-validated** only where the admin configuration has a runtime consumer and the source contract validates that linkage. Browser/backend certification remains a separate gate.

| Capability | Configuration / admin surface | Runtime consumer / effect | Governance / security | V4 compatibility | Status |
|---|---|---|---|---|---|
| Configuration releases | `ConfigurationChange`, `PlatformConfigurationVersion`, Release Panel | `controlPlaneRuntimeMiddleware` materialises approved active configuration | Validate → impact → submit → independent approve → activate; concurrency/idempotency; governed rollback | V4 runtime contracts materialised through adapters | Implemented / source-validated |
| Module registry | `ModuleDefinition` | Platform Admin navigation/module availability | Permission-bound config release | Existing route roots retained | Implemented / source-validated |
| Action registry | `ActionDefinition` + `runtimeActionTypes` | Authorization middleware resolves configured action permissions | Risk, reason, workflow metadata | Existing Redux actions retained | Implemented / source-validated |
| Permission catalogue | `PermissionDefinition` | `evaluateControlPermission` | Fail-closed when permission is undefined | V4 role names resolved through role catalogue | Implemented / source-validated |
| Organisation hierarchy | Unit types + effective units | Scope resolution, role eligibility, workflow/admin context | Circular/type validation, versioned release | V4 org units hydrated | Implemented / source-validated |
| Role catalogue / assignments | `RoleDefinition` + V4 effective assignments | Workspace/action authorization, navigation, workflow eligibility | Effective dates, independent approval, maker/checker restrictions | Member/Secretary/Treasurer/Regional/Reviewer aliases retained | Implemented / source-validated |
| RBAC simulator | Policy engine + simulator page | Same evaluator used for protected Platform Admin routes/actions | Explicit deny, scope/context, MFA | V4 access still gated by legacy workspace contract first | Implemented / source-validated |
| RACI | Versioned RACI definitions | Workflow action eligibility | Resolver/role validation, deny auditing | V4 RACI hydrated/adapted | Implemented / source-validated |
| Workflow Designer | `WorkflowBlueprint`, transitions | Workflow Inbox legal transitions | RACI + SLA + maker/checker + evidence/reason rules | V4 workflows continue under V4 state machine when no V5 definition applies | Implemented / source-validated |
| SLA / escalation | `SlaPolicy` | Task due dates after V5 transitions | Governed workflow configuration | V4 workflow SLA adapted | Implemented / source-validated |
| Maker-checker | `MakerCheckerPolicy` | Workflow/import approval separation | Independent identity, role, unit, second-checker rules | Existing import lifecycle preserved | Implemented / source-validated |
| Form Builder | Dynamic versioned forms | Runtime adapters + event/opportunity/member flows that use governed definitions | Form validation before activation | V4 forms hydrated and remain readable | Implemented / source-validated |
| Taxonomy | Versioned taxonomy | Directory/search/business capability matching; taxonomy imports | Parent/reference validation, no destructive historic reinterpretation | V4 taxonomy hydrated | Implemented / source-validated |
| Search/matching policy | `MatchingPolicyDefinition` | Directory matching weights/minimum score | Governed operational policy release | Existing V4 directory routes preserved | Implemented / source-validated |
| Notification templates | Versioned templates | `notifyByEvent` resolves V5 template first | Event-variable validation | V4 templates remain fallback | Implemented / source-validated |
| Notification routing | Routing policies | Channel selection, dedupe, Immediate/Digest metadata, acknowledgement metadata | Governed route revisions | Existing notification actions retained | Implemented / source-validated |
| Promotion policy | `PromotionPolicyDefinition` | Network promotion runtime policy | Approval/moderation/frequency controls | V4 promotion contracts adapted | Implemented / source-validated |
| Import Profiles | Versioned profiles | Mapping/required fields/duplicates/posting/reversal pinned to batch | Maker/checker and reversal rules | V4 import lifecycle retained | Implemented / source-validated |
| Import posting | Batch workflow | Attendance, Payment, Member, Business, Visitor and Taxonomy targets | Authorization, audit, reversible where profile permits | Existing V4 batch status contract retained | Implemented / source-validated |
| Integrations | Integration definitions | V4-compatible runtime connectors + health | Secret references only, governed revision | V4 integration records hydrated | Implemented / source-validated |
| Webhooks | Webhook definitions | Governed event subscriptions / delivery evidence contract | Signing, retries, secret references, audit | Additive | Implemented / source-validated |
| Moderation | V4/V5 moderation configuration and workflow | Certification/content moderation effects | Decision audit | V4 moderation retained | Implemented / source-validated |
| Data quality | Rules + remediation | Existing remediation queue/workflow | Maker/checker decision path | V4 data-quality issues preserved | Implemented / source-validated |
| Settings registry | Typed settings + overrides | `selectEffectiveSetting`, runtime settings adapter | Scope inheritance, versioning, authority permission | V4 settings hydrated | Implemented / source-validated |
| Feature flags | Versioned feature flags | Module/feature evaluation | Dependency validation, kill switch | Additive | Implemented / source-validated |
| Retention / numbering | Versioned operational policies | Runtime/control-plane consumers and numbering increment contract | Governed change | Additive | Implemented / source-validated |
| Governance linkage | Existing V4 governance + V5 configuration releases | Approved decisions/configuration affect runtime through adapters | Independent approval, immutable history concepts | V4 governance routes retained | Implemented / source-validated |
| Audit / security events | Enterprise audit + control-plane security events | Denied actions and configuration/runtime changes traceable | Correlation/policy version | V4 audit retained | Implemented / source-validated |
| Admin command search | Header global search | Roles, workflows, forms, taxonomy, integrations, config changes and audit objects | Permission-filtered workspace | Existing global search preserved | Implemented / source-validated |
| Browser persistence boundary | Store/storage services | Protected runtime in session storage; durable low-risk configuration/preferences only | No static preview password/OTP | Same V4 security boundary | Implemented / source-validated |

## Certification boundary

Dependency-backed `npm run typecheck`, Vitest, Vite production build and real browser/device/accessibility execution require a complete npm dependency installation. They are not marked as passed unless executed successfully in that environment.
