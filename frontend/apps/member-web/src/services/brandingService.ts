import { useState, useEffect } from 'react';

export interface SystemBranding {
  sidebarLogo: string | null;
  headerLogo: string | null;
  sethuSize?: number | null;
  headerLogoSize?: number | null;
  updatedAt?: string | null;
}

export interface ChapterBranding {
  id?: string;
  name: string;
  image?: string | null;
  logo?: string | null;
}

const SYSTEM_BRANDING_KEY = 'sethu:system-branding';
const CHAPTER_BRANDING_KEY = 'sethu:chapter-branding';
const BRANDING_EVENT = 'sethu:branding:changed';
const BROADCAST_CHANNEL_NAME = 'sethu:branding:channel';

export const DEFAULT_BRANDING = {
  sidebarLogo: '/brand/sethu-logo.jpeg',
  headerLogo: '/brand/dbn-logo.jpeg',
  chapterLogo: '/brand/Chapter-logo.jpeg',
  sethuSize: 36,
  headerLogoSize: 42,
};

function readLocalStorage<T>(key: string, defaultValue: T): T {
  try {
    if (typeof localStorage === 'undefined') return defaultValue;
    const raw = localStorage.getItem(key);
    if (!raw) return defaultValue;
    return JSON.parse(raw) as T;
  } catch {
    return defaultValue;
  }
}

function writeLocalStorage<T>(key: string, value: T): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn(`Failed to write to localStorage for key ${key}:`, e);
  }
}

// Cross-tab broadcast channel
let bc: BroadcastChannel | null = null;
try {
  if (typeof BroadcastChannel !== 'undefined') {
    bc = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
    bc.onmessage = (event) => {
      if (event.data?.type === 'BRANDING_SYNC') {
        notifyBrandingChange(false);
      }
    };
  }
} catch {
  // BroadcastChannel unavailable in this runtime
}

function notifyBrandingChange(broadcast = true): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(BRANDING_EVENT));
  }
  if (broadcast && bc) {
    try {
      bc.postMessage({ type: 'BRANDING_SYNC', timestamp: Date.now() });
    } catch { }
  }
}

function getCandidateUrls(endpointPath: string): string[] {
  const list: string[] = [];
  const cleanPath = endpointPath.startsWith('/') ? endpointPath : `/${endpointPath}`;

  const isBrowser = typeof window !== 'undefined';
  const hostname = isBrowser ? window.location.hostname.toLowerCase() : '';
  const isLocalhost = ['localhost', '127.0.0.1', '[::1]'].includes(hostname);

  const rawEnv = (typeof import.meta !== 'undefined' && import.meta.env ? (import.meta.env as Record<string, string | undefined>) : {});
  const envBase = (
    rawEnv.VITE_BACKEND_URL ||
    rawEnv.VITE_API_BASE_URL ||
    rawEnv.VITE_PLATFORM_ADMIN_API_BASE ||
    ''
  ).trim().replace(/\/+$/, '');
  const prodBase = 'https://sethudbnapi.dharmicbusines.com';

  if (!isLocalhost && isBrowser) {
    // Production/remote environment:
    // 1. Direct configured API endpoint or production cloud API
    if (envBase && !envBase.includes('localhost')) {
      const envUrl = `${envBase}${cleanPath}`;
      if (!list.includes(envUrl)) list.push(envUrl);
    }
    const prodUrl = `${prodBase}${cleanPath}`;
    if (!list.includes(prodUrl)) list.push(prodUrl);

    // 2. Local relative proxy path fallback
    if (!list.includes(cleanPath)) list.push(cleanPath);
  } else {
    // Local development environment:
    // 1. Local relative proxy path
    list.push(cleanPath);

    // 2. Direct HTTP localhost
    const httpLocal = `http://localhost:62936${cleanPath}`;
    if (!list.includes(httpLocal)) list.push(httpLocal);

    // 3. Direct HTTPS localhost
    const httpsLocal = `https://localhost:62935${cleanPath}`;
    if (!list.includes(httpsLocal)) list.push(httpsLocal);

    if (envBase) {
      const envUrl = `${envBase}${cleanPath}`;
      if (!list.includes(envUrl)) list.push(envUrl);
    }

    const prodUrl = `${prodBase}${cleanPath}`;
    if (!list.includes(prodUrl)) list.push(prodUrl);
  }

  return list;
}

// In-flight request deduplication & caching state
let inFlightSystemSync: Promise<SystemBranding> | null = null;
let lastSystemSyncTime = 0;
const SYSTEM_SYNC_TTL_MS = 60 * 1000; // 60s cache TTL

