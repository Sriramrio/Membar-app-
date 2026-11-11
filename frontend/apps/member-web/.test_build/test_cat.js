// Sethu updated code (2)/frontend/apps/Membar-web/src/features/member/pages/CategoryIndexPage.tsx
import { useEffect, useState, useMemo } from "react";
import { Search, X, Filter, RotateCcw } from "lucide-react";
import { Layers3, ArrowRight, FolderTree, Tag } from "lucide-react";
import { useAppSelector, useNetworkSlice } from "@/app/hooks";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState, PageHead, Tip } from "@/features/network/components/NetworkUI";
import { activeMemberId, affiliatedBusinessIdsForMember, opportunityVisibleToMember } from "@/features/network/selectors";
import { useMemberNavigation } from "@/features/member/navigation/useMemberNavigation";
import { categoriesApi } from "@/services/api/categoriesApi";
import { searchAuthoritativeDirectory } from "@/services/api/directoryApi";
import { jsx, jsxs } from "react/jsx-runtime";
function CategoryIndexPage() {
  const { go } = useMemberNavigation();
  const memberId = useAppSelector(activeMemberId);
  const n = useNetworkSlice(["affiliations", "businesses", "categories", "members", "opportunities"]);
  const [liveCategories, setLiveCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const [searchFilter, setSearchFilter] = useState("");
  const [selectedSectorFilter, setSelectedSectorFilter] = useState("");
  const [selectedSegmentFilter, setSelectedSegmentFilter] = useState("");
  const [selectedSpecFilter, setSelectedSpecFilter] = useState("");
  const [liveMemberSlotMap, setLiveMemberSlotMap] = useState({});
  const filteredLiveCategories = useMemo(() => {
    return liveCategories.map((sec) => {
      if (selectedSectorFilter && sec.id !== selectedSectorFilter) return null;
      const q = searchFilter.trim().toLowerCase();
      const secMatch = !q || sec.name.toLowerCase().includes(q);
      const matchingSegments = (sec.segments || []).map((seg) => {
        if (selectedSegmentFilter && seg.id !== selectedSegmentFilter) return null;
        const segMatch = !q || seg.name.toLowerCase().includes(q);
        const matchingSpecs = (seg.specialisations || []).filter((sp) => {
          if (selectedSpecFilter && sp.id !== selectedSpecFilter) return false;
          if (q && !sp.name.toLowerCase().includes(q)) return false;
          return true;
        });
        if (selectedSpecFilter) {
          if (matchingSpecs.length > 0) {
            return {
              ...seg,
              specialisations: matchingSpecs
            };
          }
          return null;
        }
        if (secMatch || segMatch || matchingSpecs.length > 0) {
          return {
            ...seg,
            specialisations: !q || secMatch || segMatch ? seg.specialisations : matchingSpecs
          };
        }
        return null;
      }).filter(Boolean);
      if (matchingSegments.length > 0) {
        return {
          ...sec,
          segments: matchingSegments
        };
      }
      return null;
    }).filter(Boolean);
  }, [liveCategories, searchFilter, selectedSectorFilter, selectedSegmentFilter, selectedSpecFilter]);
  useEffect(() => {
    const controller = new AbortController();
    let mounted = true;
    async function loadTaxonomy() {
      try {
        const data = await categoriesApi.getCategories(controller.signal);
        if (mounted && Array.isArray(data) && data.length > 0) {
          setLiveCategories(data);
          setIsLiveConnected(true);
          setLoading(false);
        }
      } catch {
      }
      try {
        const r1 = await fetch("/api/categories", { signal: controller.signal });
        if (r1.ok) {
          const d1 = await r1.json();
          if (mounted && Array.isArray(d1) && d1.length > 0) {
            setLiveCategories(d1);
            setIsLiveConnected(true);
            setLoading(false);
          }
        }
      } catch {
      }
      try {
        const r2 = await fetch("http://localhost:62936/api/categories", { signal: controller.signal });
        if (r2.ok) {
          const d2 = await r2.json();
          if (mounted && Array.isArray(d2) && d2.length > 0) {
            setLiveCategories(d2);
            setIsLiveConnected(true);
            setLoading(false);
          }
        }
      } catch {
      }
      if (mounted) setLoading(false);
      try {
        const dir = await searchAuthoritativeDirectory({ scope: "YourNetwork", page: 1, size: 50 }, controller.signal);
        if (mounted && dir && Array.isArray(dir.items)) {
          const map = {};
          for (const item of dir.items) {
            if (item.specialisationId) {
              map[item.specialisationId.toLowerCase()] = {
                memberName: item.businessName,
                chapterId: item.chapterId
              };
            }
          }
          setLiveMemberSlotMap(map);
        }
      } catch {
      }
    }
    void loadTaxonomy();
    return () => {
      mounted = false;
      controller.abort();
    };
  }, []);
  const reduxRows = n.categories.map((c) => {
    const businesses = n.businesses.filter((b) => b.visibility !== "hidden" && b.categoryIds.includes(c.id));
    const businessIds = new Set(businesses.map((b) => b.id));
    const members = n.members.filter((m) => m.status !== "suspended" && affiliatedBusinessIdsForMember(n, m.id).some((id) => businessIds.has(id)));
    const opportunities = n.opportunities.filter((o) => o.categoryId === c.id && o.status === "open" && opportunityVisibleToMember({ network: n }, o, memberId));
    return { c, businesses, members, opportunities };
  });
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsx(
      PageHead,
      {
        title: "Business Categories"
      }
    ),
    /* @__PURE__ */ jsxs("div", { className: "my-5 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs", children: [
      /* @__PURE__ */ jsx("label", { htmlFor: "category-search-input", className: "mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600", children: "Search all  categories across the network" }),
      /* @__PURE__ */ jsxs("div", { className: "relative", children: [
        /* @__PURE__ */ jsx(Search, { className: "pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" }),
        /* @__PURE__ */ jsx(
          "input",
          {
            id: "category-search-input",
            type: "search",
            value: searchFilter,
            onChange: (e) => setSearchFilter(e.target.value),
            placeholder: "Type any Industry, Group, or Category (e.g. Chemicals, Logistics, IT, Machinery)...",
            className: "h-11 w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-9 text-sm text-slate-800 placeholder:text-slate-400 transition focus:border-sky-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-100"
          }
        ),
        searchFilter && /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            onClick: () => setSearchFilter(""),
            className: "absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600",
            children: /* @__PURE__ */ jsx(X, { className: "size-4" })
          }
        )
      ] }),
      searchFilter && /* @__PURE__ */ jsxs("p", { className: "mt-2 text-xs font-medium text-sky-700", children: [
        "Showing matching categories for \u201C",
        searchFilter,
        "\u201D (",
        filteredLiveCategories.length,
        " sectors matching)"
      ] }),
      (searchFilter || selectedSectorFilter || selectedSegmentFilter || selectedSpecFilter) && /* @__PURE__ */ jsxs("div", { className: "mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-2.5", children: [
        /* @__PURE__ */ jsx("span", { className: "text-xs font-bold text-slate-500", children: "Active filters:" }),
        searchFilter && /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700", children: [
          "Text: \u201C",
          searchFilter,
          "\u201D",
          /* @__PURE__ */ jsx("button", { type: "button", onClick: () => setSearchFilter(""), className: "hover:text-red-600", children: /* @__PURE__ */ jsx(X, { className: "size-3" }) })
        ] }),
        selectedSectorFilter && /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1 rounded-full bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 text-xs font-bold text-indigo-800", children: [
          "Sector: ",
          liveCategories.find((s) => s.id === selectedSectorFilter)?.name,
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              onClick: () => {
                setSelectedSectorFilter("");
                setSelectedSegmentFilter("");
                setSelectedSpecFilter("");
              },
              className: "hover:text-red-600",
              children: /* @__PURE__ */ jsx(X, { className: "size-3" })
            }
          )
        ] }),
        selectedSegmentFilter && /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1 rounded-full bg-purple-50 border border-purple-200 px-2.5 py-0.5 text-xs font-bold text-purple-800", children: [
          "Group: ",
          (() => {
            const sec = liveCategories.find((s) => s.id === selectedSectorFilter);
            return sec?.segments?.find((g) => g.id === selectedSegmentFilter)?.name || "Group";
          })(),
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              onClick: () => {
                setSelectedSegmentFilter("");
                setSelectedSpecFilter("");
              },
              className: "hover:text-red-600",
              children: /* @__PURE__ */ jsx(X, { className: "size-3" })
            }
          )
        ] }),
        selectedSpecFilter && /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1 rounded-full bg-sky-100 border border-sky-200 px-2.5 py-0.5 text-xs font-bold text-sky-800", children: [
          "Specialisation: ",
          (() => {
            const sec = liveCategories.find((s) => s.id === selectedSectorFilter);
            const seg = sec?.segments?.find((g) => g.id === selectedSegmentFilter);
            return seg?.specialisations?.find((sp) => sp.id === selectedSpecFilter)?.name || "Slot";
          })(),
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              onClick: () => setSelectedSpecFilter(""),
              className: "hover:text-red-600",
              children: /* @__PURE__ */ jsx(X, { className: "size-3" })
            }
          )
        ] }),
        /* @__PURE__ */ jsxs(
          "button",
          {
            type: "button",
            onClick: () => {
              setSelectedSectorFilter("");
              setSelectedSegmentFilter("");
              setSelectedSpecFilter("");
              setSearchFilter("");
            },
            className: "ml-auto inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-bold text-red-700 hover:bg-red-100 transition",
            children: [
              /* @__PURE__ */ jsx(RotateCcw, { className: "size-3" }),
              /* @__PURE__ */ jsx("span", { children: "Clear All Filters" })
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mt-4 border-t border-slate-100 pt-3", children: [
        /* @__PURE__ */ jsxs("div", { className: "mb-2 flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1.5 text-xs font-bold text-slate-700", children: [
            /* @__PURE__ */ jsx(Filter, { className: "size-3 text-sky-600" }),
            "Filter by Sector, Segment & Specialisation"
          ] }),
          (selectedSectorFilter || selectedSegmentFilter || selectedSpecFilter || searchFilter) && /* @__PURE__ */ jsxs(
            "button",
            {
              type: "button",
              onClick: () => {
                setSelectedSectorFilter("");
                setSelectedSegmentFilter("");
                setSelectedSpecFilter("");
                setSearchFilter("");
              },
              className: "inline-flex items-center gap-1 text-xs font-bold text-sky-600 hover:text-sky-800 hover:underline",
              children: [
                /* @__PURE__ */ jsx(RotateCcw, { className: "size-3" }),
                /* @__PURE__ */ jsx("span", { children: "Clear filters" })
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid gap-2 sm:grid-cols-3", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-[11px] font-bold text-slate-600 mb-1", children: "Filter by Sector (Industry)" }),
            /* @__PURE__ */ jsxs(
              "select",
              {
                "aria-label": "Filter by Sector",
                className: "h-9 w-full rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 transition focus:border-sky-500 focus:outline-none",
                value: selectedSectorFilter,
                onChange: (e) => {
                  setSelectedSectorFilter(e.target.value);
                  setSelectedSegmentFilter("");
                  setSelectedSpecFilter("");
                },
                children: [
                  /* @__PURE__ */ jsxs("option", { value: "", children: [
                    "All Sectors (",
                    liveCategories.length || 27,
                    ")"
                  ] }),
                  liveCategories.map((s) => /* @__PURE__ */ jsx("option", { value: s.id, children: s.name }, s.id))
                ]
              }
            )
          ] }),
          (() => {
            const curSec = liveCategories.find((s) => s.id === selectedSectorFilter);
            const curSegs = curSec?.segments || [];
            return /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "block text-[11px] font-bold text-slate-600 mb-1", children: "Filter by Segment (Business Group)" }),
              /* @__PURE__ */ jsxs(
                "select",
                {
                  disabled: !selectedSectorFilter,
                  "aria-label": "Filter by Segment",
                  className: "h-9 w-full rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 transition focus:border-sky-500 focus:outline-none disabled:bg-slate-50 disabled:text-slate-400",
                  value: selectedSegmentFilter,
                  onChange: (e) => {
                    setSelectedSegmentFilter(e.target.value);
                    setSelectedSpecFilter("");
                  },
                  children: [
                    /* @__PURE__ */ jsx("option", { value: "", children: selectedSectorFilter ? `All Segments (${curSegs.length})` : "Select Sector first" }),
                    curSegs.map((g) => /* @__PURE__ */ jsx("option", { value: g.id, children: g.name }, g.id))
                  ]
                }
              )
            ] });
          })(),
          (() => {
            const curSec = liveCategories.find((s) => s.id === selectedSectorFilter);
            const curSeg = curSec?.segments?.find((g) => g.id === selectedSegmentFilter);
            const curSpecs = curSeg?.specialisations || [];
            return /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "block text-[11px] font-bold text-slate-600 mb-1", children: "Filter by Specialisation (Slot)" }),
              /* @__PURE__ */ jsxs(
                "select",
                {
                  disabled: !selectedSegmentFilter,
                  "aria-label": "Filter by Specialisation",
                  className: "h-9 w-full rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 transition focus:border-sky-500 focus:outline-none disabled:bg-slate-50 disabled:text-slate-400",
                  value: selectedSpecFilter,
                  onChange: (e) => {
                    setSelectedSpecFilter(e.target.value);
                  },
                  children: [
                    /* @__PURE__ */ jsx("option", { value: "", children: selectedSegmentFilter ? `All Specialisations (${curSpecs.length})` : "Select Segment first" }),
                    curSpecs.map((sp) => /* @__PURE__ */ jsx("option", { value: sp.id, children: sp.name }, sp.id))
                  ]
                }
              )
            ] });
          })()
        ] })
      ] })
    ] }),
    loading ? /* @__PURE__ */ jsx("div", { className: "py-12 text-center text-slate-500", children: /* @__PURE__ */ jsx("p", { className: "animate-pulse", children: "Loading governed business categories from database\u2026" }) }) : isLiveConnected && liveCategories.length > 0 ? (
      /* LIVE API VIEW FROM DATABASE */
      /* @__PURE__ */ jsx("div", { className: "grid gap-6 sm:grid-cols-2 xl:grid-cols-3", children: filteredLiveCategories.map((sector) => {
        const totalSpecialisations = sector.segments.reduce((acc, seg) => acc + (seg.specialisations?.length || 0), 0);
        return /* @__PURE__ */ jsxs(Card, { className: "flex h-full flex-col p-6 shadow-sm hover:shadow-md transition", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3", children: [
            /* @__PURE__ */ jsx("span", { className: "grid size-11 shrink-0 place-items-center rounded-xl bg-sky-50 text-sky-800", children: /* @__PURE__ */ jsx(Layers3, { className: "size-5" }) }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("h2", { className: "text-lg font-black text-[var(--navy-950)]", children: sector.name }),
              /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-slate-500", children: "Governed Business Sector" })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "mt-4 flex flex-wrap gap-2", children: [
            /* @__PURE__ */ jsxs(Badge, { children: [
              sector.segments.length,
              " segments"
            ] }),
            /* @__PURE__ */ jsxs(Badge, { children: [
              totalSpecialisations,
              " specialisations"
            ] })
          ] }),
          sector.segments.length > 0 && /* @__PURE__ */ jsxs("div", { className: "mt-4 border-t border-slate-100 pt-3", children: [
            /* @__PURE__ */ jsx("div", { className: "text-xs font-bold uppercase tracking-wider text-slate-400 mb-2", children: "Segments & Specialisations" }),
            /* @__PURE__ */ jsx("div", { className: "space-y-2 max-h-40 overflow-y-auto pr-1", children: sector.segments.map((seg) => /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-slate-50 p-2.5 text-xs", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 font-bold text-slate-800", children: [
                /* @__PURE__ */ jsx(FolderTree, { className: "size-3.5 text-sky-600" }),
                /* @__PURE__ */ jsx("span", { children: seg.name })
              ] }),
              seg.specialisations && seg.specialisations.length > 0 && /* @__PURE__ */ jsx("div", { className: "mt-2 space-y-1.5 pl-2", children: seg.specialisations.map((sp) => {
                const liveSlot = liveMemberSlotMap[sp.id.toLowerCase()];
                const assignedName = liveSlot ? liveSlot.memberName : n.members.find((m) => {
                  const biz = n.businesses.find((b) => b.ownerMemberId === m.id || affiliatedBusinessIdsForMember(n, m.id).includes(b.id));
                  return biz && (biz.specialisationId === sp.id || biz.categoryIds?.includes(sp.id));
                })?.name;
                return /* @__PURE__ */ jsxs(
                  "div",
                  {
                    className: "flex items-center justify-between rounded-lg bg-white px-2.5 py-1.5 border border-slate-200/80 hover:border-sky-300 transition",
                    children: [
                      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5", children: [
                        /* @__PURE__ */ jsx(Tag, { className: "size-3 text-sky-600 shrink-0" }),
                        /* @__PURE__ */ jsx("span", { className: "font-semibold text-slate-800 text-[11px]", children: sp.name })
                      ] }),
                      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                        assignedName ? /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200", children: [
                          /* @__PURE__ */ jsx("span", { className: "size-1.5 rounded-full bg-emerald-500" }),
                          assignedName
                        ] }) : /* @__PURE__ */ jsx("span", { className: "inline-flex items-center gap-1 rounded bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-500 border border-slate-200", children: "Vacant Slot" }),
                        /* @__PURE__ */ jsx(
                          "button",
                          {
                            type: "button",
                            onClick: () => go(`/app/directory?scope=network&sectorId=${encodeURIComponent(sector.id)}&segmentId=${encodeURIComponent(seg.id)}&specialisationId=${encodeURIComponent(sp.id)}`, { label: sp.name }),
                            className: "text-[10px] font-bold text-sky-600 hover:text-sky-800 hover:underline",
                            children: "View in Directory \u2192"
                          }
                        )
                      ] })
                    ]
                  },
                  sp.id
                );
              }) })
            ] }, seg.id)) })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "mt-auto flex flex-wrap gap-2 pt-5", children: /* @__PURE__ */ jsxs(
            Button,
            {
              variant: "secondary",
              onClick: () => go(`/app/directory?scope=network&sectorId=${encodeURIComponent(sector.id)}&q=${encodeURIComponent(sector.name)}`, { label: sector.name }),
              children: [
                "Browse network ",
                /* @__PURE__ */ jsx(ArrowRight, { className: "size-4" })
              ]
            }
          ) })
        ] }, sector.id);
      }) })
    ) : reduxRows.length ? (
      /* REDUX FALLBACK */
      /* @__PURE__ */ jsx("div", { className: "grid gap-4 sm:grid-cols-2 xl:grid-cols-3", children: reduxRows.map(({ c, businesses, members, opportunities }) => /* @__PURE__ */ jsxs(Card, { className: "flex h-full flex-col p-5", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3", children: [
          /* @__PURE__ */ jsx("span", { className: "grid size-11 shrink-0 place-items-center rounded-xl bg-sky-50 text-sky-800", children: /* @__PURE__ */ jsx(Layers3, { className: "size-5" }) }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h2", { className: "text-lg font-black text-[var(--navy-950)]", children: c.name }),
            /* @__PURE__ */ jsx("p", { className: "mt-1 text-base leading-7 text-slate-600", children: c.description })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "mt-4 flex flex-wrap gap-2", children: [
          /* @__PURE__ */ jsxs(Badge, { children: [
            businesses.length,
            " businesses"
          ] }),
          /* @__PURE__ */ jsxs(Badge, { children: [
            members.length,
            " members"
          ] }),
          /* @__PURE__ */ jsxs(Badge, { children: [
            opportunities.length,
            " open opportunities"
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "mt-auto flex flex-wrap gap-2 pt-5", children: [
          /* @__PURE__ */ jsxs(Button, { variant: "secondary", onClick: () => go(`/app/directory?category=${encodeURIComponent(c.id)}`, { label: "Business Categories" }), children: [
            "Browse network ",
            /* @__PURE__ */ jsx(ArrowRight, { className: "size-4" })
          ] }),
          /* @__PURE__ */ jsx(Button, { variant: "ghost", onClick: () => go(`/app/opportunities?category=${encodeURIComponent(c.id)}`, { label: "Business Categories" }), children: "View opportunities" })
        ] })
      ] }, c.id)) })
    ) : /* @__PURE__ */ jsx(
      EmptyState,
      {
        title: "No business categories are available",
        body: "The governed taxonomy has no categories visible to this Member workspace. Contact platform administration if this is unexpected."
      }
    ),
    /* @__PURE__ */ jsx("div", { className: "mt-5", children: /* @__PURE__ */ jsx(Tip, { children: "Category counts respect business visibility and opportunity-scope rules. Hidden businesses and inaccessible opportunities are not included." }) })
  ] });
}
export {
  CategoryIndexPage as default
};
