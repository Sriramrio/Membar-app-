# SETHU V7.1 R18 — Realistic Multi-Chapter Deployment Dataset Guide

## Purpose
R18 deepens the R17 deployment seed for realistic Member, Chapter, City, State, Business, Opportunity, One-to-One, Business Outcome, Event and contextual Note testing without changing the production domain architecture.

## Scale
- 13 deployment Chapters.
- Exactly 50 synthetic Members per Chapter = 650 generated Members.
- Exactly 650 generated Businesses and 650 active Verified MemberBusinessAffiliations.
- 25 direct preview Member login accounts; exactly 5 are Chennai accounts.
- Chennai: 3 Chapters × 50 = 150 generated Members.
- 20 Business Sectors, 48 Business Segments and 48 Business Specialisations.
- 2,800 generated Connections.
- 325 Opportunities.
- 1,300 One-to-One Meetings.
- 442 Transactions / Business Outcomes, total synthetic value ₹202,215,000.
- 39 Events (3 per Chapter).
- 2,776 contextual MemberInteractionNotes.

## Geographic coverage
Chennai Central, Chennai South, Chennai West, Hosur, Coimbatore, Trichy, Madurai, Mysuru, Bengaluru Central, Bengaluru South, Hyderabad Central, Hyderabad West and Mumbai Central.

## Business taxonomy design
The R18 taxonomy intentionally moves away from manufacturing-heavy sample data. It uses a broad business-network mix across technology, finance, accounting/audit, legal, consulting, education, healthcare, wellness, food/hospitality, retail, real estate, architecture/interiors, construction services, trade, import/export, travel, mobility, media/arts, cultural services, events, community services, home services, agriculture/sustainability, selected industrial businesses, logistics, startups, research/advisory, traditional advisory, safety/compliance, printing and packaging.

The seed is synthetic. It does not store or infer a Member's caste, religion or other sensitive personal attribute. Cultural/religious offerings are represented only as business-service taxonomy entries where needed for product testing.

## Relationship realism
Connections deliberately include:
- 1,300 within-Chapter relationships.
- 350 same-city/different-Chapter relationships.
- 500 same-state/different-city relationships.
- 650 cross-state relationships.

One-to-One Meetings include:
- 650 within-Chapter.
- 119 same-city/different-Chapter.
- 170 same-state/different-city.
- 361 cross-state.
- 871 completed and 429 confirmed/upcoming.

Business Outcomes include:
- 221 within-Chapter.
- 42 same-city/different-Chapter.
- 60 same-state/different-city.
- 119 cross-state.
- Status mix: proposal, negotiation and confirmed.

Opportunity visibility includes Chapter, Regional and Network scopes. Interaction Notes include private and participant-visible notes linked to Meetings, Opportunities and Transactions.

## Login testing
All R18 preview Member accounts use the existing preview password:

`Sethu@123456`

Use `fixtures/r18_reference_csv/SETHU_R18_LOGIN_MATRIX.csv` for the full login list.

## CSV reference exports
`fixtures/r18_reference_csv/` contains:
- SETHU_R18_CHAPTER_SUMMARY.csv
- SETHU_R18_MEMBERS.csv
- SETHU_R18_BUSINESSES.csv
- SETHU_R18_MEMBER_BUSINESS_AFFILIATIONS.csv
- SETHU_R18_TAXONOMY.csv
- SETHU_R18_LOGIN_MATRIX.csv
- SETHU_R18_CONNECTIONS.csv
- SETHU_R18_OPPORTUNITIES.csv
- SETHU_R18_ONE_TO_ONE_MEETINGS.csv
- SETHU_R18_TRANSACTIONS_BUSINESS_OUTCOMES.csv
- SETHU_R18_EVENTS.csv
- SETHU_R18_INTERACTION_NOTES.csv

Regenerate them with `npm run generate:r18:csv` where Python is available.

## Invariants
- Exactly one current active/Verified Business affiliation per generated Member.
- Historical/multi-affiliation-capable architecture remains intact.
- All Member, Business, Opportunity, Meeting, Transaction and Note references are deterministic and unique.
- Notes remain separate from Converse.
- Commercial values use participant visibility.
- Cross-scope relationships never depend on free-text geography alone; generated Members remain attached to governed Chapter/City/Region/State units.
