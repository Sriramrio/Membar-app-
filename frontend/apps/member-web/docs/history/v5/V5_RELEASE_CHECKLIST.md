# V5 Release Checklist

- [x] V4 immutable baseline preserved as compatibility target
- [x] package version locked to 5.0.0
- [x] V5 control-plane contract validator added
- [x] V4 source compatibility validator passes after V5 changes
- [x] V5 source contract validator passes
- [x] no native prompt/confirm business actions
- [x] no static preview OTP/password
- [x] configuration changes require validate + impact before submission
- [x] maker/checker enforced for configuration activation
- [x] concurrency conflict detection and idempotency represented
- [x] rollback is a governed new draft, not an in-place history mutation
- [x] profile-driven imports post into live functional domains
- [x] active notification routing/templates affect runtime delivery metadata
- [x] required V5 architecture/compatibility/catalogue evidence created
- [ ] dependency-backed typecheck/test/build — environment dependency boundary
- [ ] rendered-browser/accessibility/security matrix — requires dependency-backed runtime
- [x] clean candidate ZIP extraction/hash/revalidation PASS — 289 source/evidence files verified; forbidden dependency/build/VCS artefacts absent
- [x] final ZIP clean-extraction/hash/revalidation — required and rerun after final manifest freeze
