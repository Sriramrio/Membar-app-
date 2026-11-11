// Centralized auth storage for organisation-web.
// Strictly uses sessionStorage so that:
// 1. Each browser tab is 100% isolated (Tab 1 = Coimbatore, Tab 2 = Chennai).
// 2. A brand-new tab or new visitor starts with NO session and is forced to the login page.
// 3. Refreshing a tab retains ONLY that specific tab's session.

export const AUTH_KEYS = {
  ACTIVE_SESSION: 'dbn_active_session',
  TOKEN: 'sethu_token',
  ACCESS_TOKEN: 'access_token',
  SELECTED_CHAPTER_ID: 'selected_chapter_id',
  SELECTED_CHAPTER_NAME: 'selected_chapter_name',
  CHAPTER_ASSIGNMENTS: 'sethu_chapter_assignments',
} as const;

// Clean up any legacy shared localStorage keys on startup so they don't leak across tabs
if (typeof window !== 'undefined') {
  try {
    localStorage.removeItem(AUTH_KEYS.ACTIVE_SESSION);
    localStorage.removeItem(AUTH_KEYS.TOKEN);
    localStorage.removeItem(AUTH_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(AUTH_KEYS.SELECTED_CHAPTER_ID);
    localStorage.removeItem(AUTH_KEYS.SELECTED_CHAPTER_NAME);
  } catch {
    // ignore
  }
}

export const authStorage = {
  getItem(key: string): string | null {
    if (typeof window === 'undefined') return null;
    try {
      // Strictly sessionStorage for tab-level isolation
      const sessionVal = sessionStorage.getItem(key);
      if (sessionVal !== null) return sessionVal;

      // Only non-session metadata like chapter assignments can fall back to localStorage
      if (key === AUTH_KEYS.CHAPTER_ASSIGNMENTS) {
        return localStorage.getItem(key);
      }
      return null;
    } catch {
      return null;
    }
  },

  setItem(key: string, value: string): void {
    if (typeof window === 'undefined') return;
    try {
      sessionStorage.setItem(key, value);
      if (key === AUTH_KEYS.CHAPTER_ASSIGNMENTS) {
        localStorage.setItem(key, value);
      }
    } catch {
      // ignore
    }
  },

  removeItem(key: string): void {
    if (typeof window === 'undefined') return;
    try {
      sessionStorage.removeItem(key);
      localStorage.removeItem(key);
    } catch {
      // ignore
    }
  },

  getActiveSession(): any {
    const raw = this.getItem(AUTH_KEYS.ACTIVE_SESSION);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  setActiveSession(data: any): void {
    const val = typeof data === 'string' ? data : JSON.stringify(data);
    this.setItem(AUTH_KEYS.ACTIVE_SESSION, val);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('dbn_auth_changed', { detail: { action: 'LOGIN', session: data } }));
    }
  },

  getToken(): string | null {
    return this.getItem(AUTH_KEYS.TOKEN) || this.getItem(AUTH_KEYS.ACCESS_TOKEN);
  },

  setToken(token: string): void {
    this.setItem(AUTH_KEYS.TOKEN, token);
    this.setItem(AUTH_KEYS.ACCESS_TOKEN, token);
  },

  isLeadershipTeam(): boolean {
    const s = this.getActiveSession();
    if (!s) return false;
    const pos = (s.position || s.role || s.roleType || '').toLowerCase();
    return pos.includes('leadership team') || pos === 'leadership_team' || s.roleType === 'LEADERSHIP_TEAM';
  },

  isTrustUser(): boolean {
    const s = this.getActiveSession();
    if (!s) return false;
    if (this.isLeadershipTeam() || this.isLeadershipFinance()) return false;
    return s.position === 'Trust' || s.position === 'Trustee' || s.role === 'Trust' || s.role === 'Trustee' || s.roleType === 'TRUST_ADMINISTRATOR';
  },

  isTreasurer(): boolean {
    const s = this.getActiveSession();
    if (!s) return false;
    const pos = (s.position || s.role || s.roleType || '').toLowerCase();
    return pos.includes('treasurer') || pos.includes('trusser');
  },

  isLeadershipFinance(): boolean {
    const s = this.getActiveSession();
    if (!s) return false;
    const pos = (s.position || s.role || s.roleType || '').toLowerCase();
    return pos.includes('leadership finance') || pos === 'leadership_finance';
  },

  isMemberCoordinator(): boolean {
    const s = this.getActiveSession();
    if (!s) return false;
    const pos = (s.position || s.role || s.roleType || '').toLowerCase();
    return pos.includes('member coordinator') || pos === 'member_coordinator' || pos === 'coordinator';
  },

  isChapterLeader(): boolean {
    const s = this.getActiveSession();
    if (!s) return false;
    if (this.isTrustUser() || this.isLeadershipTeam() || this.isLeadershipFinance()) return false;
    const pos = (s.position || s.role || s.roleType || '').toLowerCase();
    return pos.includes('president') || pos.includes('secretary') || pos.includes('treasurer') || pos.includes('trusser') || pos.includes('coordinator') || pos.includes('leader') || pos.includes('vice');
  },

  clearAll(): void {
    this.removeItem(AUTH_KEYS.ACTIVE_SESSION);
    this.removeItem(AUTH_KEYS.TOKEN);
    this.removeItem(AUTH_KEYS.ACCESS_TOKEN);
    this.removeItem(AUTH_KEYS.SELECTED_CHAPTER_ID);
    this.removeItem(AUTH_KEYS.SELECTED_CHAPTER_NAME);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('dbn_auth_changed', { detail: { action: 'LOGOUT' } }));
    }
  }
};