let inFlightChapterSync: Promise<Record<string, ChapterBranding>> | null = null;
let lastChapterSyncTime = 0;
const CHAPTER_SYNC_TTL_MS = 60 * 1000; // 60s cache TTL

export const brandingService = {
  // 1. System Branding
  getSystemBranding(): SystemBranding {
    return readLocalStorage<SystemBranding>(SYSTEM_BRANDING_KEY, {
      sidebarLogo: null,
      headerLogo: null,
      sethuSize: DEFAULT_BRANDING.sethuSize,
      headerLogoSize: DEFAULT_BRANDING.headerLogoSize,
    });
  },

  async syncSystemBrandingFromBackend(force = false): Promise<SystemBranding> {
    const now = Date.now();
    if (!force && inFlightSystemSync) {
      return inFlightSystemSync;
    }
    if (!force && now - lastSystemSyncTime < SYSTEM_SYNC_TTL_MS) {
      return this.getSystemBranding();
    }

    inFlightSystemSync = (async () => {
      try {
        const urls = getCandidateUrls('/api/system-settings/branding');

        for (const url of urls) {
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 4000);
            const res = await fetch(url, {
              headers: { Accept: 'application/json' },
              signal: controller.signal,
            });
            clearTimeout(timeoutId);

            if (res.ok) {
              const contentType = res.headers.get('content-type') || '';
              if (!contentType.includes('application/json')) {
                continue;
              }
              const data = await res.json();
              if (data && typeof data === 'object') {
                const current = this.getSystemBranding();
                const rawSidebar = data.sidebarLogo !== undefined ? data.sidebarLogo : data.SidebarLogo;
                const rawHeader = data.headerLogo !== undefined ? data.headerLogo : data.HeaderLogo;
                const rawSethuSize = typeof data.sethuSize === 'number' ? data.sethuSize : (typeof data.SethuSize === 'number' ? data.SethuSize : undefined);
                const rawHeaderLogoSize = typeof data.headerLogoSize === 'number' ? data.headerLogoSize : (typeof data.HeaderLogoSize === 'number' ? data.HeaderLogoSize : undefined);

                const next: SystemBranding = {
                  sidebarLogo: rawSidebar === '__RESET__' ? null : (rawSidebar !== undefined ? rawSidebar : current.sidebarLogo),
                  headerLogo: rawHeader === '__RESET__' ? null : (rawHeader !== undefined ? rawHeader : current.headerLogo),
                  sethuSize: (typeof rawSethuSize === 'number' && rawSethuSize > 0) ? rawSethuSize : current.sethuSize,
                  headerLogoSize: (typeof rawHeaderLogoSize === 'number' && rawHeaderLogoSize > 0) ? rawHeaderLogoSize : current.headerLogoSize,
                  updatedAt: data.updatedAt ?? data.UpdatedAt ?? current.updatedAt,
                };

                const hasChanged =
                  current.sidebarLogo !== next.sidebarLogo ||
                  current.headerLogo !== next.headerLogo ||
                  current.sethuSize !== next.sethuSize ||
                  current.headerLogoSize !== next.headerLogoSize;

                if (hasChanged) {
                  writeLocalStorage(SYSTEM_BRANDING_KEY, next);
                  notifyBrandingChange(false);
                }
                lastSystemSyncTime = Date.now();
                return next;
              }
            }
          } catch {
            // Try next candidate URL
          }
        }
      } finally {
        inFlightSystemSync = null;
      }

      lastSystemSyncTime = Date.now();
      return this.getSystemBranding();
    })();

    return inFlightSystemSync;
  },

  async saveSystemBranding(branding: Partial<SystemBranding>): Promise<SystemBranding> {
    const current = this.getSystemBranding();
    const updated: SystemBranding = {
      sidebarLogo: branding.sidebarLogo !== undefined ? branding.sidebarLogo : current.sidebarLogo,
      headerLogo: branding.headerLogo !== undefined ? branding.headerLogo : current.headerLogo,
      sethuSize: branding.sethuSize !== undefined ? branding.sethuSize : (current.sethuSize ?? DEFAULT_BRANDING.sethuSize),
      headerLogoSize: branding.headerLogoSize !== undefined ? branding.headerLogoSize : (current.headerLogoSize ?? DEFAULT_BRANDING.headerLogoSize),
      updatedAt: new Date().toISOString(),
    };

    lastSystemSyncTime = 0; // invalidate cache

    // Save locally first for instant reactive update across components
    writeLocalStorage(SYSTEM_BRANDING_KEY, updated);
    notifyBrandingChange(true);

    // Persist to backend database API
    const urls = getCandidateUrls('/api/system-settings/branding');
    const payload = {
      sidebarLogo: branding.sidebarLogo === null ? '__RESET__' : (branding.sidebarLogo !== undefined ? branding.sidebarLogo : current.sidebarLogo),
      headerLogo: branding.headerLogo === null ? '__RESET__' : (branding.headerLogo !== undefined ? branding.headerLogo : current.headerLogo),
      sethuSize: branding.sethuSize !== undefined ? branding.sethuSize : (current.sethuSize ?? DEFAULT_BRANDING.sethuSize),
      headerLogoSize: branding.headerLogoSize !== undefined ? branding.headerLogoSize : (current.headerLogoSize ?? DEFAULT_BRANDING.headerLogoSize),
    };

    for (const url of urls) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        if (res.ok) {
          const resData = await res.json().catch(() => null);
          if (resData) {
            updated.updatedAt = resData.updatedAt || updated.updatedAt;
            writeLocalStorage(SYSTEM_BRANDING_KEY, updated);
          }
          break; // Saved successfully to authoritative endpoint
        }
      } catch (err) {
        console.warn(`Failed persisting branding to ${url}:`, err);
      }
    }

    return updated;
  },

  async resetSystemBranding(): Promise<void> {
    const empty: SystemBranding = {
      sidebarLogo: null,
      headerLogo: null,
      sethuSize: DEFAULT_BRANDING.sethuSize,
      headerLogoSize: DEFAULT_BRANDING.headerLogoSize,
      updatedAt: new Date().toISOString(),
    };
    lastSystemSyncTime = 0; // invalidate cache
    writeLocalStorage(SYSTEM_BRANDING_KEY, empty);
    notifyBrandingChange(true);

    const urls = getCandidateUrls('/api/system-settings/branding');
    for (const url of urls) {
      try {
        await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sidebarLogo: '__RESET__',
            headerLogo: '__RESET__',
            sethuSize: DEFAULT_BRANDING.sethuSize,
            headerLogoSize: DEFAULT_BRANDING.headerLogoSize,
          }),
        });
        break;
      } catch { }
    }
  },

  // 2. Chapter Branding
  getAllChapterBranding(): Record<string, ChapterBranding> {
    return readLocalStorage<Record<string, ChapterBranding>>(CHAPTER_BRANDING_KEY, {});
  },

  async syncChaptersFromBackend(force = false): Promise<Record<string, ChapterBranding>> {
    const now = Date.now();
    if (!force && inFlightChapterSync) {
      return inFlightChapterSync;
    }
    if (!force && now - lastChapterSyncTime < CHAPTER_SYNC_TTL_MS) {
      return this.getAllChapterBranding();
    }

    inFlightChapterSync = (async () => {
      try {
        const urls = getCandidateUrls('/api/chapters?all=true');
        for (const url of urls) {
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 4000);
            const res = await fetch(url, {
              headers: { Accept: 'application/json' },
              signal: controller.signal,
            });
            clearTimeout(timeoutId);

            if (res.ok) {
              const contentType = res.headers.get('content-type') || '';
              if (!contentType.includes('application/json')) {
                continue;
              }
              const list = await res.json();
              if (Array.isArray(list)) {
                const all = this.getAllChapterBranding();
                let changed = false;
                for (const ch of list) {
                  const img = ch.image || ch.logo;
                  const logo = ch.logo || ch.image;
                  if (img || logo) {
                    const chapterData: ChapterBranding = {
                      id: ch.id,
                      name: ch.name || '',
                      image: img,
                      logo: logo,
                    };
                    if (ch.id) all[ch.id.toLowerCase()] = chapterData;
                    if (ch.name) {
                      const cleanName = ch.name.trim().toLowerCase();
                      all[cleanName] = chapterData;
                      const stripped = cleanName.replace(/\b(chapter|parivar)\b/gi, '').trim();
                      if (stripped && stripped !== cleanName) {
                        all[stripped] = chapterData;
                      }
                    }
                    changed = true;
                  }
                }
                if (changed) {
                  writeLocalStorage(CHAPTER_BRANDING_KEY, all);
                  notifyBrandingChange(false);
                }
                lastChapterSyncTime = Date.now();
                return all;
              }
            }
          } catch {
            // Try next candidate
          }
        }
      } finally {
        inFlightChapterSync = null;
      }

      lastChapterSyncTime = Date.now();
      return this.getAllChapterBranding();
    })();

    return inFlightChapterSync;
  },

  getChapterBranding(chapterIdentifier?: string | null): ChapterBranding | null {
    if (!chapterIdentifier) return null;
    const all = this.getAllChapterBranding();
    const rawKey = chapterIdentifier.trim().toLowerCase();

    // 1. Direct match on key, id, or name
    if (all[rawKey]) return all[rawKey];
    for (const item of Object.values(all)) {
      if (
        (item.id && item.id.toLowerCase() === rawKey) ||
        (item.name && item.name.toLowerCase() === rawKey)
      ) {
        return item;
      }
    }

    // 2. Normalized match (without 'chapter', 'parivar')
    const strippedKey = rawKey.replace(/\b(chapter|parivar)\b/gi, '').trim();
    if (strippedKey && all[strippedKey]) return all[strippedKey];

    // 3. Substring match
    for (const item of Object.values(all)) {
      const itemName = (item.name || '').toLowerCase();
      const itemStripped = itemName.replace(/\b(chapter|parivar)\b/gi, '').trim();
      if (
        (strippedKey && itemStripped && (strippedKey.includes(itemStripped) || itemStripped.includes(strippedKey))) ||
        (strippedKey && itemName.includes(strippedKey)) ||
        (itemStripped && rawKey.includes(itemStripped))
      ) {
        return item;
      }
    }

    return null;
  },

  saveChapterBranding(branding: {
    chapterId?: string;
    name: string;
    image?: string | null;
    logo?: string | null;
  }): ChapterBranding {
    const all = this.getAllChapterBranding();
    const normalizedName = branding.name.trim().toLowerCase();
    const strippedName = normalizedName.replace(/\b(chapter|parivar)\b/gi, '').trim();
    const chapterData: ChapterBranding = {
      id: branding.chapterId,
      name: branding.name.trim(),
      image: branding.image ?? branding.logo ?? null,
      logo: branding.logo ?? branding.image ?? null,
    };

    all[normalizedName] = chapterData;
    if (strippedName && strippedName !== normalizedName) {
      all[strippedName] = chapterData;
    }
    if (branding.chapterId) {
      all[branding.chapterId.toLowerCase()] = chapterData;
    }

    writeLocalStorage(CHAPTER_BRANDING_KEY, all);
    notifyBrandingChange(true);
    lastChapterSyncTime = 0; // invalidate cache
    return chapterData;
  },
};

