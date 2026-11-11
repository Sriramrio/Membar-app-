using System.Data;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using Sethu.Service.MemberNetwork;
using Sethu.Service.Layered;
using Sethu.Domain.MemberBusiness;
using Sethu.Infrastructure.MemberBusiness;
using Sethu.Infrastructure.MemberNetwork;
using Sethu.Infrastructure.Persistence;
using Sethu.Domain.Entities;
namespace Sethu.Infrastructure.Layered;

public static class ConnectionTransitionMapping
{
    public static void Configure(ModelBuilder model)
    {
        model.Entity<ConnectionTransition>(e=>{
            e.ToTable("network_connection_transitions");
            e.HasKey(x=>x.Id);
            e.Property(x=>x.PreviousState).HasMaxLength(32);
            e.Property(x=>x.NewState).HasMaxLength(32).IsRequired();
            e.Property(x=>x.Action).HasMaxLength(32).IsRequired();
            e.HasIndex(x=>new{x.TenantId,x.ConnectionId,x.OccurredAt});
            e.HasOne<Connection>().WithMany().HasForeignKey(x=>x.ConnectionId).OnDelete(DeleteBehavior.Restrict);
        });
    }
}
