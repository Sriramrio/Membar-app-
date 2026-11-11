import { useEffect, useState, useRef, type ChangeEvent, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  Building2, 
  Lock, 
  ArrowRight, 
  KeyRound, 
  AlertCircle,
  UserCheck,
  CheckCircle2,
  ChevronDown,
  Award,
  Users,
  FileText,
  UserPlus
} from 'lucide-react';
import { ChangePasswordModal } from '@/components/ChangePasswordModal';
import { env } from '@/config/env';
import { authStorage } from '@/utils/authStorage';
import { useSystemBranding } from '@/services/brandingService';

const ROLE_OPTIONS = [
  {
    value: 'Leadership Finance',
    label: 'Leadership Finance',
    desc: 'National Payment Verification (All Chapters)',
    icon: ShieldCheck,
    color: 'text-emerald-700 bg-emerald-50 border-emerald-300',
  },
  {
    value: 'Member Coordinator',
    label: 'Member Coordinator',
    desc: 'Membership Intake & Document Verification (All Chapters)',
    icon: UserPlus,
    color: 'text-teal-600 bg-teal-50 border-teal-200/80',
  },
  {
    value: 'Treasurer',
    label: 'Treasurer (Trusser)',
    desc: 'Chapter Treasurer · Meeting Payments & Dues Verification',
    icon: Users,
    color: 'text-indigo-600 bg-indigo-50 border-indigo-200/80',
  },
  {
    value: 'President',
    label: 'President',
    desc: 'Chapter Executive Leader & Committee Approval',
    icon: UserCheck,
    color: 'text-blue-600 bg-blue-50 border-blue-200/80',
  },
  {
    value: 'Secretary',
    label: 'Secretary',
    desc: 'Chapter Operations & Records',
    icon: FileText,
    color: 'text-purple-600 bg-purple-50 border-purple-200/80',
  },
  {
    value: 'Leadership Team',
    label: 'Leadership Team',
    desc: 'National Master Head (All Chapters)',
    icon: Award,
    color: 'text-amber-600 bg-amber-50 border-amber-200/80',
  },
  {
    value: 'Trustee',
    label: 'Trustee',
    desc: 'Trust Audit & Payment Verification',
    icon: ShieldCheck,
    color: 'text-sky-600 bg-sky-50 border-sky-200/80',
  },
];

