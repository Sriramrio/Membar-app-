# V6 Role Context and Navigation Specification

1. Member remains the base authenticated identity; role context does not create a second identity.
2. The additional-role affordance is absent when no effective secondary assignment exists.
3. Secondary choices are derived from effective V5 assignments; expired/revoked/inactive contexts are not treated as active.
4. Member and page breadcrumbs are separate concerns: the header answers *which role am I using?* while breadcrumbs answer *where am I?*
5. Per-workspace navigation context is retained in session scope.
6. Cross-links use approved internal destinations only; unsafe arbitrary redirects are rejected.
7. A saved origin is re-authorized before return. If no longer allowed, V6 falls back safely to Member Dashboard.
8. Profile/Business dirty state is published to the central guard; contextual go/back and role change respect it.
9. Role context changes announce the new context to assistive technology.
10. Member context never exposes Management actions simply because the same identity owns another Management assignment.
