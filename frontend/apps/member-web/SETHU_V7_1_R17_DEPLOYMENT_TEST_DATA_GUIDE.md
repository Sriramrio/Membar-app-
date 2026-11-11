# SETHU V7.1 R17 — Deployment & Multi-Chapter Test Data Guide

## Purpose

This checkpoint expands the SETHU preview/runtime seed so deployment testing can exercise realistic Member discovery, Chapter scope, cross-Chapter networking, one-to-one meetings, Opportunities, Business Outcomes, contextual Notes, taxonomy matching and multiple authenticated Member personas.

## Dataset scale

- Added deployment-test Members: **132** (runtime total: **180**)
- Added deployment-test Businesses: **132** (runtime total: **168**)
- Added direct Member preview logins: **25**
- Chennai deployment-test Members: **32** across **3** Chapters
- Minimum generated Members per Chapter: **10**
- Governed business taxonomy: **12 Sectors → 18 Segments → 18 Specialisations**
- Each generated Member has **exactly one active/verified Business affiliation**.
- Existing historical ended affiliations remain untouched.
- Synthetic Chapter events, Opportunities, One-to-Ones, Business Outcomes, same-Chapter/cross-Chapter connections and private relationship Notes are included for contextual testing.

## Chapter coverage

| Chapter | City | State | Members | Direct logins |
| --- | --- | --- | ---: | ---: |
| Chennai Central Chapter | Chennai | Tamil Nadu | 12 | 2 |
| Chennai South Chapter | Chennai | Tamil Nadu | 10 | 2 |
| Chennai West Chapter | Chennai | Tamil Nadu | 10 | 1 |
| Hosur Chapter | Hosur | Tamil Nadu | 10 | 2 |
| Coimbatore Chapter | Coimbatore | Tamil Nadu | 10 | 2 |
| Trichy Chapter | Tiruchirappalli | Tamil Nadu | 10 | 2 |
| Madurai Chapter | Madurai | Tamil Nadu | 10 | 2 |
| Mysuru Chapter | Mysuru | Karnataka | 10 | 2 |
| Bengaluru Central Chapter | Bengaluru | Karnataka | 10 | 2 |
| Bengaluru South Chapter | Bengaluru | Karnataka | 10 | 2 |
| Hyderabad Central Chapter | Hyderabad | Telangana | 10 | 2 |
| Hyderabad West Chapter | Hyderabad | Telangana | 10 | 2 |
| Mumbai Central Chapter | Mumbai | Maharashtra | 10 | 2 |

## Login credentials

All R17 deployment-test Member accounts use the preview password:

`Sethu@123456`

The login page lists these accounts and now displays each account's Chapter to make switching test personas easier.

