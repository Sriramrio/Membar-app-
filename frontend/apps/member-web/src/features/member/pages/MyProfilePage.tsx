import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { CheckCircle2, Eye, ShieldCheck, Pencil, X, Briefcase, AlertCircle, User, MapPin } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { boundaryErrorMessage, previewOtpCode, requestContactVerification, verifyContactVerification } from '@/features/auth/authService';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/common/Input';
import { Avatar, PageHead, StatusPill, Tip } from '@/features/network/components/NetworkUI';
import { activeMemberId, businessForMember, selectActiveMember } from '@/features/network/selectors';
import { updateMember, upsertMember, upsertBusiness, upsertAffiliation } from '@/features/network/networkSlice';
import type { Member } from '@/features/network/types';
import { clearDirtyGuard, setDirtyGuard } from '@/features/member/navigation/memberNavigationSlice';
import { useMemberNavigation } from '@/features/member/navigation/useMemberNavigation';
import { useGovernedCommand } from '@/hooks/useGovernedCommand';
import { CommandExecutionFeedback } from '@/components/commands/CommandExecutionFeedback';
import { categoriesApi, type CategorySectorDto } from '@/services/api/categoriesApi';
import { meApi } from '@/services/api/meApi';

export default function MyProfilePage() {
  const dispatch = useAppDispatch();
  const command = useGovernedCommand();
  const { go } = useMemberNavigation();
  const memberId = useAppSelector(activeMemberId);
  const authAccount = useAppSelector(s => s.auth.account);
  const activeMember = useAppSelector(selectActiveMember);
  const storeMember = useAppSelector(s =>
    s.network.members.find(
      m => m.id === memberId || (Boolean(authAccount?.email) && Boolean(m.email) && m.email.toLowerCase() === authAccount!.email.toLowerCase())
    )
  );

  const fallbackMember: Member = useMemo(() => ({
    id: memberId || `member-${authAccount?.id ?? 'me'}`,
    name: authAccount?.name || 'Member',
    designation: authAccount?.role || 'Member',
    chapter: authAccount?.baseChapter || 'Chennai Chapter',
    city: 'Chennai',
    region: 'Tamil Nadu',
    state: 'Tamil Nadu',
    country: 'India',
    bio: '',
    expertise: [],
    email: authAccount?.email || '',
    phone: (authAccount as any)?.phone || '',
    avatarText: (authAccount?.name || 'ME').slice(0, 2).toUpperCase(),
    profileCompleteness: 85,
    status: 'active',
    verificationStatus: 'verified'
  }), [authAccount, memberId]);

  const member: Member = storeMember ?? activeMember ?? fallbackMember;
  const business = useAppSelector(s => businessForMember(s.network, memberId));

  const [draft, setDraft] = useState<Member>(member);
  const [saved, setSaved] = useState(false);
  const [verifyCode, setVerifyCode] = useState('');
  const [verifyChallenge, setVerifyChallenge] = useState('');
  const [verifiedChange, setVerifiedChange] = useState(false);
  const [verifyBusy, setVerifyBusy] = useState(false);
  const [verifyError, setVerifyError] = useState('');
  const showPreviewContactCode = import.meta.env.DEV || import.meta.env.VITE_ENABLE_PREVIEW_AUTH === 'true';
  const changedContact = (draft?.email ?? '') !== (member?.email ?? '') || (draft?.phone ?? '') !== (member?.phone ?? '');

  // Taxonomy states
  const [categoriesTree, setCategoriesTree] = useState<CategorySectorDto[]>([]);
  const [selectedSector, setSelectedSector] = useState('');
  const [selectedSegment, setSelectedSegment] = useState('');
  const [selectedSpec, setSelectedSpec] = useState('');
  const [origSpec, setOrigSpec] = useState('');
  const [backendCategoryNames, setBackendCategoryNames] = useState({
    sectorName: '',
    segmentName: '',
    specName: ''
  });

  // Full Profile Edit Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalName, setModalName] = useState('');
  const [modalDesignation, setModalDesignation] = useState('');
  const [modalProfTitle, setModalProfTitle] = useState('');
  const [modalDob, setModalDob] = useState('');
  const [modalBio, setModalBio] = useState('');
  const [modalExpertise, setModalExpertise] = useState('');
  const [modalEmail, setModalEmail] = useState('');
  const [modalPhone, setModalPhone] = useState('');
  const [modalAddress, setModalAddress] = useState('');
  const [modalCity, setModalCity] = useState('');
  const [modalRegion, setModalRegion] = useState('');
  const [modalState, setModalState] = useState('');
  const [modalCountry, setModalCountry] = useState('');
  const [modalBizName, setModalBizName] = useState('');
  const [modalSector, setModalSector] = useState('');
  const [modalSegment, setModalSegment] = useState('');
  const [modalSpec, setModalSpec] = useState('');
  const [modalBusy, setModalBusy] = useState(false);
  const [modalSuccess, setModalSuccess] = useState(false);
  const [modalError, setModalError] = useState('');

  const dirty = JSON.stringify(draft) !== JSON.stringify(member) || (selectedSpec !== origSpec);

  const storageKey = authAccount?.email ? `sethu:profile:${authAccount.email.toLowerCase()}` : '';

  useEffect(() => {
    if (member) {
      setDraft(prev => ({
        ...member,
        ...prev,
        name: member.name || prev?.name || '',
        email: member.email || prev?.email || '',
        phone: member.phone || prev?.phone || '',
        designation: member.designation || prev?.designation || '',
        chapter: member.chapter || prev?.chapter || '',
        avatarText: ((member.name || prev?.name || 'ME').slice(0, 2)).toUpperCase()
      }));
    }
  }, [member]);

  // Restore cached extended profile fields from localStorage if present
  useEffect(() => {
    if (!storageKey) return;
    try {
      const cached = localStorage.getItem(storageKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && typeof parsed === 'object') {
          const cachedUpdates: Partial<Member> = {};
          if (parsed.bio) cachedUpdates.bio = parsed.bio;
          if (parsed.designation) cachedUpdates.designation = parsed.designation;
          if (parsed.professionalTitle) cachedUpdates.professionalTitle = parsed.professionalTitle;
          if (parsed.dob) cachedUpdates.dob = parsed.dob;
          if (Array.isArray(parsed.expertise) && parsed.expertise.length > 0) cachedUpdates.expertise = parsed.expertise;
          if (parsed.address) cachedUpdates.address = parsed.address;
          if (parsed.city) cachedUpdates.city = parsed.city;
          if (parsed.region) cachedUpdates.region = parsed.region;
          if (parsed.state) cachedUpdates.state = parsed.state;
          if (parsed.country) cachedUpdates.country = parsed.country;

          if (parsed.specialisationId && !selectedSpec) {
            setSelectedSpec(parsed.specialisationId);
            setOrigSpec(parsed.specialisationId);
          }
          if (parsed.sectorId && !selectedSector) setSelectedSector(parsed.sectorId);
          if (parsed.segmentId && !selectedSegment) setSelectedSegment(parsed.segmentId);
          if (parsed.specName || parsed.segmentName || parsed.sectorName) {
            setBackendCategoryNames({
              sectorName: parsed.sectorName || '',
              segmentName: parsed.segmentName || '',
              specName: parsed.specName || ''
            });
          }

          if (Object.keys(cachedUpdates).length > 0) {
            setDraft(prev => ({ ...prev, ...cachedUpdates }));
            dispatch(upsertMember({ ...member, ...cachedUpdates }));
          }
        }
      }
    } catch {}
  }, [storageKey]);

  useEffect(() => {
    let active = true;

    // Load category tree
    categoriesApi.getCategories().then(data => {
      if (active && Array.isArray(data)) setCategoriesTree(data);
    }).catch(() => {});

    // Authoritative profile from backend PostgreSQL DB
    meApi.getMyProfile().then(profile => {
      if (!active || !profile) return;
      
      const pName = profile.name || profile.fullName || '';
      const pEmail = profile.email || '';
      const pPhone = profile.phone || profile.phoneNumber || '';
      const pBizName = profile.businessName || '';
      const pSpecId = profile.specialisationId || '';
      const pSpecName = profile.specialisationName || '';
      const pSegId = profile.segmentId || '';
      const pSegName = profile.segmentName || '';
      const pSecId = profile.sectorId || '';
      const pSecName = profile.sectorName || '';

      if (pSecId) setSelectedSector(pSecId);
      if (pSegId) setSelectedSegment(pSegId);
      if (pSpecId) {
        setSelectedSpec(pSpecId);
        setOrigSpec(pSpecId);
      }
      if (pSpecName || pSegName || pSecName) {
        setBackendCategoryNames({
          sectorName: pSecName || '',
          segmentName: pSegName || '',
          specName: pSpecName || ''
        });
      }

      const updates: Partial<Member> = {};
      if (pName) updates.name = pName;
      if (pEmail) updates.email = pEmail;
      if (pPhone) updates.phone = pPhone;
      if (pName) updates.avatarText = pName.slice(0, 2).toUpperCase();

      if (Object.keys(updates).length > 0) {
        dispatch(upsertMember({ ...member, ...updates }));
        setDraft(prev => ({ ...prev, ...updates }));
      }

      // If businessName is returned, ensure business is in Redux
      if (pBizName) {
        const bId = profile.businessId || `biz-${member.id}`;
        dispatch(upsertBusiness({
          id: bId,
          name: pBizName,
          tradeName: pBizName,
          legalName: pBizName,
          businessType: 'Enterprise',
          chapter: member.chapter || 'Chennai Chapter',
          city: member.city || 'Chennai',
          region: member.region || 'Tamil Nadu',
          state: member.state || 'Tamil Nadu',
          country: member.country || 'India',
          description: '',
          capabilities: [],
          products: [],
          services: [],
          logoText: pBizName.slice(0, 2).toUpperCase(),
          visibility: 'network',
          categoryIds: pSpecId ? [pSpecId] : []
        }));
        dispatch(upsertAffiliation({
          id: `aff-${bId}`,
          memberId: member.id,
          businessId: bId,
          relationshipType: 'Founder',
          designation: member.designation || 'Member',
          primaryRepresentative: true,
          authorisedRepresentative: true,
          authorityLevel: 'Administer',
          startsAt: new Date().toISOString().slice(0, 10),
          verificationStatus: 'Verified',
          visibility: 'Network',
          active: true
        }));
      }
    }).catch(err => {
      console.warn("Could not load backend profile:", err);
    });

    return () => { active = false; };
  }, [member.id, dispatch]);

  useEffect(() => {
    const h = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, [dirty]);

  useEffect(() => {
    dispatch(setDirtyGuard({ dirty, label: 'Member profile', canSaveDraft: false }));
    return () => { dispatch(clearDirtyGuard()); };
  }, [dirty, dispatch]);

  const completion = useMemo(() => {
    const checks = [
      draft.name,
      draft.designation,
      draft.professionalTitle,
      draft.email,
      draft.phone,
      draft.bio,
      (draft.expertise || []).length,
      draft.city,
      draft.state,
      draft.country,
      draft.address
    ];
    return Math.round(checks.filter(Boolean).length / checks.length * 100);
  }, [draft]);

  // Find names for display
  const resolvedCategory = useMemo(() => {
    let matchedSec = categoriesTree.find(s => selectedSector && String(s.id).toLowerCase() === String(selectedSector).toLowerCase());
    let matchedSeg = matchedSec?.segments?.find(g => selectedSegment && String(g.id).toLowerCase() === String(selectedSegment).toLowerCase());
    let matchedSpec = matchedSeg?.specialisations?.find(sp => selectedSpec && String(sp.id).toLowerCase() === String(selectedSpec).toLowerCase());

    // If curSpec was not found via direct path, search the entire categoriesTree for selectedSpec!
    if ((!matchedSpec || !matchedSec || !matchedSeg) && selectedSpec && categoriesTree.length > 0) {
      for (const sec of categoriesTree) {
        for (const seg of sec.segments || []) {
          const found = seg.specialisations?.find(sp => String(sp.id).toLowerCase() === String(selectedSpec).toLowerCase());
          if (found) {
            matchedSec = sec;
            matchedSeg = seg;
            matchedSpec = found;
            break;
          }
        }
        if (matchedSpec) break;
      }
    }

    return {
      sectorName: matchedSec?.name || backendCategoryNames.sectorName || (selectedSector ? "Industry Assigned" : "Not Selected"),
      segmentName: matchedSeg?.name || backendCategoryNames.segmentName || (selectedSegment ? "Group Assigned" : "Not Selected"),
      specName: matchedSpec?.name || backendCategoryNames.specName || (selectedSpec ? "Slot Assigned" : "Not Assigned"),
      sectorId: matchedSec?.id || selectedSector,
      segmentId: matchedSeg?.id || selectedSegment,
      specId: matchedSpec?.id || selectedSpec,
      sectorObj: matchedSec,
      segmentObj: matchedSeg,
      specObj: matchedSpec
    };
  }, [categoriesTree, selectedSector, selectedSegment, selectedSpec, backendCategoryNames]);

  const handleOpenModal = () => {
    const sec = selectedSector || resolvedCategory.sectorId || '';
    const seg = selectedSegment || resolvedCategory.segmentId || '';
    const sp = selectedSpec || resolvedCategory.specId || '';

    setModalName(draft.name || member.name || '');
    setModalDesignation(draft.designation || member.designation || '');
    setModalProfTitle(draft.professionalTitle || member.professionalTitle || '');
    setModalDob(draft.dob || member.dob || '');
    setModalBio(draft.bio || member.bio || '');
    setModalExpertise((draft.expertise || member.expertise || []).join(', '));
    setModalEmail(draft.email || member.email || '');
    setModalPhone(draft.phone || member.phone || '');
    setModalAddress(draft.address || member.address || '');
    setModalCity(draft.city || member.city || '');
    setModalRegion(draft.region || member.region || '');
    setModalState(draft.state || member.state || '');
    setModalCountry(draft.country || member.country || '');
    setModalBizName(business?.name || draft.name || member.name || '');
    setModalSector(sec);
    setModalSegment(seg);
    setModalSpec(sp);
    setModalSuccess(false);
    setModalError('');
    setShowModal(true);
  };

  const handleSaveModal = async () => {
    if (!modalName.trim()) {
      setModalError('Full Name is required.');
      return;
    }
    if (!modalEmail.trim()) {
      setModalError('Email is required.');
      return;
    }
    if (!modalPhone.trim()) {
      setModalError('Phone number is required.');
      return;
    }
    setModalBusy(true);
    setModalError('');
    try {
      // 1. Update in PostgreSQL database via backend meApi
      await meApi.updateMyProfile({
        name: modalName.trim(),
        phoneNumber: modalPhone.trim(),
        email: modalEmail.trim(),
        businessName: modalBizName.trim() || modalName.trim(),
        specialisationId: modalSpec || undefined
      });

      // 2. Prepare member changes
      const expList = modalExpertise.split(',').map(x => x.trim()).filter(Boolean);
      const changes: Partial<Member> = {
        name: modalName.trim(),
        designation: modalDesignation.trim(),
        professionalTitle: modalProfTitle.trim(),
        dob: modalDob,
        bio: modalBio.trim(),
        expertise: expList,
        email: modalEmail.trim(),
        phone: modalPhone.trim(),
        address: modalAddress.trim(),
        city: modalCity.trim(),
        region: modalRegion.trim(),
        state: modalState.trim(),
        country: modalCountry.trim()
      };

      // 3. Find names for category
      let secName = '';
      let segName = '';
      let spName = '';
      const secObj = categoriesTree.find(s => String(s.id).toLowerCase() === String(modalSector).toLowerCase());
      const segObj = secObj?.segments?.find(g => String(g.id).toLowerCase() === String(modalSegment).toLowerCase());
      const spObj = segObj?.specialisations?.find(sp => String(sp.id).toLowerCase() === String(modalSpec).toLowerCase());
      if (secObj) secName = secObj.name;
      if (segObj) segName = segObj.name;
      if (spObj) spName = spObj.name;

      if (spName) {
        setBackendCategoryNames({
          sectorName: secName,
          segmentName: segName,
          specName: spName
        });
      }

      // 4. Save to localStorage for persistence across login/logout sessions
      if (storageKey) {
        try {
          localStorage.setItem(storageKey, JSON.stringify({
            ...changes,
            businessName: modalBizName.trim(),
            sectorId: modalSector,
            segmentId: modalSegment,
            specialisationId: modalSpec,
            sectorName: secName,
            segmentName: segName,
            specName: spName
          }));
        } catch {}
      }

      // 5. Update redux member & business
      const fullUpdated: Member = { ...member, ...changes };
      dispatch(upsertMember(fullUpdated));
      setDraft(prev => ({ ...prev, ...changes }));

      if (modalBizName.trim()) {
        const bId = business?.id || `biz-${member.id}`;
        dispatch(upsertBusiness({
          id: bId,
          name: modalBizName.trim(),
          tradeName: modalBizName.trim(),
          legalName: modalBizName.trim(),
          businessType: 'Enterprise',
          chapter: member.chapter || 'Chennai Chapter',
          city: modalCity.trim() || 'Chennai',
          region: modalRegion.trim() || 'Tamil Nadu',
          state: modalState.trim() || 'Tamil Nadu',
          country: modalCountry.trim() || 'India',
          description: '',
          capabilities: [],
          products: [],
          services: [],
          logoText: modalBizName.trim().slice(0, 2).toUpperCase(),
          visibility: 'network',
          categoryIds: modalSpec ? [modalSpec] : []
        }));
      }

      // 6. Update taxonomy states
      setSelectedSector(modalSector);
      setSelectedSegment(modalSegment);
      setSelectedSpec(modalSpec);
      setOrigSpec(modalSpec);

      setModalSuccess(true);
      setTimeout(() => {
        setShowModal(false);
        setModalSuccess(false);
      }, 1200);
    } catch (err: any) {
      setModalError(err?.message || 'Failed to update full profile in database.');
    } finally {
      setModalBusy(false);
    }
  };

  const save = async (e: FormEvent) => {
    e.preventDefault();
    command.clearError();
    if (changedContact && !verifiedChange) return;
    const changes = {
      ...draft,
      profileCompleteness: completion,
      verificationStatus: changedContact ? ('verified' as const) : draft.verificationStatus
    };
    const result = await command.execute({
      domain: 'member',
      policyId: 'member.profile.update',
      command: 'member.profile.update',
      aggregateType: 'Member',
      aggregateId: member.id,
      expectedVersion: member.version,
      payload: { memberId: member.id, changes },
      previewAction: () => dispatch(upsertMember({ ...member, ...changes }))
    });

    try {
      await meApi.updateMyProfile({
        name: draft.name,
        phoneNumber: draft.phone,
        email: draft.email,
        businessName: business?.name || draft.name,
        specialisationId: selectedSpec || undefined
      });
      setOrigSpec(selectedSpec);
      if (storageKey) {
        try {
          localStorage.setItem(storageKey, JSON.stringify({
            ...draft,
            businessName: business?.name || draft.name,
            sectorId: selectedSector,
            segmentId: selectedSegment,
            specialisationId: selectedSpec,
            sectorName: resolvedCategory.sectorName,
            segmentName: resolvedCategory.segmentName,
            specName: resolvedCategory.specName
          }));
        } catch {}
      }
    } catch (err) {
      console.error("Failed to update profile specialisation in DB", err);
    }

    if (!result.ok) return;
    setSaved(true);
    setVerifiedChange(false);
    dispatch(clearDirtyGuard());
  };

  return (
    <div>
      <PageHead
        title="My Profile"
        description="Personal, contact and professional profile with contact-change verification, completion score and privacy-aware preview."
      />
      <div className="mb-4">
        <CommandExecutionFeedback
          error={command.error}
          onReload={() => window.location.reload()}
          onRetry={() => void command.retry()}
          onDismiss={command.clearError}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.2fr_.8fr]">
        <Card>
          <form onSubmit={save} className="grid gap-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <Avatar text={member.avatarText} size="lg" />
                <div>
                  <div className="font-black text-slate-900 text-lg">{member.name}</div>
                  <div className="text-sm text-slate-500">{member.chapter}</div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <StatusPill tone={member.verificationStatus === 'verified' ? 'good' : 'warn'}>
                  {member.verificationStatus ?? 'unverified'}
                </StatusPill>
                <StatusPill tone={completion >= 80 ? 'good' : 'warn'}>{completion}% complete</StatusPill>
                <button
                  type="button"
                  onClick={handleOpenModal}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[var(--maroon-900,#581c1c)] to-[var(--navy-950,#0f172a)] px-4 py-2 text-xs font-bold text-white shadow-xs hover:brightness-110 transition cursor-pointer"
                >
                  <Pencil className="size-3.5 text-amber-400" />
                  <span>Edit Full Profile</span>
                </button>
              </div>
            </div>

            {saved && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">
                <CheckCircle2 className="mr-1 inline size-4" />Profile saved.
              </div>
            )}

            <section>
              <h2 className="font-black text-slate-900">Personal & professional</h2>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                <Input required label="Name" value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} />
                <Input required label="Designation" value={draft.designation} onChange={e => setDraft({ ...draft, designation: e.target.value })} />
                <Input label="Professional title" value={draft.professionalTitle ?? ''} onChange={e => setDraft({ ...draft, professionalTitle: e.target.value })} />
                <Input label="Date of birth" type="date" value={draft.dob ?? ''} onChange={e => setDraft({ ...draft, dob: e.target.value })} />
              </div>
              <label className="mt-4 grid gap-1.5 text-sm font-bold">
                Professional summary
                <textarea
                  rows={4}
                  className="rounded-lg border border-slate-300 p-3 font-normal"
                  value={draft.bio}
                  onChange={e => setDraft({ ...draft, bio: e.target.value })}
                />
              </label>
              <div className="mt-4">
                <Input
                  label="Expertise (comma separated)"
                  value={(draft.expertise || []).join(', ')}
                  onChange={e => setDraft({ ...draft, expertise: e.target.value.split(',').map(x => x.trim()).filter(Boolean) })}
                />
              </div>
            </section>

            {/* Business Classification & Category Slot Section with Edit Button */}
            <section className="border-t border-slate-200 pt-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-black text-slate-900">Business Classification & Category Slot</h2>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Governed Sector, Business Group, and specific Specialisation slot assigned to you.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleOpenModal}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-sky-300 bg-sky-50 px-3.5 py-2 text-xs font-bold text-sky-800 shadow-xs hover:bg-sky-100 hover:border-sky-400 transition cursor-pointer"
                >
                  <Pencil className="size-3.5 text-sky-600" />
                  <span>Edit Profile & Category</span>
                </button>
              </div>

              {/* Classification Summary Cards */}
              <div className="mt-3 grid gap-3 sm:grid-cols-3 rounded-2xl border border-sky-100 bg-sky-50/40 p-4">
                <div className="rounded-xl border border-slate-200/70 bg-white p-3.5 shadow-2xs">
                  <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    1. Industry / Sector
                  </span>
                  <span className="mt-1 block text-sm font-bold text-slate-800">
                    {resolvedCategory.sectorName}
                  </span>
                </div>

                <div className="rounded-xl border border-slate-200/70 bg-white p-3.5 shadow-2xs">
                  <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    2. Business Group
                  </span>
                  <span className="mt-1 block text-sm font-bold text-slate-800">
                    {resolvedCategory.segmentName}
                  </span>
                </div>

                <div className="rounded-xl border border-sky-200 bg-white p-3.5 shadow-2xs">
                  <span className="block text-[11px] font-bold uppercase tracking-wider text-sky-600">
                    3. Category Slot
                  </span>
                  <div className="mt-1 flex items-center gap-1.5">
                    <span className="block text-sm font-black text-sky-900">
                      {resolvedCategory.specName}
                    </span>
                  </div>
                  <span className="mt-1 inline-flex items-center gap-1 rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                    <span className="size-1.5 rounded-full bg-emerald-500" />
                    Chapter Slot Reserved
                  </span>
                </div>
              </div>
            </section>

            <section className="border-t border-slate-200 pt-5">
              <h2 className="font-black text-slate-900">Contact</h2>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                <Input required type="email" label="Email" value={draft.email} onChange={e => { setDraft({ ...draft, email: e.target.value }); setVerifiedChange(false); }} />
                <Input required label="Phone" value={draft.phone} onChange={e => { setDraft({ ...draft, phone: e.target.value }); setVerifiedChange(false); }} />
                <div className="sm:col-span-2">
                  <Input label="Address" value={draft.address ?? ''} onChange={e => setDraft({ ...draft, address: e.target.value })} />
                </div>
              </div>
              {changedContact && !verifiedChange && (
                <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <div className="font-bold text-amber-900">Verify changed contact information</div>
                  <p className="mt-1 text-sm text-amber-800">
                    A fresh, expiring one-time code is required before changed contact data can be saved.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {!verifyChallenge ? (
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={async () => {
                          setVerifyBusy(true);
                          setVerifyError('');
                          try {
                            const c = await requestContactVerification(member.id, draft.email || draft.phone);
                            setVerifyChallenge(c.id);
                            setVerifyCode('');
                          } catch (err) {
                            setVerifyError(boundaryErrorMessage(err, 'A verification code could not be requested. Try again or contact support.'));
                          } finally {
                            setVerifyBusy(false);
                          }
                        }}
                        disabled={verifyBusy}
                      >
                        Send verification code
                      </Button>
                    ) : (
                      <>
                        <input
                          aria-label="Verification code"
                          className="min-h-11 rounded-lg border border-amber-300 bg-white px-3"
                          value={verifyCode}
                          onChange={e => setVerifyCode(e.target.value.replace(/\D/g, ''))}
                        />
                        <Button
                          type="button"
                          onClick={async () => {
                            setVerifyBusy(true);
                            setVerifyError('');
                            try {
                              const r = await verifyContactVerification(verifyChallenge, verifyCode, member.id);
                              if (r.ok) setVerifiedChange(true);
                            } catch (err) {
                              setVerifyError(boundaryErrorMessage(err, 'The contact change could not be verified. Try again or contact support.'));
                            } finally {
                              setVerifyBusy(false);
                            }
                          }}
                          disabled={verifyBusy || verifyCode.length !== 6}
                        >
                          Verify
                        </Button>
                        {showPreviewContactCode && previewOtpCode(verifyChallenge) && (
                          <span className="self-center text-sm font-semibold text-amber-900">
                            Preview-only generated code: {previewOtpCode(verifyChallenge)}
                          </span>
                        )}
                      </>
                    )}
                  </div>
                  {verifyError && <p role="alert" className="mt-3 text-sm font-semibold text-red-700">{verifyError}</p>}
                </div>
              )}
            </section>

            <section className="border-t border-slate-200 pt-5">
              <h2 className="font-black text-slate-900">Network context</h2>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                <Input disabled label="Parivar" value={draft.chapter} />
                <Input disabled label="Business" value={business?.name ?? 'No verified business affiliation'} />
                <Input label="City" value={draft.city} onChange={e => setDraft({ ...draft, city: e.target.value })} />
                <Input label="Region" value={draft.region} onChange={e => setDraft({ ...draft, region: e.target.value })} />
                <Input label="State" value={draft.state} onChange={e => setDraft({ ...draft, state: e.target.value })} />
                <Input label="Country" value={draft.country} onChange={e => setDraft({ ...draft, country: e.target.value })} />
              </div>
            </section>

            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit" disabled={command.busy || !dirty || (changedContact && !verifiedChange)}>
                {command.busy ? 'Saving…' : 'Save profile'}
              </Button>
              {dirty && <span className="text-sm font-semibold text-amber-700">Unsaved changes</span>}
            </div>
          </form>
        </Card>

        <div className="grid content-start gap-4">
          <Card>
            <div className="flex items-center gap-2 font-black"><Eye className="size-4" />Network preview</div>
            <div className="mt-4 flex items-center gap-3">
              <Avatar text={draft.avatarText} />
              <div>
                <div className="font-black">{draft.name}</div>
                <div className="text-sm text-slate-600">{draft.designation}{draft.professionalTitle ? ` · ${draft.professionalTitle}` : ''}</div>
                <div className="text-sm text-slate-500">{business?.name} · {draft.city}</div>
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-600">{draft.bio}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {(draft.expertise || []).map(x => <span key={x} className="rounded-full bg-slate-100 px-2.5 py-1 text-sm font-bold">{x}</span>)}
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-2 font-black"><ShieldCheck className="size-4" />Visibility</div>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Use Privacy Settings to preview exactly which email, phone, address, biography and professional fields are visible to same-chapter and connected members.
            </p>
            <Button type="button" variant="secondary" className="mt-3" onClick={() => go('/app/settings/privacy', { label: 'My Profile' })}>
              Open privacy settings
            </Button>
          </Card>
          <Tip>Parivar/role assignments are governed organisational data and are not editable from the member profile.</Tip>
        </div>
      </div>

      {/* FULL PROFILE EDIT POP-UP MODAL DIALOG */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header with Sethu Maroon / Deep Navy brand color & Close Button */}
            <div className="flex items-center justify-between bg-gradient-to-r from-[var(--maroon-900,#581c1c)] via-[var(--navy-950,#0f172a)] to-[#7f1d1d] p-5 text-white border-b-2 border-amber-500/50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="grid size-10 place-items-center rounded-xl bg-amber-500/20 text-amber-300 border border-amber-400/30">
                  <Pencil className="size-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white tracking-wide">Edit Full Profile</h3>
                  <p className="text-xs text-amber-200/90">Update profile, classification, slot & contact directly in database</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                disabled={modalBusy}
                className="grid size-8 place-items-center rounded-lg bg-white/10 text-white hover:bg-white/20 transition cursor-pointer"
                title="Close"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-6 space-y-5 overflow-y-auto flex-1">
              {modalSuccess && (
                <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-xs font-bold text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="size-4.5 text-emerald-600 shrink-0" />
                  <span>Profile details and category slot updated successfully in database!</span>
                </div>
              )}
              {modalError && (
                <div className="rounded-xl border border-red-300 bg-red-50 p-3 text-xs font-bold text-red-800 flex items-center gap-2">
                  <AlertCircle className="size-4.5 text-red-600 shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              {/* Section 1: Personal & Professional */}
              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4 space-y-3">
                <div className="flex items-center gap-2 font-black text-xs text-slate-800 uppercase tracking-wider border-b border-slate-200/60 pb-2">
                  <User className="size-4 text-[var(--maroon-900,#581c1c)]" />
                  <span>1. Personal & Professional Details</span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      className="h-9 w-full rounded-xl border border-slate-300 bg-white px-3 text-xs text-slate-800 focus:border-amber-500 focus:outline-none"
                      value={modalName}
                      onChange={e => setModalName(e.target.value)}
                      placeholder="e.g. Anand Kumar"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Applicant's Designation <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      className="h-9 w-full rounded-xl border border-slate-300 bg-white px-3 text-xs text-slate-800 focus:border-amber-500 focus:outline-none"
                      value={modalDesignation}
                      onChange={e => setModalDesignation(e.target.value)}
                      placeholder="e.g. Managing Director / Partner"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Professional Title
                    </label>
                    <input
                      type="text"
                      className="h-9 w-full rounded-xl border border-slate-300 bg-white px-3 text-xs text-slate-800 focus:border-amber-500 focus:outline-none"
                      value={modalProfTitle}
                      onChange={e => setModalProfTitle(e.target.value)}
                      placeholder="e.g. Senior Chartered Accountant"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      className="h-9 w-full rounded-xl border border-slate-300 bg-white px-3 text-xs text-slate-800 focus:border-amber-500 focus:outline-none"
                      value={modalDob}
                      onChange={e => setModalDob(e.target.value)}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Professional Summary
                    </label>
                    <textarea
                      rows={3}
                      className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs text-slate-800 focus:border-amber-500 focus:outline-none"
                      value={modalBio}
                      onChange={e => setModalBio(e.target.value)}
                      placeholder="Brief summary of professional background and business expertise"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Expertise (comma separated)
                    </label>
                    <input
                      type="text"
                      className="h-9 w-full rounded-xl border border-slate-300 bg-white px-3 text-xs text-slate-800 focus:border-amber-500 focus:outline-none"
                      value={modalExpertise}
                      onChange={e => setModalExpertise(e.target.value)}
                      placeholder="e.g. GST, Corporate Audit, Tax Filing"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Business Classification & Category Slot */}
              <div className="rounded-2xl border border-sky-200/80 bg-sky-50/40 p-4 space-y-3">
                <div className="flex items-center gap-2 font-black text-xs text-sky-950 uppercase tracking-wider border-b border-sky-200/60 pb-2">
                  <Briefcase className="size-4 text-sky-700" />
                  <span>2. Business Classification & Category Slot</span>
                </div>

                {/* Business Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Business / Organisation Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="h-9 w-full rounded-xl border border-slate-300 bg-white px-3 text-xs text-slate-800 focus:border-sky-500 focus:outline-none"
                    value={modalBizName}
                    onChange={e => setModalBizName(e.target.value)}
                    placeholder="e.g. Anand Kumar Associates"
                    required
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  {/* Cascading Dropdown 1: Sector */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      1. Industry / Sector
                    </label>
                    <select
                      className="h-9 w-full rounded-xl border border-slate-300 bg-white px-2.5 text-xs text-slate-800 focus:border-sky-500 focus:outline-none"
                      value={modalSector}
                      onChange={e => {
                        setModalSector(e.target.value);
                        setModalSegment('');
                        setModalSpec('');
                      }}
                    >
                      <option value="">Select Industry ({categoriesTree.length || 27})</option>
                      {categoriesTree.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Cascading Dropdown 2: Segment */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      2. Business Group
                    </label>
                    {(() => {
                      const curSec = categoriesTree.find(s => String(s.id).toLowerCase() === String(modalSector).toLowerCase());
                      const curSegs = curSec?.segments || [];
                      return (
                        <select
                          disabled={!modalSector}
                          className="h-9 w-full rounded-xl border border-slate-300 bg-white px-2.5 text-xs text-slate-800 disabled:bg-slate-100 disabled:text-slate-400 focus:border-sky-500 focus:outline-none"
                          value={modalSegment}
                          onChange={e => {
                            setModalSegment(e.target.value);
                            setModalSpec('');
                          }}
                        >
                          <option value="">{modalSector ? `Select Group (${curSegs.length})` : "Select Industry first"}</option>
                          {curSegs.map(g => (
                            <option key={g.id} value={g.id}>{g.name}</option>
                          ))}
                        </select>
                      );
                    })()}
                  </div>

                  {/* Cascading Dropdown 3: Specialisation */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      3. Category Slot
                    </label>
                    {(() => {
                      const curSec = categoriesTree.find(s => String(s.id).toLowerCase() === String(modalSector).toLowerCase());
                      const curSeg = curSec?.segments?.find(g => String(g.id).toLowerCase() === String(modalSegment).toLowerCase());
                      const curSpecs = curSeg?.specialisations || [];
                      return (
                        <select
                          disabled={!modalSegment}
                          className="h-9 w-full rounded-xl border border-slate-300 bg-white px-2.5 text-xs text-slate-800 disabled:bg-slate-100 disabled:text-slate-400 focus:border-sky-500 focus:outline-none"
                          value={modalSpec}
                          onChange={e => setModalSpec(e.target.value)}
                        >
                          <option value="">{modalSegment ? `Select Slot (${curSpecs.length})` : "Select Group first"}</option>
                          {curSpecs.map(sp => (
                            <option key={sp.id} value={sp.id}>{sp.name}</option>
                          ))}
                        </select>
                      );
                    })()}
                  </div>
                </div>

                <div className="rounded-xl border border-sky-200 bg-sky-50 p-2.5 text-[11px] text-sky-900 flex items-start gap-2">
                  <ShieldCheck className="size-4 text-sky-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Chapter Slot Exclusivity:</strong> Each member receives an exclusive business slot within their chapter. Saved directly to the database.
                  </span>
                </div>
              </div>

              {/* Section 3: Contact & Location */}
              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4 space-y-3">
                <div className="flex items-center gap-2 font-black text-xs text-slate-800 uppercase tracking-wider border-b border-slate-200/60 pb-2">
                  <MapPin className="size-4 text-[var(--maroon-900,#581c1c)]" />
                  <span>3. Contact & Location Details</span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      className="h-9 w-full rounded-xl border border-slate-300 bg-white px-3 text-xs text-slate-800 focus:border-amber-500 focus:outline-none"
                      value={modalEmail}
                      onChange={e => setModalEmail(e.target.value)}
                      placeholder="member@domain.com"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      className="h-9 w-full rounded-xl border border-slate-300 bg-white px-3 text-xs text-slate-800 focus:border-amber-500 focus:outline-none"
                      value={modalPhone}
                      onChange={e => setModalPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      required
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Address
                    </label>
                    <input
                      type="text"
                      className="h-9 w-full rounded-xl border border-slate-300 bg-white px-3 text-xs text-slate-800 focus:border-amber-500 focus:outline-none"
                      value={modalAddress}
                      onChange={e => setModalAddress(e.target.value)}
                      placeholder="Office / Street address"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      className="h-9 w-full rounded-xl border border-slate-300 bg-white px-3 text-xs text-slate-800 focus:border-amber-500 focus:outline-none"
                      value={modalCity}
                      onChange={e => setModalCity(e.target.value)}
                      placeholder="e.g. Hosur"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Region / District
                    </label>
                    <input
                      type="text"
                      className="h-9 w-full rounded-xl border border-slate-300 bg-white px-3 text-xs text-slate-800 focus:border-amber-500 focus:outline-none"
                      value={modalRegion}
                      onChange={e => setModalRegion(e.target.value)}
                      placeholder="e.g. Krishnagiri"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      State
                    </label>
                    <input
                      type="text"
                      className="h-9 w-full rounded-xl border border-slate-300 bg-white px-3 text-xs text-slate-800 focus:border-amber-500 focus:outline-none"
                      value={modalState}
                      onChange={e => setModalState(e.target.value)}
                      placeholder="e.g. Tamil Nadu"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Country
                    </label>
                    <input
                      type="text"
                      className="h-9 w-full rounded-xl border border-slate-300 bg-white px-3 text-xs text-slate-800 focus:border-amber-500 focus:outline-none"
                      value={modalCountry}
                      onChange={e => setModalCountry(e.target.value)}
                      placeholder="e.g. India"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer Buttons */}
            <div className="flex items-center justify-end gap-3 border-t border-slate-100 p-4 bg-slate-50 shrink-0">
              <button
                type="button"
                disabled={modalBusy}
                onClick={() => setShowModal(false)}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={modalBusy || !modalName.trim() || !modalEmail.trim() || !modalPhone.trim()}
                onClick={handleSaveModal}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[var(--maroon-900,#581c1c)] to-[var(--navy-950,#0f172a)] px-5 py-2 text-xs font-bold text-white shadow-xs hover:brightness-110 disabled:opacity-50 transition cursor-pointer"
              >
                <CheckCircle2 className="size-3.5 text-amber-400" />
                {modalBusy ? 'Saving to Database…' : 'Save & Update in DB'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