// React Hook to subscribe to System Branding updates
export function useSystemBranding(): SystemBranding {
  const [branding, setBranding] = useState<SystemBranding>(() => brandingService.getSystemBranding());

  useEffect(() => {
    // Initial fetch from backend database (deduplicated & cached with 60s TTL)
    brandingService.syncSystemBrandingFromBackend().then(setBranding).catch(() => { });

    const handler = () => {
      setBranding(brandingService.getSystemBranding());
    };

    // Re-fetch when tab is focused to ensure fresh cross-app synchronization
    const onFocus = () => {
      brandingService.syncSystemBrandingFromBackend().then(setBranding).catch(() => { });
    };

    window.addEventListener(BRANDING_EVENT, handler);
    window.addEventListener('storage', handler);
    window.addEventListener('focus', onFocus);
    return () => {
      window.removeEventListener(BRANDING_EVENT, handler);
      window.removeEventListener('storage', handler);
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  return branding;
}

// React Hook to subscribe to Chapter Branding updates
export function useChapterBranding(chapterIdentifier?: string | null): ChapterBranding | null {
  const [branding, setBranding] = useState<ChapterBranding | null>(() =>
    brandingService.getChapterBranding(chapterIdentifier)
  );

  useEffect(() => {
    const local = brandingService.getChapterBranding(chapterIdentifier);
    if (local) setBranding(local);

    // Active sync from backend to get fresh database branding (deduplicated & cached with 60s TTL)
    brandingService.syncChaptersFromBackend().then(() => {
      setBranding(brandingService.getChapterBranding(chapterIdentifier));
    }).catch(() => { });

    const handler = () => {
      setBranding(brandingService.getChapterBranding(chapterIdentifier));
    };

    window.addEventListener(BRANDING_EVENT, handler);
    window.addEventListener('storage', handler);
    return () => {
      window.removeEventListener(BRANDING_EVENT, handler);
      window.removeEventListener('storage', handler);
    };
  }, [chapterIdentifier]);

  return branding;
}