| Account ID | Email | Chapter | Business Specialisation |
| --- | --- | --- | --- |
| `test-chennai-central-01` | `test-chennai-central-01@sethu.local` | Chennai Central Chapter | CNC Machining & Turned Components |
| `test-chennai-central-02` | `test-chennai-central-02@sethu.local` | Chennai Central Chapter | Sheet Metal, Laser Cutting & Fabrication |
| `test-chennai-south-01` | `test-chennai-south-01@sethu.local` | Chennai South Chapter | Aluminium Die Casting |
| `test-chennai-south-02` | `test-chennai-south-02@sethu.local` | Chennai South Chapter | Rubber Moulding, Seals & Hoses |
| `test-chennai-west-01` | `test-chennai-west-01@sethu.local` | Chennai West Chapter | Industrial Solar & Energy Efficiency |
| `test-hosur-01` | `test-hosur-01@sethu.local` | Hosur Chapter | GST, Taxation, Audit & Corporate Compliance |
| `test-hosur-02` | `test-hosur-02@sethu.local` | Hosur Chapter | HR, Recruitment & Industrial Skilling |
| `test-coimbatore-01` | `test-coimbatore-01@sethu.local` | Coimbatore Chapter | Injection Moulding & Plastic Components |
| `test-coimbatore-02` | `test-coimbatore-02@sethu.local` | Coimbatore Chapter | Industrial Control Panels & Automation |
| `test-trichy-01` | `test-trichy-01@sethu.local` | Trichy Chapter | 3PL, Warehousing & Industrial Logistics |
| `test-trichy-02` | `test-trichy-02@sethu.local` | Trichy Chapter | ERP, MES, QMS & Digital Transformation |
| `test-madurai-01` | `test-madurai-01@sethu.local` | Madurai Chapter | Precision Aerospace Components |
| `test-madurai-02` | `test-madurai-02@sethu.local` | Madurai Chapter | Press Tools, Moulds, Jigs & Fixtures |
| `test-mysuru-01` | `test-mysuru-01@sethu.local` | Mysuru Chapter | Industrial Catering & Corporate Food Services |
| `test-mysuru-02` | `test-mysuru-02@sethu.local` | Mysuru Chapter | CNC Machining & Turned Components |
| `test-bengaluru-central-01` | `test-bengaluru-central-01@sethu.local` | Bengaluru Central Chapter | EV & Automotive Sub-Assemblies |
| `test-bengaluru-central-02` | `test-bengaluru-central-02@sethu.local` | Bengaluru Central Chapter | Aluminium Die Casting |
| `test-bengaluru-south-01` | `test-bengaluru-south-01@sethu.local` | Bengaluru South Chapter | Working Capital, Machinery Finance & Advisory |
| `test-bengaluru-south-02` | `test-bengaluru-south-02@sethu.local` | Bengaluru South Chapter | Industrial Solar & Energy Efficiency |
| `test-hyderabad-central-01` | `test-hyderabad-central-01@sethu.local` | Hyderabad Central Chapter | Fire Safety, PPE & EHS Services |
| `test-hyderabad-central-02` | `test-hyderabad-central-02@sethu.local` | Hyderabad Central Chapter | GST, Taxation, Audit & Corporate Compliance |
| `test-hyderabad-west-01` | `test-hyderabad-west-01@sethu.local` | Hyderabad West Chapter | Sheet Metal, Laser Cutting & Fabrication |
| `test-hyderabad-west-02` | `test-hyderabad-west-02@sethu.local` | Hyderabad West Chapter | Injection Moulding & Plastic Components |
| `test-mumbai-central-01` | `test-mumbai-central-01@sethu.local` | Mumbai Central Chapter | Rubber Moulding, Seals & Hoses |
| `test-mumbai-central-02` | `test-mumbai-central-02@sethu.local` | Mumbai Central Chapter | 3PL, Warehousing & Industrial Logistics |

The complete machine-readable matrix is available in `SETHU_V7_1_R17_MEMBER_LOGIN_MATRIX.csv`.

## Recommended test journeys

1. Sign in with two Chennai members from different Chennai Chapters and verify `FOR YOU`, `YOUR CHAPTER`, and `YOUR NETWORK` scopes differ correctly.
2. Sign in as Chennai Central and Chennai South members and test Member Detail → Business → Converse → One-to-One → Note.
3. Sign in with Hosur, Coimbatore, Trichy and Madurai personas and validate same-State/cross-City discovery.
4. Sign in with Mysuru/Bengaluru personas and validate cross-State relationships into Tamil Nadu.
5. Sign in with Hyderabad Central/West personas and validate same-City/different-Chapter behaviour.
6. Sign in with Mumbai and Chennai personas and validate network-level discovery and privacy-safe relationship summaries.
7. Search Directory using Sector, Segment and Specialisation language such as `ERP`, `CNC`, `industrial catering`, `GST`, `solar`, `3PL`, `fire safety`, and verify governed taxonomy matching.
8. For every persona, open **My Business** and verify only one current Business exists and no second-current-Business action is offered.

## Data policy

All added names, Businesses, contact details, Opportunities and commercial values are synthetic QA fixtures. They must not be treated as real Member records or production commercial data.
