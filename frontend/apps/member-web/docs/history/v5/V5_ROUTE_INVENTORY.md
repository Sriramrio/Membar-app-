# V5 Route Inventory

V5 preserves the V4 route contract unchanged while upgrading Platform Administration behind the existing routes.

- Authenticated/workspace routes: **84**
- Public/authentication routes: **14**
- Total application surface: **98**
- Original authenticated route contracts retained: **80/80**
- Workspace distribution: Workspace 1, Member 45, Management 13, Governance 8, Platform Administration 17.

The authoritative route validation is `npm run validate:structure`; V5 does not introduce route churn as a substitute for control-plane depth.