export default function OrgLoginPage() {
  const navigate = useNavigate();

  const [selectedRole, setSelectedRole] = useState('President');
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setRoleDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Forced Change Password State
  const [forcedPasswordModalOpen, setForcedPasswordModalOpen] = useState(false);
  const [tempPasswordUsed, setTempPasswordUsed] = useState('');
  const [targetNavigatePath, setTargetNavigatePath] = useState('/org/today');
  const branding = useSystemBranding();

  // If a session is already present in this tab, either force password change or enter workspace
  useEffect(() => {
    const session = authStorage.getActiveSession();
    if (session) {
      const isTrustee = session.position === 'Trustee' || session.role === 'Trustee';
      const isLeadership = authStorage.isLeadershipTeam();
      const isTrust = !isLeadership && (isTrustee || authStorage.isTrustUser());
      const target = isTrustee ? '/org/trustee/leadership' : (isTrust ? '/org/trust-payments' : '/org/today');
      setTargetNavigatePath(target);

      if (session.mustChangePassword && !isTrust && !isLeadership) {
        setIdentifier(session.email || '');
        setTempPasswordUsed('Leader@123');
        setForcedPasswordModalOpen(true);
      } else {
        navigate(target);
      }
    }
  }, [navigate]);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    const trimmedId = identifier.trim();
    if (!trimmedId || !password) {
      setErrorMessage('Please enter both your Email / Member ID and Password.');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      // Direct Database Leadership Authentication
      let res = await fetch(`${env.apiBaseUrl}/auth/leadership-portal-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: trimmedId, password })
      });

      // Fallback to leadership-login if needed
      if (!res.ok && (res.status === 403 || res.status === 404)) {
        try {
          const fallbackRes = await fetch(`${env.apiBaseUrl}/auth/leadership-login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identifier: trimmedId, password })
          });
          if (fallbackRes.ok) {
            res = fallbackRes;
          }
        } catch {
          // ignore fallback error and let main response handle it
        }
      }

      if (res.ok) {
        const data = await res.json();
        const userObj = data.user || {};
        const leaderPosition = data.position || userObj.position || '';
        const leaderRole = data.role || userObj.role || leaderPosition;
        const leaderName = data.name || userObj.name;
        const leaderEmail = data.email || userObj.email || trimmedId;
        const leaderChapterId = data.chapterId || userObj.chapterId;
        const leaderChapterName = data.chapterName || userObj.chapterName;

        // Verify if selected role matches database position
        const dbPosition = (leaderPosition || leaderRole).toLowerCase();
        const chosen = selectedRole.toLowerCase();

        let isMatch = false;
        if (chosen === 'leadership team') {
          isMatch = dbPosition.includes('leadership team') || dbPosition === 'leadership_team' || data.roleType === 'LEADERSHIP_TEAM';
        } else if (chosen === 'leadership finance') {
          isMatch = dbPosition.includes('finance') || dbPosition === 'leadership_finance' || data.roleType === 'LEADERSHIP_FINANCE';
        } else if (chosen === 'trustee') {
          isMatch = dbPosition.includes('trust') || dbPosition.includes('trustee') || data.roleType === 'TRUST_ADMINISTRATOR';
        } else if (chosen === 'treasurer' || chosen === 'vice president' || chosen.includes('trusser')) {
          isMatch = dbPosition.includes('treasurer') || dbPosition.includes('trusser') || dbPosition.includes('vice');
        } else if (chosen === 'president') {
          isMatch = dbPosition.includes('president') && !dbPosition.includes('vice');
        } else if (chosen === 'secretary') {
          isMatch = dbPosition.includes('secretary');
        } else if (chosen === 'member coordinator') {
          isMatch = dbPosition.includes('coordinator');
        }

        if (!isMatch) {
          setErrorMessage(`Role Mismatch: Your account is appointed as "${leaderPosition || leaderRole}" in the database, but you selected "${selectedRole}". Please select your correct appointed role.`);
          setLoading(false);
          return;
        }

        if (data.token) {
          authStorage.setToken(data.token);
        }

        const isLeadershipFinance = chosen === 'leadership finance' || leaderPosition === 'Leadership Finance' || leaderRole === 'leadership_finance' || data.roleType === 'LEADERSHIP_FINANCE';
        const isMemberCoordinator = chosen === 'member coordinator' || leaderPosition === 'Member Coordinator' || leaderRole === 'member_coordinator' || data.roleType === 'MEMBER_COORDINATOR';
        const isLeadershipTeam = !isLeadershipFinance && !isMemberCoordinator && (chosen === 'leadership team' || leaderPosition === 'Leadership Team' || leaderRole === 'leadership_team' || data.roleType === 'LEADERSHIP_TEAM');
        const isTrust = !isLeadershipTeam && !isLeadershipFinance && !isMemberCoordinator && (chosen === 'trustee' || leaderPosition === 'Trust' || leaderPosition === 'Trustee' || leaderRole === 'Trust' || leaderRole === 'Trustee' || leaderRole === 'trust_leader');
        const scopeLevel = (isLeadershipTeam || isLeadershipFinance || isMemberCoordinator || isTrust) ? ('NATIONAL' as const) : ('CHAPTER' as const);
        const resolvedChapterId = (isLeadershipTeam || isLeadershipFinance || isMemberCoordinator || isTrust) ? 'all' : (leaderChapterId ? String(leaderChapterId) : 'ch-unassigned');
        const resolvedChapterName = isLeadershipFinance
          ? 'All Chapters (Leadership Finance)'
          : (isMemberCoordinator
            ? 'All Chapters (Member Coordinator)'
            : (isLeadershipTeam
              ? 'All Chapters (Leadership)'
              : (isTrust ? 'All Chapters (Tenant-Wide)' : (leaderChapterName || 'Assigned Chapter'))));
        const targetPath = isTrust
          ? '/org/trustee/leadership'
          : ((isLeadershipFinance || isMemberCoordinator) ? '/org/member-onboarding' : '/org/today');
        setTargetNavigatePath(targetPath);

        const resolvedRoleType = isLeadershipFinance
          ? 'LEADERSHIP_FINANCE'
          : (isMemberCoordinator
            ? 'CHAPTER_COORDINATOR'
            : (isLeadershipTeam ? 'LEADERSHIP_TEAM' : (isTrust ? 'TRUST_ADMINISTRATOR' : (leaderRole ? leaderRole.toUpperCase().replace(/\s+/g, '_') : selectedRole.toUpperCase().replace(/\s+/g, '_')))));

        const sessionData = {
          name: leaderName ?? (isLeadershipFinance ? 'Leadership Finance Head' : (isMemberCoordinator ? 'Central Member Coordinator' : (isLeadershipTeam ? 'Leadership Team' : 'Authenticated Leader'))),
          role: leaderRole ?? (isLeadershipFinance ? 'Leadership Finance' : (isMemberCoordinator ? 'Member Coordinator' : (isLeadershipTeam ? 'Leadership Team' : (isTrust ? 'Trust' : selectedRole)))),
          position: leaderPosition ?? (isLeadershipFinance ? 'Leadership Finance' : (isMemberCoordinator ? 'Member Coordinator' : (isLeadershipTeam ? 'Leadership Team' : (isTrust ? 'Trust' : selectedRole)))),
          roleType: resolvedRoleType,
          email: leaderEmail,
          scopeId: resolvedChapterId,
          scopeName: resolvedChapterName,
          scopeLevel,
          activeScope: {
            id: resolvedChapterId,
            name: resolvedChapterName,
            level: scopeLevel
          },
          actor: {
            id: leaderEmail,
            name: leaderName ?? (isLeadershipFinance ? 'Leadership Finance Head' : (isMemberCoordinator ? 'Central Member Coordinator' : (isLeadershipTeam ? 'Leadership Team' : 'Authenticated Leader'))),
            position: leaderPosition ?? (isLeadershipFinance ? 'Leadership Finance' : (isMemberCoordinator ? 'Member Coordinator' : (isLeadershipTeam ? 'Leadership Team' : (isTrust ? 'Trust' : selectedRole)))),
            scope: { id: resolvedChapterId, name: resolvedChapterName, level: scopeLevel }
          },
          token: data.token,
          mustChangePassword: data.mustChangePassword,
          loggedInAt: new Date().toISOString()
        };

        // Strictly save in sessionStorage for this tab only
        authStorage.setActiveSession(sessionData);
        if (data.token) {
          authStorage.setToken(data.token);
        }
        authStorage.setItem('selected_chapter_id', resolvedChapterId);
        authStorage.setItem('selected_chapter_name', resolvedChapterName);

        if (data.mustChangePassword && !isTrust && !isLeadershipTeam) {
          setTempPasswordUsed(password);
          setForcedPasswordModalOpen(true);
          setLoading(false);
          return;
        }

        setSuccessMessage(`Authenticated as ${sessionData.name} (${sessionData.position} · ${resolvedChapterName}). Opening workspace…`);
        setTimeout(() => {
          navigate(targetPath);
        }, 300);
      } else {
        const err = await res.json().catch(() => ({}));
        setErrorMessage(
          err.detail || 
          err.message || 
          'Access Denied: Invalid credentials or password. Only appointed leaders in the database can sign in.'
        );
      }
    } catch {
      setErrorMessage('Could not connect to the authentication service. Please check backend connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen max-h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-[#0a1829] to-[#071322] text-white flex flex-col justify-center items-center py-2 sm:py-3 px-3 sm:px-6 w-full max-w-full box-border">
      <div className="w-full max-w-sm sm:max-w-md mx-auto px-1 sm:px-0 box-border flex flex-col justify-center my-auto">
        {/* Brand Logo & Lotus Badging */}
        <div className="text-center mb-2 sm:mb-2.5 flex flex-col items-center">
          <div className="flex items-center justify-center gap-2 mb-1.5 sm:mb-2">
            <div className="p-1 sm:p-1.5 rounded-xl bg-white/95 shadow-md border border-white/20 flex items-center justify-center shrink-0">
              <img
                src={branding.sidebarLogo || "/brand/sethu-logo.jpeg"}
                alt="SETHU Logo"
                style={{
                  height: `${branding.sethuSize ? Math.max(28, Math.min(46, Math.round(branding.sethuSize * 0.9))) : 36}px`,
                  width: 'auto',
                  transition: 'height 0.15s ease'
                }}
                className="max-w-[100px] object-contain rounded-md"
              />
            </div>
            <div className="p-1 sm:p-1.5 rounded-xl bg-white/95 shadow-md border border-white/20 flex items-center justify-center shrink-0">
              <img
                src={branding.headerLogo || "/brand/dbn-logo.jpeg"}
                alt="DBN Logo"
                style={{
                  height: `${branding.headerLogoSize ? Math.max(28, Math.min(50, Math.round(branding.headerLogoSize * 0.85))) : (branding.sethuSize ? Math.max(28, Math.min(46, Math.round(branding.sethuSize * 0.9))) : 36)}px`,
                  width: 'auto',
                  transition: 'height 0.15s ease'
                }}
                className="max-w-[110px] object-contain rounded-md"
              />
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-400/20 text-[10px] font-bold text-blue-300 uppercase tracking-wider mb-1 shadow-xs max-w-full">
            <Building2 className="size-3 text-blue-400 shrink-0" />
            <span className="truncate">SETHU Enterprise Architecture</span>
          </div>

          <h1 className="text-base sm:text-lg font-black tracking-tight text-white text-center leading-tight break-words px-1">
            Organisational Operations Sign-In
          </h1>
        </div>

        {/* Main Sign-In Card */}
        <div className="bg-white rounded-xl sm:rounded-2xl text-slate-900 shadow-2xl border border-slate-100 overflow-hidden w-full max-w-full box-border">
          <div className="p-3 sm:p-4 space-y-2 sm:space-y-2.5">
            {/* Status Messages */}
            {errorMessage && (
              <div className="p-2 sm:p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-start gap-2 animate-fadeIn">
                <AlertCircle className="size-3.5 shrink-0 text-rose-600 mt-0.5" />
                <span className="leading-tight break-words">{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-2 sm:space-y-2.5">
              {/* Role Dropdown - Custom Responsive Contained UI */}
              <div ref={dropdownRef} className="relative w-full">
                <label className="block text-[10px] sm:text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                  Role
                </label>
                {(() => {
                  const currentOpt = ROLE_OPTIONS.find(r => r.value === selectedRole) || ROLE_OPTIONS[1];
                  const ActiveIcon = currentOpt.icon;
                  return (
                    <button
                      type="button"
                      onClick={() => setRoleDropdownOpen(prev => !prev)}
                      className={`w-full pl-2.5 pr-8 py-1.5 sm:py-2 rounded-lg border text-left text-xs sm:text-sm font-semibold transition-all flex items-center justify-between cursor-pointer box-border relative ${
                        roleDropdownOpen 
                          ? 'border-blue-600 ring-2 ring-blue-600 bg-white text-slate-900 shadow-sm' 
                          : 'border-slate-200 bg-slate-50 text-slate-900 hover:bg-white hover:border-slate-300'
                      }`}
                      aria-haspopup="listbox"
                      aria-expanded={roleDropdownOpen}
                    >
                      <div className="flex items-center gap-2 min-w-0 pr-4">
                        <div className={`size-6 rounded-md border flex items-center justify-center shrink-0 ${currentOpt.color}`}>
                          <ActiveIcon className="size-3" />
                        </div>
                        <span className="truncate text-slate-900 font-bold">{selectedRole}</span>
                      </div>
                      <div className={`absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none text-slate-400 transition-transform duration-200 ${roleDropdownOpen ? 'rotate-180 text-blue-600' : ''}`}>
                        <ChevronDown className="size-3.5" />
                      </div>
                    </button>
                  );
                })()}

                {/* Dropdown Options Menu with Scroll and Dedicated Icons */}
                {roleDropdownOpen && (
                  <div 
                    role="listbox"
                    className="absolute left-0 right-0 top-full mt-1 w-full max-w-full bg-white rounded-xl border border-slate-200 shadow-2xl z-50 max-h-48 overflow-y-auto divide-y divide-slate-100 py-1 box-border animate-in fade-in zoom-in-95"
                    style={{
                      scrollbarWidth: 'thin',
                      scrollbarColor: '#cbd5e1 transparent'
                    }}
                  >
                    {ROLE_OPTIONS.map((item) => {
                      const isSelected = selectedRole === item.value;
                      const IconComponent = item.icon;
                      return (
                        <button
                          key={item.value}
                          type="button"
                          onClick={() => {
                            setSelectedRole(item.value);
                            setRoleDropdownOpen(false);
                          }}
                          className={`w-full px-3 py-2 text-left flex items-center justify-between gap-2.5 transition-colors cursor-pointer box-border ${
                            isSelected 
                              ? 'bg-blue-50/80 text-blue-900 font-bold' 
                              : 'text-slate-700 hover:bg-slate-50 font-medium'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0 pr-2">
                            <div className={`size-6 rounded-md border flex items-center justify-center shrink-0 ${item.color}`}>
                              <IconComponent className="size-3" />
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className={`text-xs leading-tight truncate ${isSelected ? 'text-blue-700 font-bold' : 'text-slate-800 font-semibold'}`}>
                                {item.label}
                              </span>
                              <span className="text-[10px] text-slate-400 truncate">
                                {item.desc}
                              </span>
                            </div>
                          </div>
                          {isSelected && (
                            <CheckCircle2 className="size-3.5 text-blue-600 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
              {/* Identifier Input */}
              <div>
                <label className="block text-[10px] sm:text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                  Email or Member ID
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                    <UserCheck className="size-3.5" />
                  </div>
                  <input
                    type="text"
                    required
                    autoFocus
                    value={identifier}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setIdentifier(e.target.value)}
                    placeholder="e.g. president@chennai.dbn.network"
                    className="w-full pl-8 pr-3 py-1.5 sm:py-2 rounded-lg border border-slate-200 bg-slate-50 text-xs sm:text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all box-border"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-[10px] sm:text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="size-3.5" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                    placeholder="Enter your account password"
                    className="w-full pl-8 pr-9 py-1.5 sm:py-2 rounded-lg border border-slate-200 bg-slate-50 text-xs sm:text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all box-border"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                      </svg>
                    ) : (
                      <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Security Badge */}
              <div className="p-1.5 sm:p-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 text-[10px] sm:text-[10.5px] flex items-center gap-2">
                <ShieldCheck className="size-3.5 text-blue-600 shrink-0" />
                <span className="leading-tight truncate">
                  Organisational governance, member coordination & operations.
                </span>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 sm:py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs sm:text-sm tracking-wide transition-all shadow-md shadow-blue-600/25 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? (
                  <>
                    <div className="size-3.5 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0" />
                    <span>Verifying Credentials…</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Organisation Workspace</span>
                    <ArrowRight className="size-3.5 shrink-0" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-2 sm:mt-2.5 text-center text-slate-400 space-y-0.5 px-2">
          <p className="font-medium text-slate-300 text-[10px] sm:text-[10.5px] break-words">
            Dharmic Business Network Trust · High Integrity Governance Engine
          </p>
          <p className="text-[9.5px] sm:text-[10px] text-slate-500 break-words">
            Authorized Positions: Leadership Team · Leadership Finance · Chapter President · Treasurer · Secretary · Trustee
          </p>
        </div>
      </div>

      {/* Forced Change Password Modal when must_change_password flag is true in DB */}
      <ChangePasswordModal
        isOpen={forcedPasswordModalOpen}
        isForced={true}
        initialCurrentPassword={tempPasswordUsed}
        identifier={identifier}
        onSuccess={() => {
          setForcedPasswordModalOpen(false);
          navigate(targetNavigatePath);
        }}
      />
    </div>
  );
}
