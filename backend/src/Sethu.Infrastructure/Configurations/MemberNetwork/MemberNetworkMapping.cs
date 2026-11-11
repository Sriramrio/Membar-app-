using System.Data;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using Sethu.Service.MemberNetwork;
using Sethu.Domain.MemberBusiness;
using Sethu.Infrastructure.MemberBusiness;
using Sethu.Infrastructure.Persistence;
using Sethu.Domain.Entities;

namespace Sethu.Infrastructure.MemberNetwork;

public static class MemberNetworkMapping
{
    public static void Configure(ModelBuilder model)
    {
        model.Entity<Connection>(e=> {
            e.ToTable("member_connections");e.HasKey(x=>x.Id);
            e.HasIndex(x=>new{x.TenantId,x.LowerMemberId,x.UpperMemberId}).IsUnique();
            e.HasIndex(x=>new{x.TenantId,x.UpperMemberId});
            e.Property(x=>x.Version).IsConcurrencyToken();
            e.ToTable(tb => tb.HasCheckConstraint("CK_member_connection_pair","\"LowerMemberId\" <> \"UpperMemberId\""));
            e.HasOne<MemberRecord>().WithMany().HasForeignKey(x=>x.LowerMemberId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne<MemberRecord>().WithMany().HasForeignKey(x=>x.UpperMemberId).OnDelete(DeleteBehavior.Restrict);
        });
    }
}
