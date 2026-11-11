using System;
using Sethu.Domain.Membership;
namespace Sethu.TrackA.SourceTests;
internal static class B03IntakeTests
{
    public static void Run()
    {
        var application=MemberIntake.Draft(Guid.NewGuid(),Guid.NewGuid(),Guid.NewGuid(),Guid.NewGuid(),Guid.NewGuid(),"Sample business",DateTimeOffset.UtcNow);
        if(application.Submit(1))throw new InvalidOperationException("Stale submission accepted");
        if(!application.Submit(0))throw new InvalidOperationException("Submission refused");
        if(application.Submit(1))throw new InvalidOperationException("Duplicate submission accepted");
        if(application.MarkCommitteeApproved(1))throw new InvalidOperationException("Approval without document verification accepted");
        if(application.ConfirmFinance(1))throw new InvalidOperationException("Finance clearance without payment accepted");
        if(application.Activate(1))throw new InvalidOperationException("Activation before finance accepted");
        if(!application.MarkDocumentsVerified(1))throw new InvalidOperationException("Document transition failed");
        if(!application.MarkCommitteeApproved(2))throw new InvalidOperationException("Committee transition failed");
        if(!application.RequestPayment(3)||!application.ReportPayment(4)||!application.ConfirmFinance(5)||!application.Activate(6))throw new InvalidOperationException("Expected workflow failed");
        if(application.Withdraw(7))throw new InvalidOperationException("Active member withdrawn");
    }
}
