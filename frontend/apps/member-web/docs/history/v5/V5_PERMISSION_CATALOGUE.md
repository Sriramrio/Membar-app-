# V5 Permission Catalogue

V5 uses `resource.action` permission codes and evaluates them through effective roles plus access policies, scope, identity status and context.

## Core workspace permissions
- `member.workspace.access`
- `management.workspace.access`
- `governance.workspace.access`
- `platform.workspace.access`

## Member/network permissions represented in the registry
- `directory.view`
- `opportunity.view`
- `event.view`
- `payment.view`

## Platform administration permissions
- `platform.configuration.publish`
- `platform.identity.manage`
- `platform.organisation.manage`
- `platform.role.manage`
- `platform.rbac.manage`
- `platform.workflow.manage`
- `platform.form.manage`
- `platform.taxonomy.manage`
- `platform.import.manage`
- `platform.integration.manage`
- `platform.moderation.manage`
- `platform.notification.manage`
- `platform.promotion.manage`
- `platform.audit.view`
- `platform.dataquality.manage`
- `platform.setting.manage`

## High-risk operational permissions
- `import.approve`
- `import.post`
- `payment.reverse`

Permission definitions include risk, reason requirement, re-authentication requirement, maker/checker applicability, scope applicability and audit level. Missing permissions fail closed in the V5 policy engine.
