using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Sethu.Domain.Entities;
using Sethu.Infrastructure.Persistence;

namespace Sethu.Api.Controllers;

[ApiController]
[AllowAnonymous]
[Route("api/categories")]
[Route("categories")]
public class CategoriesController : ControllerBase
{
    private readonly SethuDbContext _db;

    public CategoriesController(SethuDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> GetCategories(CancellationToken ct)
    {
        try
        {
            var sectors = await _db.Set<Sector>().AsNoTracking().Where(s => s.Active).ToListAsync(ct);
            var segments = await _db.Set<Segment>().AsNoTracking().Where(s => s.Active).ToListAsync(ct);
            var specs = await _db.Set<Specialisation>().AsNoTracking().Where(s => s.Active).ToListAsync(ct);

            var tree = sectors.Select(sec => new
            {
                id = sec.Id,
                name = sec.Name,
                segments = segments.Where(seg => seg.SectorId == sec.Id).Select(seg => new
                {
                    id = seg.Id,
                    name = seg.Name,
                    specialisations = specs.Where(sp => sp.SegmentId == seg.Id).Select(sp => new
                    {
                        id = sp.Id,
                        name = sp.Name
                    }).ToList()
                }).ToList()
            }).ToList();

            return Ok(tree);
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested)
        {
            return StatusCode(499);
        }
    }
}
