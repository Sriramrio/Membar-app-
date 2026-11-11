using Sethu.Service.MembershipIntake;
using Xunit;

namespace Sethu.Persistence.Tests;

public sealed class LegacyRegistrationReconciliationTests
{
    private static readonly Guid Tenant=Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    private static readonly Guid Chapter=Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
    private static readonly Guid Registration=Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");
    private static readonly Guid Intake=Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");

    [Fact] public void MissingChapterRequiresReview() =>
        Assert.Equal("NEEDS_CHAPTER_REVIEW",LegacyRegistrationReconciliation.Assess(
            new(Registration,Tenant,null,"ABC"),Array.Empty<IntakeCandidate>()).Status);

    [Fact] public void TenantIsNeverCrossMatched() =>
        Assert.Equal("UNMATCHED_REVIEW",LegacyRegistrationReconciliation.Assess(
            new(Registration,Tenant,Chapter,"ABC"),new [] {new IntakeCandidate(Intake,Guid.NewGuid(),Chapter,"ABC")}).Status);

    [Fact] public void SimilarBusinessIsNotAnAutomaticMerge() =>
        Assert.Equal("POSSIBLE_MATCH_REVIEW",LegacyRegistrationReconciliation.Assess(
            new(Registration,Tenant,Chapter,"ABC"),new [] {new IntakeCandidate(Intake,Tenant,Chapter,"ABC")}).Status);

    [Fact] public void MultipleCandidatesAreAmbiguous() =>
        Assert.Equal("AMBIGUOUS_REVIEW",LegacyRegistrationReconciliation.Assess(
            new(Registration,Tenant,Chapter,"ABC"),new [] {new IntakeCandidate(Intake,Tenant,Chapter,"ABC"),new IntakeCandidate(Guid.NewGuid(),Tenant,Chapter,"ABC")}).Status);

    [Fact] public void EqualAggregateIdsDoNotImplyEquality() =>
        Assert.Equal("ID_COLLISION_REVIEW",LegacyRegistrationReconciliation.Assess(
            new(Registration,Tenant,Chapter,"ABC"),new [] {new IntakeCandidate(Registration,Tenant,Chapter,"ABC")}).Status);
}
