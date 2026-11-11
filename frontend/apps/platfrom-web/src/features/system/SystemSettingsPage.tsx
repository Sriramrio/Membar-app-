import { useState } from 'react';
import { PageHeader, Card, Pill } from '@/components/Ui';
import { LucideIcon } from '@/components/LucideIcon';
import { fileToWebpBase64 } from '@/utils/imageToWebp';
import {
  brandingService,
  useSystemBranding,
  DEFAULT_BRANDING,
} from '@/services/brandingService';

export function SystemSettingsPage() {
  const branding = useSystemBranding();

  const [sidebarLogoDraft, setSidebarLogoDraft] = useState<string | null>(null);
  const [headerLogoDraft, setHeaderLogoDraft] = useState<string | null>(null);
  const [sethuSizeDraft, setSethuSizeDraft] = useState<number | null>(null);
  const [headerLogoSizeDraft, setHeaderLogoSizeDraft] = useState<number | null>(null);

  const [processingSidebar, setProcessingSidebar] = useState(false);
  const [processingHeader, setProcessingHeader] = useState(false);
  const [savingSidebar, setSavingSidebar] = useState(false);
  const [savingHeader, setSavingHeader] = useState(false);
  const [savingSethuSize, setSavingSethuSize] = useState(false);
  const [savingHeaderSize, setSavingHeaderSize] = useState(false);
  const [notice, setNotice] = useState<{ msg: string; tone: 'good' | 'bad' | 'warn' } | null>(null);

  const notify = (msg: string, tone: 'good' | 'bad' | 'warn' = 'good') => {
    setNotice({ msg, tone });
    setTimeout(() => setNotice(null), 5000);
  };

  // Sethu Logo Size calculation
  const currentSavedSethuSize = branding.sethuSize ?? DEFAULT_BRANDING.sethuSize;
  const activeSethuSize = sethuSizeDraft ?? currentSavedSethuSize;
  const isSethuSizeModified = sethuSizeDraft !== null && sethuSizeDraft !== currentSavedSethuSize;

  // Header Logo Size calculation
  const currentSavedHeaderSize = branding.headerLogoSize ?? DEFAULT_BRANDING.headerLogoSize;
  const activeHeaderSize = headerLogoSizeDraft ?? currentSavedHeaderSize;
  const isHeaderSizeModified = headerLogoSizeDraft !== null && headerLogoSizeDraft !== currentSavedHeaderSize;

  // Upload handler for Sidebar Logo
  const handleSidebarLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setProcessingSidebar(true);
      const webp = await fileToWebpBase64(file, { maxWidth: 400, maxHeight: 400, quality: 0.85 });
      setSidebarLogoDraft(webp);
      notify('Sidebar Sethu logo converted to Base64 WebP! Click "Save to Database & Apply" to activate.', 'good');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Failed to process sidebar logo.', 'bad');
    } finally {
      setProcessingSidebar(false);
    }
  };

  // Upload handler for Header Logo
  const handleHeaderLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setProcessingHeader(true);
      const webp = await fileToWebpBase64(file, { maxWidth: 600, maxHeight: 200, quality: 0.85 });
      setHeaderLogoDraft(webp);
      notify('Navbar Dharmic logo converted to Base64 WebP! Click "Save to Database & Apply" to activate.', 'good');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Failed to process header logo.', 'bad');
    } finally {
      setProcessingHeader(false);
    }
  };

  // Save Sidebar Logo
  const handleSaveSidebarLogo = async () => {
    if (!sidebarLogoDraft) return;
    try {
      setSavingSidebar(true);
      await brandingService.saveSystemBranding({ sidebarLogo: sidebarLogoDraft });
      setSidebarLogoDraft(null);
      notify('Org Logo updated in PostgreSQL database and applied system-wide!', 'good');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Failed to save Org Logo.', 'bad');
    } finally {
      setSavingSidebar(false);
    }
  };

  // Reset Sidebar Logo to Default
  const handleResetSidebarLogo = async () => {
    try {
      setSavingSidebar(true);
      await brandingService.saveSystemBranding({ sidebarLogo: null });
      setSidebarLogoDraft(null);
      notify('Org Logo reset to default /brand/sethu-logo.jpeg in database.', 'warn');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Failed to reset Org Logo.', 'bad');
    } finally {
      setSavingSidebar(false);
    }
  };

  // Save Header Logo
  const handleSaveHeaderLogo = async () => {
    if (!headerLogoDraft) return;
    try {
      setSavingHeader(true);
      await brandingService.saveSystemBranding({ headerLogo: headerLogoDraft });
      setHeaderLogoDraft(null);
      notify('Header Logo updated in PostgreSQL database and applied system-wide!', 'good');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Failed to save Header Logo.', 'bad');
    } finally {
      setSavingHeader(false);
    }
  };

  // Reset Header Logo to Default
  const handleResetHeaderLogo = async () => {
    try {
      setSavingHeader(true);
      await brandingService.saveSystemBranding({ headerLogo: null });
      setHeaderLogoDraft(null);
      notify('Header Logo reset to default /brand/dbn-logo.jpeg in database.', 'warn');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Failed to reset Header Logo.', 'bad');
    } finally {
      setSavingHeader(false);
    }
  };

  // Save Sethu Logo Size
  const handleSaveSethuSize = async () => {
    try {
      setSavingSethuSize(true);
      await brandingService.saveSystemBranding({ sethuSize: activeSethuSize });
      setSethuSizeDraft(null);
      notify(`Org / Sethu logo size saved to Database at ${activeSethuSize}px and applied across all portals!`, 'good');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Failed to save logo size.', 'bad');
    } finally {
      setSavingSethuSize(false);
    }
  };

  // Reset Sethu Logo Size to Default (36px)
  const handleResetSethuSize = async () => {
    try {
      setSavingSethuSize(true);
      await brandingService.saveSystemBranding({ sethuSize: DEFAULT_BRANDING.sethuSize });
      setSethuSizeDraft(null);
      notify(`Org / Sethu logo size reset to default ${DEFAULT_BRANDING.sethuSize}px in database.`, 'warn');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Failed to reset logo size.', 'bad');
    } finally {
      setSavingSethuSize(false);
    }
  };

  // Save Header Logo Size
  const handleSaveHeaderSize = async () => {
    try {
      setSavingHeaderSize(true);
      await brandingService.saveSystemBranding({ headerLogoSize: activeHeaderSize });
      setHeaderLogoSizeDraft(null);
      notify(`Header logo size saved to Database at ${activeHeaderSize}px and applied across all portals!`, 'good');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Failed to save header logo size.', 'bad');
    } finally {
      setSavingHeaderSize(false);
    }
  };

  // Reset Header Logo Size to Default (42px)
  const handleResetHeaderSize = async () => {
    try {
      setSavingHeaderSize(true);
      await brandingService.saveSystemBranding({ headerLogoSize: DEFAULT_BRANDING.headerLogoSize });
      setHeaderLogoSizeDraft(null);
      notify(`Header logo size reset to default ${DEFAULT_BRANDING.headerLogoSize}px in database.`, 'warn');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Failed to reset header logo size.', 'bad');
    } finally {
      setSavingHeaderSize(false);
    }
  };

  const activeSidebarLogo = sidebarLogoDraft || branding.sidebarLogo || DEFAULT_BRANDING.sidebarLogo;
  const isCustomSidebar = Boolean(sidebarLogoDraft || branding.sidebarLogo);

  const activeHeaderLogo = headerLogoDraft || branding.headerLogo || DEFAULT_BRANDING.headerLogo;
  const isCustomHeader = Boolean(headerLogoDraft || branding.headerLogo);

  return (
    <div className="stack" style={{ gap: '20px' }}>
      <PageHeader
        title="System Settings & Brand Management"
        description="Configure enterprise platform logos, dimensions, and visual identity. Changes are converted to Base64 WebP format, persisted to PostgreSQL database, and immediately reflected across Member Web, Organisation Web, and Platform Admin."
      />

      {notice && (
        <div
          className={`notice ${notice.tone === 'good' ? 'success' : notice.tone === 'bad' ? 'error' : 'warn'}`}
          style={{
            padding: '12px 16px',
            borderRadius: '8px',
            background: notice.tone === 'good' ? '#ecfdf5' : notice.tone === 'bad' ? '#fef2f2' : '#fffbeb',
            border: `1px solid ${notice.tone === 'good' ? '#a7f3d0' : notice.tone === 'bad' ? '#fecaca' : '#fde68a'}`,
            color: notice.tone === 'good' ? '#065f46' : notice.tone === 'bad' ? '#991b1b' : '#92400e',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '13px',
            fontWeight: '600'
          }}
        >
          <LucideIcon name={notice.tone === 'good' ? 'check' : 'alert-triangle'} size={18} />
          <span>{notice.msg}</span>
        </div>
      )}

      {/* TOP ROW: LOGO UPLOADS */}
      <div className="grid grid-2" style={{ gap: '24px' }}>
        {/* =========================================================
            CARD 1: SIDEBAR SETHU LOGO
           ========================================================= */}
        <section className="exec-card" style={{ padding: '24px', background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px', marginBottom: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <LucideIcon name="sliders-horizontal" size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>Org Logo (Sidebar)</h3>
                <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748b' }}>Sidebar navigation brand logo across Member, Organisation and Platform (Base64 WebP)</p>
              </div>
            </div>
            {isCustomSidebar && (
              <span style={{ fontSize: '11px', fontWeight: '700', color: '#059669', background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '2px 8px', borderRadius: '9999px' }}>
                Customized
              </span>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Live Preview Box */}
            <div>
              <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <LucideIcon name="eye" size={14} />
                <span>Org Logo Live Simulation ({activeSethuSize}px)</span>
              </div>
              <div style={{ background: '#0a1020', padding: '14px 16px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '12px', border: '1px solid #1e293b' }}>
                <img
                  src={activeSidebarLogo}
                  alt="Org Logo Preview"
                  style={{
                    width: `${activeSethuSize}px`,
                    height: `${activeSethuSize}px`,
                    borderRadius: '8px',
                    objectFit: 'contain',
                    background: '#ffffff',
                    padding: '2px',
                    flexShrink: 0,
                    transition: 'width 0.15s ease, height 0.15s ease'
                  }}
                />
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '14px', fontWeight: '900', color: '#ffffff' }}>SETHU</span>
                    <span style={{ fontSize: '9px', fontWeight: '800', color: '#fbbf24', background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.3)', padding: '1px 5px', borderRadius: '3px', textTransform: 'uppercase' }}>
                      Admin
                    </span>
                  </div>
                  <div style={{ fontSize: '10px', color: '#94a3b8' }}>Dharmic Business Network</div>
                </div>
              </div>
            </div>

            {/* Upload & Action Controls */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '9px 16px', borderRadius: '8px', background: '#2563eb', color: '#ffffff', fontSize: '13px', fontWeight: '600', cursor: 'pointer', transition: 'background 0.15s ease' }}>
                  <LucideIcon name="upload" size={15} />
                  <span>{processingSidebar ? 'Converting to WebP…' : 'Choose New Org Logo'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    disabled={processingSidebar || savingSidebar}
                    onChange={handleSidebarLogoUpload}
                    style={{ display: 'none' }}
                  />
                </label>

                {sidebarLogoDraft && (
                  <button
                    type="button"
                    onClick={handleSaveSidebarLogo}
                    disabled={savingSidebar}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '9px 16px', borderRadius: '8px', background: '#059669', color: '#ffffff', fontSize: '13px', fontWeight: '600', border: 'none', cursor: 'pointer' }}
                  >
                    <LucideIcon name="check" size={15} />
                    <span>{savingSidebar ? 'Saving…' : 'Save to Database & Apply'}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleResetSidebarLogo}
                  disabled={savingSidebar || !branding.sidebarLogo}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '9px 14px', borderRadius: '8px', background: '#f8fafc', color: '#64748b', fontSize: '13px', fontWeight: '500', border: '1px solid #cbd5e1', cursor: branding.sidebarLogo ? 'pointer' : 'not-allowed', opacity: branding.sidebarLogo ? 1 : 0.6 }}
                  title="Reset to default /brand/sethu-logo.jpeg"
                >
                  <LucideIcon name="refresh-cw" size={14} />
                  <span>Reset to Default</span>
                </button>
              </div>

              {sidebarLogoDraft && (
                <div style={{ fontSize: '12px', color: '#059669', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '500' }}>
                  <LucideIcon name="check" size={14} />
                  <span>Draft logo ready in WebP format. Click "Save to Database & Apply" to persist.</span>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* =========================================================
            CARD 2: NAVBAR DHARMIC LOGO (DBN)
           ========================================================= */}
        <section className="exec-card" style={{ padding: '24px', background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px', marginBottom: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <LucideIcon name="sliders-horizontal" size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>Header Logo</h3>
                <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748b' }}>Top header navbar right section across Member, Organisation and Platform (Base64 WebP)</p>
              </div>
            </div>
            {isCustomHeader && (
              <span style={{ fontSize: '11px', fontWeight: '700', color: '#059669', background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '2px 8px', borderRadius: '9999px' }}>
                Customized
              </span>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Live Preview Box */}
            <div>
              <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <LucideIcon name="eye" size={14} />
                <span>Header Logo Live Simulation ({activeHeaderSize}px)</span>
              </div>
              <div style={{ background: '#f8fafc', padding: '14px 16px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid #e2e8f0' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: '#047857', background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '3px 10px', borderRadius: '9999px' }}>
                  <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#10b981' }}></span>
                  Console Navbar Header
                </span>
                <img
                  src={activeHeaderLogo}
                  alt="Header Logo Preview"
                  style={{ height: `${activeHeaderSize}px`, width: 'auto', maxHeight: '72px', objectFit: 'contain', background: '#ffffff', padding: '2px', borderRadius: '6px', border: '1px solid #cbd5e1', transition: 'height 0.15s ease' }}
                />
              </div>
            </div>

            {/* Upload & Action Controls */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '9px 16px', borderRadius: '8px', background: '#d97706', color: '#ffffff', fontSize: '13px', fontWeight: '600', cursor: 'pointer', transition: 'background 0.15s ease' }}>
                  <LucideIcon name="upload" size={15} />
                  <span>{processingHeader ? 'Converting to WebP…' : 'Choose New Header Logo'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    disabled={processingHeader || savingHeader}
                    onChange={handleHeaderLogoUpload}
                    style={{ display: 'none' }}
                  />
                </label>

                {headerLogoDraft && (
                  <button
                    type="button"
                    onClick={handleSaveHeaderLogo}
                    disabled={savingHeader}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '9px 16px', borderRadius: '8px', background: '#059669', color: '#ffffff', fontSize: '13px', fontWeight: '600', border: 'none', cursor: 'pointer' }}
                  >
                    <LucideIcon name="check" size={15} />
                    <span>{savingHeader ? 'Saving…' : 'Save to Database & Apply'}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleResetHeaderLogo}
                  disabled={savingHeader || !branding.headerLogo}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '9px 14px', borderRadius: '8px', background: '#f8fafc', color: '#64748b', fontSize: '13px', fontWeight: '500', border: '1px solid #cbd5e1', cursor: branding.headerLogo ? 'pointer' : 'not-allowed', opacity: branding.headerLogo ? 1 : 0.6 }}
                  title="Reset to default /brand/dbn-logo.jpeg"
                >
                  <LucideIcon name="refresh-cw" size={14} />
                  <span>Reset to Default</span>
                </button>
              </div>

              {headerLogoDraft && (
                <div style={{ fontSize: '12px', color: '#059669', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '500' }}>
                  <LucideIcon name="check" size={14} />
                  <span>Draft logo ready in WebP format. Click "Save to Database & Apply" to persist.</span>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

      {/* =========================================================
          ROW 2: TWO DEDICATED SIZE CONTROLS CARDS
          1. Org / Sethu Logo Size Controls
          2. Header Logo Size Controls
         ========================================================= */}
      <div className="grid grid-2" style={{ gap: '24px' }}>
        {/* CARD 3: SETHU / ORG LOGO SIZE (SIDEBAR & PORTALS) */}
        <section className="exec-card" style={{ padding: '24px', background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px', marginBottom: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#f0fdf4', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <LucideIcon name="maximize-2" size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>Org Logo Size (Sidebar)</h3>
                <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748b' }}>
                  Display dimensions across Sidebar navigations and Portal login screens.
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: '800', color: '#1e293b', background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '4px 12px', borderRadius: '9999px' }}>
                {activeSethuSize} px
              </span>
              {activeSethuSize !== DEFAULT_BRANDING.sethuSize && (
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#059669', background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '2px 8px', borderRadius: '9999px' }}>
                  Customized
                </span>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* Fine Adjust Slider */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '8px' }}>
                Fine Adjust Size (20px – 72px)
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setSethuSizeDraft(Math.max(20, activeSethuSize - 2))}
                  disabled={savingSethuSize || activeSethuSize <= 20}
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    background: '#f8fafc',
                    color: '#1e293b',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: activeSethuSize > 20 ? 'pointer' : 'not-allowed',
                    transition: 'all 0.15s ease'
                  }}
                  title="Decrease size by 2px"
                >
                  <LucideIcon name="minus" size={16} />
                </button>

                <input
                  type="range"
                  min="20"
                  max="72"
                  step="1"
                  value={activeSethuSize}
                  onChange={(e) => setSethuSizeDraft(Number(e.target.value))}
                  disabled={savingSethuSize}
                  style={{ flex: 1, cursor: 'pointer', accentColor: '#2563eb' }}
                />

                <button
                  type="button"
                  onClick={() => setSethuSizeDraft(Math.min(72, activeSethuSize + 2))}
                  disabled={savingSethuSize || activeSethuSize >= 72}
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    background: '#f8fafc',
                    color: '#1e293b',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: activeSethuSize < 72 ? 'pointer' : 'not-allowed',
                    transition: 'all 0.15s ease'
                  }}
                  title="Increase size by 2px"
                >
                  <LucideIcon name="plus" size={16} />
                </button>
              </div>
            </div>

            {/* Quick Size Presets */}
            <div>
              <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', marginBottom: '8px' }}>
                Preset Scale Shortcuts
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {[
                  { label: 'Small (28px)', size: 28 },
                  { label: 'Default (36px)', size: 36 },
                  { label: 'Medium (44px)', size: 44 },
                  { label: 'Large (52px)', size: 52 },
                  { label: 'Extra Large (64px)', size: 64 },
                ].map((preset) => {
                  const isActive = activeSethuSize === preset.size;
                  return (
                    <button
                      key={preset.size}
                      type="button"
                      onClick={() => setSethuSizeDraft(preset.size)}
                      disabled={savingSethuSize}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '600',
                        border: `1px solid ${isActive ? '#2563eb' : '#e2e8f0'}`,
                        background: isActive ? '#eff6ff' : '#ffffff',
                        color: isActive ? '#1d4ed8' : '#475569',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Live Dynamic Scaling Simulation */}
            <div style={{ background: '#0a1020', padding: '16px', borderRadius: '10px', border: '1px solid #1e293b', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #1e293b', paddingBottom: '8px' }}>
                <span style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <LucideIcon name="eye" size={14} />
                  <span>Sidebar Preview</span>
                </span>
                <span style={{ fontSize: '10px', color: '#fbbf24', background: 'rgba(251,191,36,0.15)', padding: '2px 6px', borderRadius: '4px', fontWeight: '700' }}>
                  {activeSethuSize}px
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minHeight: '60px' }}>
                <img
                  src={activeSidebarLogo}
                  alt="Org Logo Scaled"
                  style={{
                    width: `${activeSethuSize}px`,
                    height: `${activeSethuSize}px`,
                    borderRadius: `${Math.max(4, Math.round(activeSethuSize * 0.2))}px`,
                    objectFit: 'contain',
                    background: '#ffffff',
                    padding: '2px',
                    flexShrink: 0,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                    transition: 'width 0.15s ease, height 0.15s ease'
                  }}
                />
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '14px', fontWeight: '900', color: '#ffffff' }}>SETHU</span>
                    <span style={{ fontSize: '9px', fontWeight: '800', color: '#38bdf8', background: 'rgba(56,189,248,0.15)', border: '1px solid rgba(56,189,248,0.3)', padding: '1px 5px', borderRadius: '3px' }}>
                      Network
                    </span>
                  </div>
                  <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>Dharmic Business Network</div>
                </div>
              </div>
            </div>

            {/* Action Buttons for Size */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                type="button"
                onClick={handleSaveSethuSize}
                disabled={savingSethuSize || (!isSethuSizeModified && activeSethuSize === (branding.sethuSize ?? DEFAULT_BRANDING.sethuSize))}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '9px 18px',
                  borderRadius: '8px',
                  background: '#059669',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: '600',
                  border: 'none',
                  cursor: (isSethuSizeModified || activeSethuSize !== (branding.sethuSize ?? DEFAULT_BRANDING.sethuSize)) ? 'pointer' : 'not-allowed',
                  opacity: (isSethuSizeModified || activeSethuSize !== (branding.sethuSize ?? DEFAULT_BRANDING.sethuSize)) ? 1 : 0.6
                }}
              >
                <LucideIcon name="check" size={15} />
                <span>{savingSethuSize ? 'Saving…' : 'Save Size to Database & Apply'}</span>
              </button>

              <button
                type="button"
                onClick={handleResetSethuSize}
                disabled={savingSethuSize || (activeSethuSize === DEFAULT_BRANDING.sethuSize && !branding.sethuSize)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '9px 14px',
                  borderRadius: '8px',
                  background: '#f8fafc',
                  color: '#64748b',
                  fontSize: '13px',
                  fontWeight: '500',
                  border: '1px solid #cbd5e1',
                  cursor: (activeSethuSize !== DEFAULT_BRANDING.sethuSize || branding.sethuSize) ? 'pointer' : 'not-allowed',
                  opacity: (activeSethuSize !== DEFAULT_BRANDING.sethuSize || branding.sethuSize) ? 1 : 0.6
                }}
                title="Reset Sethu logo size to default 36px"
              >
                <LucideIcon name="refresh-cw" size={14} />
                <span>Reset to Default (36px)</span>
              </button>
            </div>
          </div>
        </section>

        {/* CARD 4: HEADER LOGO SIZE (NAVBAR & PORTALS) */}
        <section className="exec-card" style={{ padding: '24px', background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px', marginBottom: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#fffbeb', color: '#b45309', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <LucideIcon name="maximize-2" size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>Header Logo Size Controls</h3>
                <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748b' }}>
                  Adjust top navbar brand height across Member Web, Organisation Web, and Platform Admin.
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: '800', color: '#1e293b', background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '4px 12px', borderRadius: '9999px' }}>
                {activeHeaderSize} px
              </span>
              {activeHeaderSize !== DEFAULT_BRANDING.headerLogoSize && (
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#059669', background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '2px 8px', borderRadius: '9999px' }}>
                  Customized
                </span>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* Fine Adjust Slider */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '8px' }}>
                Fine Adjust Size (24px – 80px)
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setHeaderLogoSizeDraft(Math.max(24, activeHeaderSize - 2))}
                  disabled={savingHeaderSize || activeHeaderSize <= 24}
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    background: '#f8fafc',
                    color: '#1e293b',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: activeHeaderSize > 24 ? 'pointer' : 'not-allowed',
                    transition: 'all 0.15s ease'
                  }}
                  title="Decrease size by 2px"
                >
                  <LucideIcon name="minus" size={16} />
                </button>

                <input
                  type="range"
                  min="24"
                  max="80"
                  step="2"
                  value={activeHeaderSize}
                  onChange={(e) => setHeaderLogoSizeDraft(Number(e.target.value))}
                  disabled={savingHeaderSize}
                  style={{ flex: 1, cursor: 'pointer', accentColor: '#d97706' }}
                />

                <button
                  type="button"
                  onClick={() => setHeaderLogoSizeDraft(Math.min(80, activeHeaderSize + 2))}
                  disabled={savingHeaderSize || activeHeaderSize >= 80}
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    background: '#f8fafc',
                    color: '#1e293b',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: activeHeaderSize < 80 ? 'pointer' : 'not-allowed',
                    transition: 'all 0.15s ease'
                  }}
                  title="Increase size by 2px"
                >
                  <LucideIcon name="plus" size={16} />
                </button>
              </div>
            </div>

            {/* Quick Size Presets */}
            <div>
              <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', marginBottom: '8px' }}>
                Preset Scale Shortcuts
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {[
                  { label: 'Small (32px)', size: 32 },
                  { label: 'Default (42px)', size: 42 },
                  { label: 'Medium (52px)', size: 52 },
                  { label: 'Large (64px)', size: 64 },
                  { label: 'Extra Large (76px)', size: 76 },
                ].map((preset) => {
                  const isActive = activeHeaderSize === preset.size;
                  return (
                    <button
                      key={preset.size}
                      type="button"
                      onClick={() => setHeaderLogoSizeDraft(preset.size)}
                      disabled={savingHeaderSize}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '600',
                        border: `1px solid ${isActive ? '#d97706' : '#e2e8f0'}`,
                        background: isActive ? '#fef3c7' : '#ffffff',
                        color: isActive ? '#b45309' : '#475569',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Live Dynamic Scaling Simulation */}
            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                <span style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <LucideIcon name="eye" size={14} />
                  <span>Navbar Simulation</span>
                </span>
                <span style={{ fontSize: '10px', color: '#b45309', background: '#fef3c7', padding: '2px 6px', borderRadius: '4px', fontWeight: '700' }}>
                  {activeHeaderSize}px
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: '60px', background: '#ffffff', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                <span style={{ fontSize: '12px', fontWeight: '700', color: '#0f172a' }}>Top Bar Right Section:</span>
                <img
                  src={activeHeaderLogo}
                  alt="Header Logo Scaled"
                  style={{
                    height: `${activeHeaderSize}px`,
                    width: 'auto',
                    maxHeight: '76px',
                    objectFit: 'contain',
                    background: '#ffffff',
                    padding: '2px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                    transition: 'height 0.15s ease'
                  }}
                />
              </div>
            </div>

            {/* Action Buttons for Size */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                type="button"
                onClick={handleSaveHeaderSize}
                disabled={savingHeaderSize || (!isHeaderSizeModified && activeHeaderSize === (branding.headerLogoSize ?? DEFAULT_BRANDING.headerLogoSize))}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '9px 18px',
                  borderRadius: '8px',
                  background: '#059669',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: '600',
                  border: 'none',
                  cursor: (isHeaderSizeModified || activeHeaderSize !== (branding.headerLogoSize ?? DEFAULT_BRANDING.headerLogoSize)) ? 'pointer' : 'not-allowed',
                  opacity: (isHeaderSizeModified || activeHeaderSize !== (branding.headerLogoSize ?? DEFAULT_BRANDING.headerLogoSize)) ? 1 : 0.6
                }}
              >
                <LucideIcon name="check" size={15} />
                <span>{savingHeaderSize ? 'Saving…' : 'Save Size to Database & Apply'}</span>
              </button>

              <button
                type="button"
                onClick={handleResetHeaderSize}
                disabled={savingHeaderSize || (activeHeaderSize === DEFAULT_BRANDING.headerLogoSize && !branding.headerLogoSize)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '9px 14px',
                  borderRadius: '8px',
                  background: '#f8fafc',
                  color: '#64748b',
                  fontSize: '13px',
                  fontWeight: '500',
                  border: '1px solid #cbd5e1',
                  cursor: (activeHeaderSize !== DEFAULT_BRANDING.headerLogoSize || branding.headerLogoSize) ? 'pointer' : 'not-allowed',
                  opacity: (activeHeaderSize !== DEFAULT_BRANDING.headerLogoSize || branding.headerLogoSize) ? 1 : 0.6
                }}
                title="Reset Header logo size to default 42px"
              >
                <LucideIcon name="refresh-cw" size={14} />
                <span>Reset to Default (42px)</span>
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* Persistence Architecture & Safeguards Card */}
      <section style={{ padding: '16px 20px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
        <div style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <LucideIcon name="shield" size={16} style={{ color: '#2563eb' }} />
          <span>System Branding Persistence &amp; Integrity Guarantee</span>
        </div>
        <div style={{ fontSize: '12px', color: '#475569', lineHeight: '1.6', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
          <div>
            <strong>1. WebP Compression:</strong> All logos are scaled and compressed client-side to WebP to ensure fast transmission and low database footprint.
          </div>
          <div>
            <strong>2. PostgreSQL Storage:</strong> Branding is saved to the <code style={{ background: '#e2e8f0', padding: '1px 5px', borderRadius: '4px' }}>system_branding</code> table in the backend database.
          </div>
          <div>
            <strong>3. Cross-Portal Sync:</strong> Changes instantly propagate to Member Web, Organisation Web, and login screens via reactive database and broadcast synchronization.
          </div>
        </div>
      </section>
    </div>
  );
}
