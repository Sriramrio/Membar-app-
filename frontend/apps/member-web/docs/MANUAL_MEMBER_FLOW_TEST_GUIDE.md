# SETHU — Member End-to-End Flow & Navigation Manual Testing Guide

This document provides a comprehensive step-by-step test script for testing the complete Member experience from start to finish.

---

## 🔑 Test Account Credentials

| Parameter | Value |
| :--- | :--- |
| **Login URL** | `http://localhost:5173/login` |
| **Email** | `member@sethu.local` *(or select from the "👥 Members" tab)* |
| **Password** | `Sethu@123456` |
| **Member Name** | Anand Kumar |
| **Chapter** | Hosur Chapter |
| **Landing Page** | `http://localhost:5173/app/dashboard` |

---

## 🧭 Step-by-Step Navigation & Testing Flow

```
[Start] Login (/login)
   │
   ▼
[Step 1] My Dashboard (/app/dashboard)
   │
   ▼
[Step 2] Member & Business Directory (/app/directory)
   │  ├── Click Member Card ──▶ [Step 3] Member Profile (/app/members/:id) ──▶ Back to Directory
   │  └── Click Business Card ──▶ Business Profile (/app/businesses/:id)
   ▼
[Step 4] My Network: Connections (/app/connections)
   │
   ▼
[Step 5] Converse Messaging (/app/messages)
   │
   ▼
[Step 6] One-to-One Meetings (/app/one-to-one) ──▶ Schedule 1-to-1 Modal
   │
   ▼
[Step 7] References & Referrals (/app/references) ──▶ [Step 7A] Give Referral (/app/references/new)
   │
   ▼
[Step 8] Opportunities Marketplace (/app/opportunities) ──▶ [Step 8A] Post Opportunity (/app/opportunities/new)
   │
   ▼
[Step 9] Community & Events (/app/events) ──▶ Calendar (/app/calendar) ──▶ Announcements (/app/announcements)
   │
   ▼
[Step 10] My Profile & Settings (/app/profile) ──▶ Privacy (/app/settings/privacy)
   │
   ▼
[End] Sign Out ──▶ Redirect to /login
```

---

### Step 1: Login
- **URL**: `http://localhost:5173/login`
- **Action**: Click "👥 Members" tab -> click `member@sethu.local` -> Click **Sign in**.
- **Result**: Immediate routing to `/app/dashboard`.

### Step 2: Dashboard
- **URL**: `/app/dashboard`
- **Action**: Review KPI stats (Attendance, Referrals, Business Volume) and quick action shortcuts.
- **Next**: Click **Directory** in sidebar under *Discover*.

### Step 3: Directory
- **URL**: `/app/directory`
- **Action**:
  1. Test search bar (type "Kumar" or "Hosur").
  2. Toggle between **Members** and **Businesses** tabs.
  3. Test numbered pagination (`1, 2, 3…`).
  4. Click any Member card to open Member Details (`/app/members/:id`).
  5. On Member Details page, verify "Schedule 1-to-1", "Send Message", and click **"← Back to Directory"**.

### Step 4: Connections
- **URL**: `/app/connections`
- **Action**: Verify **Connected**, **Pending**, and **Received** tabs. Test connection cards.

### Step 5: Converse (Messages)
- **URL**: `/app/messages`
- **Action**: View conversation threads and test message composition.

### Step 6: 1-to-1 Meetings
- **URL**: `/app/one-to-one`
- **Action**: Click **"Schedule 1-to-1"**, choose member and date/time.

### Step 7: References (Referrals)
- **URL**: `/app/references`
- **Action**: Click **"+ Give Referral"** (`/app/references/new`), fill recipient and notes, and submit.

### Step 8: Opportunities
- **URL**: `/app/opportunities`
- **Action**:
  1. Browse market requirements.
  2. Click **"+ Post Opportunity"** (`/app/opportunities/new`), fill title, description, category, and submit.
  3. Check `/app/opportunities/my` to view your posted requirement.

### Step 9: Events & Calendar
- **URL**: `/app/events` & `/app/calendar`
- **Action**: Review chapter meeting schedules and test RSVP buttons.

### Step 10: Profile & Account Settings
- **URL**: `/app/profile`
- **Action**: View completeness score, edit bio/expertise, and open Privacy Settings (`/app/settings/privacy`).

### Step 11: Sign Out
- **Action**: Click Header avatar -> **Sign out**.
- **Result**: Session cleared, redirects back to `/login`.

---

## ⚡ Sidebar Performance Fixes Summary

1. **Eliminated Click Hanging**: Clicking the currently active route is safely ignored, preventing infinite re-dispatch loops.
2. **Instant Navigation**: Removed blocking `e.preventDefault()`, allowing React Router native pushState to navigate immediately.
3. **Hover Prefetching**: When cursor hovers over any sidebar item, the page module is preloaded in the background. When clicked, it loads in **0 milliseconds**.
4. **Desktop Drawer Cleanup**: Prevented unnecessary drawer close calls on desktop that caused body overflow thrashing and re-renders.
5. **Memoized Permission Groups**: Wrapped sidebar group generation in `useMemo` so role-based checks don't execute repeatedly on mouse movement or state changes.
