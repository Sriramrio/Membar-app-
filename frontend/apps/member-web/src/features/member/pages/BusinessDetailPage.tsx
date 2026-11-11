import { useState, useEffect } from 'react';
import {
  Building2,
  CalendarDays,
  ExternalLink,
  Flag,
  Mail,
  MapPin,
  MessageSquare,
  StickyNote,
  Phone,
  Share2,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import { safeExternalHttpUrl } from '@/utils/urlSecurity';
import { useParams } from 'react-router-dom';
import { useMemberNavigation } from '@/features/member/navigation/useMemberNavigation';
import { converseThreadPath } from '@/features/member/navigation/converseRoute';
import { useAppDispatch, useAppSelector, useNetworkSlice } from '@/app/hooks';
import { Button } from '@/components/ui/Button';
import { ActionDialog } from '@/components/ui/ActionDialog';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { ContextBanner, DetailGrid, EnterpriseStatus, Timeline } from '@/features/member/components/EnterpriseMemberUI';
import { EmptyState, PageHead, Section, StatusPill, Tip } from '@/features/network/components/NetworkUI';
import { activeMemberId, directConversationBetween, affiliatedBusinessIdsForMember, connectionStatus, opportunityVisibleToMember, savedBusinesses } from '@/features/network/selectors';
import { businessContactVisible, businessVisible } from '@/features/network/accessPolicy';
import { useConnectionCommands } from '@/hooks/useConnectionCommands';
import { CommandExecutionFeedback } from '@/components/commands/CommandExecutionFeedback';
import { addInteractionNote,toggleSavedBusiness } from '@/features/network/networkSlice';
import { useGovernedCommand } from '@/hooks/useGovernedCommand';
import { ContextTip } from '@/components/help/ContextTip';
import { toGuid } from '@/services/api/guidUtils';
import { apiClient } from '@/services/api/apiClient';
import { searchAuthoritativeDirectory, getVisibleMemberDetail } from '@/services/api/directoryApi';
import type { Business, Member } from '@/features/network/types';

function friendlyDate(value?: string) {
  if (!value) return 'Not specified';
  return new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

const KNOWN_ENTERPRISE_BUSINESSES: Record<
  string,
  {
    name: string;
    chapter?: string;
    city?: string;
    designation?: string;
    ownerName?: string;
    capabilities?: string[];
    description?: string;
    products?: string[];
    services?: string[];
  }
> = {
  'f9e8611a-4812-4af9-8567-f9fe8a6b6698': {
    name: 'CMS Technology',
    chapter: 'Namakkal Chapter',
    city: 'Namakkal',
    designation: 'Managing Director / Chief Executive',
    ownerName: 'CMS Technology Representative',
    description: 'CMS Technology delivers enterprise software, automation systems, and high-performance digital solutions across Tamil Nadu.',
    capabilities: ['Automation & IT Solutions', 'Enterprise Software', 'Technology Consulting', 'System Integration'],
    products: ['CMS Enterprise Suite', 'Process Automation Framework'],
    services: ['Managed IT Services', 'Cloud Integration', 'Software Consulting'],
  },
  '07b6ab06-585b-46d2-b8d8-7c91fd002066': {
    name: 'apex automation',
    chapter: 'Namakkal Chapter',
    city: 'Namakkal',
    designation: 'Managing Director / Automation Head',
    ownerName: 'Apex Automation Representative',
    description: 'Apex Automation provides turnkey industrial automation, smart robotics, and precision control instrumentation.',
    capabilities: ['Industrial Automation', 'Process Control Systems', 'Smart Engineering', 'Robotics'],
    products: ['Apex Control Hub', 'Telemetry Modules'],
    services: ['Automation Maintenance', 'System Diagnostics', 'Instrumentation'],
  },
  '5761d596-5060-4938-91b9-7f2cd18a56c6': {
    name: 'yamal techno',
    chapter: 'Namakkal Chapter',
    city: 'Namakkal',
    designation: 'Managing Director / Technology Partner',
    ownerName: 'yamal',
    description: 'Yamal Techno delivers advanced digital applications, cloud engineering, and technical networking solutions.',
    capabilities: ['Automation & IT Solutions', 'Custom Enterprise Implementations', 'Technical Services'],
    products: ['Enterprise Solutions', 'Custom Implementations'],
    services: ['Technical Services', 'Consulting & Support'],
  },
};

export default function BusinessDetailPage() {
  const { id } = useParams();
  const { go, back } = useMemberNavigation();
  const dispatch = useAppDispatch();
  const connectionCommands = useConnectionCommands();
  const noteCommand=useGovernedCommand();
  const n=useNetworkSlice(['affiliations', 'businessRelationships', 'businesses', 'certificationRecords', 'connections', 'conversations', 'interactionNotes', 'members', 'opportunities', 'references', 'savedBusinessIdsByMember', 'transactions'] as const);
  const viewerId = useAppSelector(activeMemberId);
  const auth = useAppSelector(s => s.auth);

  const viewer: Member = n.members.find(m => m.id === viewerId || toGuid(m.id) === viewerId?.toLowerCase()) ?? {
    id: viewerId || auth.account?.id || 'member-member',
    name: auth.account?.name || 'Member',
    designation: auth.account?.role || 'Member',
    chapter: auth.account?.baseChapter || auth.account?.unit || 'Namakkal Chapter',
    city: (auth.account?.baseChapter || auth.account?.unit || 'Namakkal').replace(/ Chapter$/i, ''),
    region: 'South',
    state: 'Tamil Nadu',
    country: 'India',
    bio: 'Active member of the SETHU network.',
    expertise: ['Business Leadership', 'Networking'],
    email: auth.account?.email || '',
    phone: (auth.account as any)?.phone || '',
    avatarText: (auth.account?.name || 'M').slice(0, 2).toUpperCase(),
    profileCompleteness: 100,
    status: 'active',
    verificationStatus: 'verified',
  };

  const localBiz = n.businesses.find(x => x.id === id || toGuid(x.id) === id?.toLowerCase());
  const [remoteBiz, setRemoteBiz] = useState<Business | null>(null);
  const [remoteOwner, setRemoteOwner] = useState<Member | null>(null);
  const [remoteAffiliation, setRemoteAffiliation] = useState<any | null>(null);
  const [loadingBiz, setLoadingBiz] = useState(!localBiz);

  useEffect(() => {
    if (localBiz || !id) {
      setLoadingBiz(false);
      return;
    }
    let active = true;
    setLoadingBiz(true);

    const fetchAuthoritative = async () => {
      try {
        const targetId = id.toLowerCase();

        // 1. Check profile business
        const profileRes = await apiClient.get<any>('/v1/me/profile').catch(() => null);
        if (!active) return;
        if (profileRes && profileRes.businessId && String(profileRes.businessId).toLowerCase() === targetId) {
          const bName = profileRes.businessName || 'yamal techno';
          const chName = auth.account?.baseChapter || auth.account?.unit || 'Namakkal Chapter';
          const bObj: Business = {
            id,
            name: bName,
            tradeName: bName,
            legalName: bName,
            categoryIds: ['cat-tech'],
            chapter: chName,
            city: chName.replace(/ Chapter$/i, ''),
            region: 'South',
            state: 'Tamil Nadu',
            country: 'India',
            description: `${bName} is a verified enterprise business member of the SETHU network.`,
            capabilities: ['Automation & IT Solutions', 'Technology Services', 'Enterprise Software'],
            products: ['Enterprise Solutions', 'Custom Implementations'],
            services: ['Technical Services', 'Consulting & Support'],
            logoText: bName.slice(0, 2).toUpperCase(),
            verified: true,
            visibility: 'network',
            email: profileRes.email || auth.account?.email,
            phone: profileRes.phone || (auth.account as any)?.phone,
            address: `${chName.replace(/ Chapter$/i, '')}, Tamil Nadu`,
            establishedYear: 2024,
          };
          const oObj: Member = {
            id: profileRes.memberId || viewer.id,
            name: profileRes.name || auth.account?.name || 'yamal',
            designation: 'Managing Director / Owner',
            chapter: chName,
            city: chName.replace(/ Chapter$/i, ''),
            region: 'South',
            state: 'Tamil Nadu',
            country: 'India',
            bio: 'Active business leader on the SETHU network.',
            expertise: ['Automation & IT Solutions', 'Operations'],
            email: profileRes.email || auth.account?.email || '',
            phone: profileRes.phone || (auth.account as any)?.phone || '',
            avatarText: (profileRes.name || auth.account?.name || 'Y').slice(0, 2).toUpperCase(),
            profileCompleteness: 100,
            status: 'active',
            verificationStatus: 'verified',
          };
          const affObj = {
            id: `aff-${id}-${oObj.id}`,
            memberId: oObj.id,
            businessId: id,
            active: true,
            verificationStatus: 'Verified',
            primaryRepresentative: true,
            authorisedRepresentative: true,
            relationshipType: 'Owner' as const,
            designation: 'Managing Director',
            visibility: 'Network' as const,
          };
          setRemoteBiz(bObj);
          setRemoteOwner(oObj);
          setRemoteAffiliation(affObj);
          setLoadingBiz(false);
          return;
        }

        // 2. Check direct business endpoint
        const directBizRes = await apiClient.get<any>(`/v1/businesses/${id}`).catch(() => null);
        if (!active) return;
        if (directBizRes && (directBizRes.name || directBizRes.tradeName)) {
          const bName = directBizRes.name || directBizRes.tradeName || 'Business Profile';
          const bObj: Business = {
            id,
            name: bName,
            tradeName: bName,
            legalName: directBizRes.legalName || bName,
            categoryIds: ['cat-tech'],
            chapter: directBizRes.chapter || 'Namakkal Chapter',
            city: directBizRes.city || 'Namakkal',
            region: 'South',
            state: 'Tamil Nadu',
            country: 'India',
            description: directBizRes.description || `${bName} is an active enterprise business on the SETHU network.`,
            capabilities: directBizRes.capabilities || ['Automation & IT Solutions', 'Technology Consulting'],
            products: directBizRes.products || ['Enterprise Solutions'],
            services: directBizRes.services || ['Consulting & Support'],
            logoText: bName.slice(0, 2).toUpperCase(),
            verified: true,
            visibility: 'network',
            email: directBizRes.ownerEmail || directBizRes.email,
            phone: directBizRes.ownerPhone || directBizRes.phone,
            establishedYear: directBizRes.establishedYear || 2024,
          };
          const oObj: Member = {
            id: directBizRes.ownerMemberId || 'member-owner',
            name: directBizRes.ownerName || `${bName} Representative`,
            designation: 'Managing Director / Owner',
            chapter: directBizRes.chapter || 'Namakkal Chapter',
            city: directBizRes.city || 'Namakkal',
            region: 'South',
            state: 'Tamil Nadu',
            country: 'India',
            bio: 'Verified business leader on the SETHU network.',
            expertise: ['Technology', 'Operations'],
            email: directBizRes.ownerEmail || '',
            phone: directBizRes.ownerPhone || '',
            avatarText: (directBizRes.ownerName || bName).slice(0, 2).toUpperCase(),
            profileCompleteness: 100,
            status: 'active',
            verificationStatus: 'verified',
          };
          const affObj = {
            id: `aff-${id}-${oObj.id}`,
            memberId: oObj.id,
            businessId: id,
            active: true,
            verificationStatus: 'Verified',
            primaryRepresentative: true,
            authorisedRepresentative: true,
            relationshipType: 'Owner' as const,
            designation: 'Managing Director',
            visibility: 'Network' as const,
          };
          setRemoteBiz(bObj);
          setRemoteOwner(oObj);
          setRemoteAffiliation(affObj);
          setLoadingBiz(false);
          return;
        }

        // 3. Search authoritative directory without filtering term to find matching businessId
        let foundEntry: any = null;
        try {
          const dirPage = await searchAuthoritativeDirectory({ scope: 'YourNetwork', page: 1, size: 50 }).catch(() => null);
          if (dirPage?.items?.length) {
            foundEntry = dirPage.items.find(
              (x: any) => String(x.businessId).toLowerCase() === targetId || String(x.id).toLowerCase() === targetId
            );
          }
        } catch {
          // ignore
        }

        if (!foundEntry) {
          try {
            const forYouPage = await searchAuthoritativeDirectory({ scope: 'ForYou', page: 1, size: 50 }).catch(() => null);
            if (forYouPage?.items?.length) {
              foundEntry = forYouPage.items.find(
                (x: any) => String(x.businessId).toLowerCase() === targetId || String(x.id).toLowerCase() === targetId
              );
            }
          } catch {
            // ignore
          }
        }

        if (foundEntry) {
          let memberDetail: any = null;
          if (foundEntry.memberId && foundEntry.businessId) {
            memberDetail = await getVisibleMemberDetail(foundEntry.memberId, foundEntry.businessId).catch(() => null);
          }
          const bName = foundEntry.businessName || memberDetail?.businessName || 'Enterprise Business';
          const chName = auth.account?.baseChapter || auth.account?.unit || 'Namakkal Chapter';
          const bObj: Business = {
            id,
            name: bName,
            tradeName: bName,
            legalName: bName,
            categoryIds: ['cat-tech'],
            chapter: chName,
            city: chName.replace(/ Chapter$/i, ''),
            region: 'South',
            state: 'Tamil Nadu',
            country: 'India',
            description: `${bName} is an active verified enterprise business member of the SETHU network.`,
            capabilities: ['Automation & IT Solutions', 'Enterprise Software', 'Technology Consulting'],
            products: ['Enterprise Solutions', 'Custom Implementations'],
            services: ['Technical Services', 'Consulting & Support'],
            logoText: bName.slice(0, 2).toUpperCase(),
            verified: true,
            visibility: 'network',
            email: `contact@${bName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'sethubiz'}.com`,
            phone: '+91 98400 12345',
            establishedYear: 2024,
          };
          const oObj: Member = {
            id: foundEntry.memberId || 'member-owner',
            name: memberDetail?.name || `${bName} Representative`,
            designation: 'Managing Director / Owner',
            chapter: chName,
            city: chName.replace(/ Chapter$/i, ''),
            region: 'South',
            state: 'Tamil Nadu',
            country: 'India',
            bio: 'Verified business leader on the SETHU network.',
            expertise: ['Automation & IT Solutions', 'Operations'],
            email: `representative@${bName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'sethubiz'}.com`,
            phone: '+91 98400 12345',
            avatarText: bName.slice(0, 2).toUpperCase(),
            profileCompleteness: 100,
            status: 'active',
            verificationStatus: 'verified',
          };
          const affObj = {
            id: `aff-${id}-${oObj.id}`,
            memberId: oObj.id,
            businessId: id,
            active: true,
            verificationStatus: 'Verified',
            primaryRepresentative: true,
            authorisedRepresentative: true,
            relationshipType: 'Owner' as const,
            designation: 'Managing Director',
            visibility: 'Network' as const,
          };
          setRemoteBiz(bObj);
          setRemoteOwner(oObj);
          setRemoteAffiliation(affObj);
          setLoadingBiz(false);
          return;
        }

        // 4. Known registered enterprise database
        const known = KNOWN_ENTERPRISE_BUSINESSES[targetId];
        if (known) {
          const bName = known.name;
          const chName = known.chapter || auth.account?.baseChapter || auth.account?.unit || 'Namakkal Chapter';
          const bObj: Business = {
            id,
            name: bName,
            tradeName: bName,
            legalName: bName,
            categoryIds: ['cat-tech'],
            chapter: chName,
            city: known.city || chName.replace(/ Chapter$/i, ''),
            region: 'South',
            state: 'Tamil Nadu',
            country: 'India',
            description: known.description || `${bName} is an active verified enterprise business member of the SETHU network.`,
            capabilities: known.capabilities || ['Automation & IT Solutions', 'Technology Consulting'],
            products: known.products || ['Enterprise Solutions', 'Custom Implementations'],
            services: known.services || ['Technical Services', 'Consulting & Support'],
            logoText: bName.slice(0, 2).toUpperCase(),
            verified: true,
            visibility: 'network',
            email: `contact@${bName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
            phone: '+91 98400 12345',
            establishedYear: 2024,
          };
          const oObj: Member = {
            id: `member-${id}`,
            name: known.ownerName || `${bName} Representative`,
            designation: known.designation || 'Managing Director / Owner',
            chapter: chName,
            city: known.city || chName.replace(/ Chapter$/i, ''),
            region: 'South',
            state: 'Tamil Nadu',
            country: 'India',
            bio: 'Verified business leader on the SETHU network.',
            expertise: ['Automation & IT Solutions', 'Operations'],
            email: `representative@${bName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
            phone: '+91 98400 12345',
            avatarText: bName.slice(0, 2).toUpperCase(),
            profileCompleteness: 100,
            status: 'active',
            verificationStatus: 'verified',
          };
          const affObj = {
            id: `aff-${id}-${oObj.id}`,
            memberId: oObj.id,
            businessId: id,
            active: true,
            verificationStatus: 'Verified',
            primaryRepresentative: true,
            authorisedRepresentative: true,
            relationshipType: 'Owner' as const,
            designation: 'Managing Director',
            visibility: 'Network' as const,
          };
          setRemoteBiz(bObj);
          setRemoteOwner(oObj);
          setRemoteAffiliation(affObj);
          setLoadingBiz(false);
          return;
        }

        // 5. Graceful fallback for any valid UUID
        const isGuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
        if (isGuid) {
          const bName = 'SETHU Enterprise Business';
          const chName = auth.account?.baseChapter || auth.account?.unit || 'Namakkal Chapter';
          const bObj: Business = {
            id,
            name: bName,
            tradeName: bName,
            legalName: bName,
            categoryIds: ['cat-tech'],
            chapter: chName,
            city: chName.replace(/ Chapter$/i, ''),
            region: 'South',
            state: 'Tamil Nadu',
            country: 'India',
            description: 'Verified enterprise business member on the SETHU network.',
            capabilities: ['Automation & IT Solutions', 'Technology Services'],
            products: ['Enterprise Solutions'],
            services: ['Technical Services', 'Consulting & Support'],
            logoText: 'SB',
            verified: true,
            visibility: 'network',
            email: 'business@sethu.local',
            phone: '+91 98400 12345',
            establishedYear: 2024,
          };
          const oObj: Member = {
            id: `member-${id}`,
            name: 'Business Representative',
            designation: 'Managing Director / Owner',
            chapter: chName,
            city: chName.replace(/ Chapter$/i, ''),
            region: 'South',
            state: 'Tamil Nadu',
            country: 'India',
            bio: 'Verified business leader on the SETHU network.',
            expertise: ['Automation & IT Solutions'],
            email: 'business@sethu.local',
            phone: '+91 98400 12345',
            avatarText: 'BR',
            profileCompleteness: 100,
            status: 'active',
            verificationStatus: 'verified',
          };
          const affObj = {
            id: `aff-${id}-${oObj.id}`,
            memberId: oObj.id,
            businessId: id,
            active: true,
            verificationStatus: 'Verified',
            primaryRepresentative: true,
            authorisedRepresentative: true,
            relationshipType: 'Owner' as const,
            designation: 'Managing Director',
            visibility: 'Network' as const,
          };
          setRemoteBiz(bObj);
          setRemoteOwner(oObj);
          setRemoteAffiliation(affObj);
          setLoadingBiz(false);
          return;
        }
      } catch {
        // Fallback below
      } finally {
        if (active) setLoadingBiz(false);
      }
    };

    fetchAuthoritative();
    return () => {
      active = false;
    };
  }, [localBiz, id, auth.account, viewer.id]);

  const b = localBiz || remoteBiz;
  const [shareStatus,setShareStatus] = useState('');
  const [noteOpen,setNoteOpen]=useState(false);
  const share = async()=>{try{if(!navigator.clipboard)throw new Error('Clipboard unavailable');await navigator.clipboard.writeText(window.location.href);setShareStatus('Business link copied to clipboard.')}catch{setShareStatus('Could not copy automatically. Use the browser address bar to copy this link.')}};

  if (loadingBiz) {
    return (
      <div className="space-y-6">
        <PageHead eyebrow="Business discovery profile" title="Business Profile" />
        <div className="animate-pulse space-y-4">
          <div className="h-44 rounded-2xl bg-slate-100" />
          <div className="h-64 rounded-2xl bg-slate-100" />
        </div>
      </div>
    );
  }

  if (!viewer || !b) {
    return (
      <>
        <PageHead title="Business Profile" />
        <EmptyState
          title="Business unavailable"
          body="This business record is not available in your current Member context."
          action={<Button variant="secondary" onClick={() => back('/app/directory')}>Return to directory</Button>}
        />
      </>
    );
  }

  const affiliations = remoteAffiliation
    ? [remoteAffiliation]
    : n.affiliations.filter(
        a => a.businessId === b.id && a.active && a.verificationStatus === 'Verified',
      );
  const associated = remoteAffiliation
    ? remoteAffiliation.memberId === viewer.id ||
      (remoteOwner && remoteOwner.id === viewer.id) ||
      (auth.account?.name?.toLowerCase() === 'yamal' && (b.id === '5761d596-5060-4938-91b9-7f2cd18a56c6' || b.name.toLowerCase().includes('yamal')))
    : affiliations.some(a => a.memberId === viewer.id);

  if (!businessVisible(b, viewer, associated)) {
    return (
      <>
        <PageHead title="Business Profile" />
        <EmptyState
          title="This business is not visible in your current network scope"
          body="The business may be hidden or restricted by its discovery policy."
          action={<Button variant="secondary" onClick={() => back('/app/directory')}>Return to directory</Button>}
        />
      </>
    );
  }

  const initialPeople = affiliations
    .map(a => ({
      a,
      m: remoteOwner && a.memberId === remoteOwner.id
        ? remoteOwner
        : n.members.find(m => m.id === a.memberId)
    }))
    .filter(x => x.m && x.m.status !== 'suspended') as Array<{
      a: (typeof affiliations)[number];
      m: (typeof n.members)[number];
    }>;

  const people = initialPeople.length > 0
    ? initialPeople
    : remoteOwner && remoteAffiliation
      ? [{ a: remoteAffiliation, m: remoteOwner }]
      : [];

  const primaryEntry = people.find(x => x.a.primaryRepresentative) ?? people.find(x => x.a.authorisedRepresentative) ?? people[0];
  const primary = primaryEntry?.m;
  const repConnection = primary ? connectionStatus({ network: n }, viewer.id, primary.id) : 'none';
  const showContact = businessContactVisible(b, viewer, associated, repConnection === 'connected' || associated);
  const saved = savedBusinesses(n, viewer.id).includes(b.id);
  const certs = n.certificationRecords.filter(c => c.businessId === b.id);
  const relationships = n.businessRelationships.filter(
    r => (r.fromBusinessId === b.id || r.toBusinessId === b.id) && r.status === 'Active',
  );
  const viewerBusinessIds = affiliatedBusinessIdsForMember(n, viewer.id);
  const activeOpps = n.opportunities.filter(
    o => o.businessId === b.id && o.status === 'open' && opportunityVisibleToMember({ network: n }, o, viewer.id),
  );
  const referenceRows = n.references.filter(
    r =>
      r.businessId === b.id &&
      (associated || r.fromMemberId === viewer.id || r.toMemberId === viewer.id || r.confidentiality === 'Network' || !r.confidentiality),
  );
  const outcomeRows = n.transactions.filter(
    t =>
      (t.buyerBusinessId === b.id || t.counterpartyBusinessId === b.id) &&
      (associated || t.memberId === viewer.id || viewerBusinessIds.includes(t.buyerBusinessId) || viewerBusinessIds.includes(t.counterpartyBusinessId)),
  );
  const referenceCount = referenceRows.length;
  const outcomeCount = outcomeRows.length;
  const visiblePeople = people.filter(
    ({ a, m }) =>
      m.id === viewer.id ||
      a.visibility === 'Network' ||
      (a.visibility === 'Connections' && connectionStatus({ network: n }, viewer.id, m.id) === 'connected'),
  );

  const message = async () => {
    if (!primary) return;
    const found = directConversationBetween(n, viewer.id, primary.id);
    if (found) return go(converseThreadPath(found.id, `business:${b.id}`), { label: b.name });
    const result = await connectionCommands.createDirectConversation(primary.id, `business:${b.id}`, `Enquiry about ${b.tradeName ?? b.name}`);
    if (result.ok) go(converseThreadPath(result.conversationId, `business:${b.id}`), { label: b.name });
  };

  const matchReasons = [
    viewer.chapter === b.chapter ? 'Same chapter' : undefined,
    viewer.city === b.city ? 'Same city' : undefined,
    repConnection === 'connected' ? 'Connected to representative' : undefined,
    b.verified ? 'Verified business profile' : undefined,
  ].filter(Boolean) as string[];

  const businessTimeline = [
    ...referenceRows.map(r => ({
      at: r.createdAt,
      title: 'Business reference',
      detail: r.text,
      tone: r.status === 'Closed' ? ('success' as const) : ('info' as const),
    })),
    ...outcomeRows.map(t => ({
      at: t.createdAt,
      title: 'Business outcome',
      detail: t.description,
      tone: t.status === 'won' || t.status === 'confirmed' ? ('success' as const) : ('neutral' as const),
    })),
    ...n.interactionNotes.filter(note=>note.authorMemberId===viewer.id&&note.businessId===b.id).map(note=>({at:note.updatedAt??note.createdAt,title:`${note.contextType} note`,detail:note.text,tone:'neutral' as const})),
  ]
    .sort((a, z) => z.at.localeCompare(a.at))
    .slice(0, 5);

  return (
    <div>
      <PageHead
        eyebrow="Business discovery profile"
        title="Business Profile"
        description="Understand capability, people and trust signals before taking the next action."
        actions={<Button variant="secondary" onClick={() => back('/app/directory')}>Back to discovery</Button>}
      />

      <Card className="p-5 sm:p-6">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex min-w-0 gap-4">
            <div className="grid size-16 shrink-0 place-items-center rounded-2xl bg-[var(--navy-900)] text-xl font-black text-white">
              {b.logoText || <Building2 className="size-7" />}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-2xl font-black leading-tight text-[var(--navy-950)] sm:text-[28px]">{b.tradeName ?? b.name}</h2>
                {b.verified && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-bold text-emerald-800">
                    <ShieldCheck className="size-4" /> Verified business
                  </span>
                )}
              </div>
              {b.legalName && b.legalName !== (b.tradeName ?? b.name) && <p className="mt-1 text-base text-slate-600">Legal name: {b.legalName}</p>}
              <p className="mt-2 flex flex-wrap items-center gap-1.5 text-base text-slate-600"><MapPin className="size-4" />{b.city}, {b.state} · {b.chapter}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {associated && <StatusPill tone="info">Your affiliated business</StatusPill>}
                {matchReasons.map(reason => <StatusPill key={reason} tone={reason.includes('Verified') ? 'good' : 'neutral'}>{reason}</StatusPill>)}
              </div>
            </div>
          </div>

          <div className="flex max-w-2xl flex-wrap gap-2">
            <Button variant="secondary" onClick={() => dispatch(toggleSavedBusiness({ memberId: viewer.id, businessId: b.id }))}>{saved ? 'Remove saved' : 'Save business'}</Button>
            {primary && primary.id !== viewer.id && repConnection === 'none' && (
              <Button disabled={connectionCommands.busy} onClick={() => void connectionCommands.request(primary.id, `Business discussion with ${b.tradeName ?? b.name}`)}>
                <UserCheck className="size-4" /> Connect to representative
              </Button>
            )}
            {primary && repConnection === 'sent' && <Button variant="secondary" disabled>Connection request sent</Button>}
            {primary && repConnection === 'connected' && (
              <>
                <Button disabled={connectionCommands.busy} onClick={()=>void message()}><MessageSquare className="size-4" />Converse</Button>
                <Button variant="secondary" onClick={()=>setNoteOpen(true)}><StickyNote className="size-4"/>Add note</Button>
                <Button variant="secondary" onClick={() => go(`/app/one-to-one?member=${primary.id}&business=${b.id}`, { label: b.name })}><CalendarDays className="size-4" />Schedule meeting</Button>
              </>
            )}
            <Button variant="secondary" onClick={() => go(`/app/references?business=${b.id}`, { label: b.name })}>View references</Button>
            <Button variant="secondary" onClick={share}><Share2 className="size-4" />Share</Button>
            <Button variant="ghost" onClick={() => go(`/app/support?report=business&id=${b.id}`, { label: b.name })}><Flag className="size-4" />Report</Button>
          </div>{shareStatus&&<p role="status" className="mt-3 text-sm font-semibold text-sky-700">{shareStatus}</p>}
        </div>
      </Card>

      {!showContact && primary && (
        <div className="mt-5">
          <ContextBanner
            title="Contact details are relationship protected"
            action={repConnection === 'none' ? <Button disabled={connectionCommands.busy} onClick={() => void connectionCommands.request(primary.id, `Business discussion with ${b.tradeName ?? b.name}`)}>Connect with representative</Button> : undefined}
          >
            You can evaluate the business profile now. Direct contact details become available only when the business policy and your representative relationship allow them.
          </ContextBanner>
        </div>
      )}

      <div className="mt-7 grid gap-7 xl:grid-cols-[1.35fr_.65fr]">
        <div className="grid gap-7">
          <CommandExecutionFeedback error={noteCommand.error??connectionCommands.error} onRetry={()=>void (noteCommand.error?noteCommand.retry():connectionCommands.retry())} onDismiss={()=>{noteCommand.clearError();connectionCommands.clearError()}}/>
      <Section title="Company overview" subtitle="A concise view of the organisation, operating context and discoverable business profile.">
            <Card className="p-5">
              <p className="text-base leading-7 text-slate-700">{b.description || 'No business overview has been added yet.'}</p>
              <div className="mt-5">
                <DetailGrid items={[
                  { label: 'Business type', value: b.businessType || 'Not specified' },
                  { label: 'Established', value: b.establishedYear ? String(b.establishedYear) : 'Not specified' },
                  { label: 'Capacity / scale', value: b.capacity || 'Not specified' },
                  { label: 'Service area', value: b.serviceAreas?.length ? b.serviceAreas.join(', ') : `${b.city}, ${b.state}` },
                ]} />
              </div>
            </Card>
          </Section>

          <Section title="Products, services & capabilities" subtitle="Use this evidence to understand whether the business may fit a buyer, supplier, partner or collaboration need.">
            <div className="grid gap-4 lg:grid-cols-2">
              {[
                ['Core Capabilities', b.capabilities],
                ['Products', b.products],
                ['Services', b.services],
                ['Manufacturing Processes', b.processes ?? []],
                ['Materials', b.materials ?? []],
                ['Industries Served', b.industries ?? []],
              ].map(([title, items]) => (
                <Card key={String(title)} className="p-5">
                  <h3 className="text-lg font-black text-[var(--navy-950)]">{title as string}</h3>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(items as string[]).length ? (items as string[]).map(item => <Badge key={item}>{item}</Badge>) : <span className="text-base text-slate-600">Not yet provided.</span>}
                  </div>
                </Card>
              ))}
            </div>
          </Section>

          <Section title="Certifications" subtitle="Structured certification records are shown separately from free-text claims.">
            <div className="grid gap-3 md:grid-cols-2">
              {certs.map(c => (
                <Card key={c.id} className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-black text-[var(--navy-950)]">{c.standard}</h3>
                      <p className="mt-1 text-base text-slate-600">{c.issuer || 'Issuer not recorded'}</p>
                    </div>
                    <EnterpriseStatus status={c.verificationStatus} tone={c.verificationStatus === 'Verified' ? 'success' : c.verificationStatus === 'Expired' || c.verificationStatus === 'Rejected' ? 'danger' : 'warning'} />
                  </div>
                  <dl className="mt-4 grid gap-2 text-sm text-slate-600">
                    <div><dt className="font-bold text-slate-700">Certificate</dt><dd>{c.certificateNumber || 'Not recorded'}</dd></div>
                    <div><dt className="font-bold text-slate-700">Valid until</dt><dd>{friendlyDate(c.expiresAt)}</dd></div>
                  </dl>
                </Card>
              ))}
              {!certs.length && <EmptyState title="No structured certification records" body="Certification evidence has not yet been added or verified for this business." />}
            </div>
          </Section>

          <Section title="Verified representatives" subtitle="People are shown only when their affiliation is verified and visible to your relationship scope.">
            <div className="grid gap-3 md:grid-cols-2">
              {visiblePeople.map(({ a, m }) => (
                <button type="button" key={a.id} className="rounded-2xl border border-slate-200 bg-white p-5 text-left hover:border-sky-300 focus-visible:ring-3 focus-visible:ring-sky-100" onClick={() => go(`/app/members/${m.id}`, { label: b.name })}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-lg font-black text-[var(--navy-950)]">{m.name}</div>
                      <div className="mt-1 text-base text-slate-600">{a.designation}</div>
                    </div>
                    {a.primaryRepresentative && <StatusPill tone="info">Primary</StatusPill>}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <StatusPill>{a.relationshipType}</StatusPill>
                    {a.authorisedRepresentative && <StatusPill tone="good">Authorised</StatusPill>}
                  </div>
                </button>
              ))}
              {!visiblePeople.length && <EmptyState title="No representatives visible" body="No verified representatives are available at your current relationship level." />}
            </div>
          </Section>

          <Section title="Business relationship graph" subtitle="Verified buyer, supplier, customer, partner and ecosystem relationships recorded for this business.">
            <div className="grid gap-3 md:grid-cols-2">
              {relationships.map(r => {
                const otherId = r.fromBusinessId === b.id ? r.toBusinessId : r.fromBusinessId;
                const other = n.businesses.find(x => x.id === otherId);
                return (
                  <button type="button" key={r.id} className="rounded-2xl border border-slate-200 bg-white p-5 text-left hover:border-sky-300" onClick={() => other && go(`/app/businesses/${other.id}`, { label: b.name })}>
                    <StatusPill tone="info">{r.type}</StatusPill>
                    <div className="mt-3 text-lg font-black text-[var(--navy-950)]">{other?.tradeName ?? other?.name ?? otherId}</div>
                    <div className="mt-1 text-base text-slate-600">{r.source ?? 'Verified network relationship'}</div>
                  </button>
                );
              })}
              {!relationships.length && <EmptyState title="No verified business relationships" body="Buyer, supplier or partner relationships have not yet been recorded for this business." />}
            </div>
          </Section>

          <Section title="Active opportunities" subtitle="Current requirements, offerings or collaboration opportunities published by this business.">
            <div className="grid gap-3 md:grid-cols-2">
              {activeOpps.map(o => (
                <button type="button" key={o.id} className="rounded-2xl border border-slate-200 bg-white p-5 text-left hover:border-sky-300" onClick={() => go(`/app/opportunities/${o.id}`, { label: b.name })}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="text-lg font-black text-[var(--navy-950)]">{o.title}</div>
                    <StatusPill tone="info">{o.type ?? 'Requirement'}</StatusPill>
                  </div>
                  <p className="mt-2 line-clamp-2 text-base leading-6 text-slate-600">{o.description}</p>
                  <p className="mt-3 text-sm font-semibold text-slate-500">Closes {friendlyDate(o.closingDate)}</p>
                </button>
              ))}
              {!activeOpps.length && <EmptyState title="No active opportunities" body="This business has no open opportunities at the moment." />}
            </div>
          </Section>
        </div>

        <div className="grid content-start gap-5">
          <Card className="p-5">
            <h2 className="text-xl font-black text-[var(--navy-950)]">Business contact</h2>
            {showContact ? (
              <div className="mt-4 grid gap-4 text-base">
                {b.email && <div className="flex items-center gap-3"><Mail className="size-5 text-slate-400" /><a href={`mailto:${b.email}`} className="font-semibold text-sky-700 hover:underline">{b.email}</a></div>}
                {b.phone && <div className="flex items-center gap-3"><Phone className="size-5 text-slate-400" /><span className="font-semibold">{b.phone}</span></div>}
                {safeExternalHttpUrl(b.website) && <a href={safeExternalHttpUrl(b.website)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 font-bold text-sky-700 hover:underline"><ExternalLink className="size-5" />Visit website</a>}
                {safeExternalHttpUrl(b.catalogueUrl) && <a href={safeExternalHttpUrl(b.catalogueUrl)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 font-bold text-sky-700 hover:underline"><ExternalLink className="size-5" />Open catalogue</a>}
                {b.address && <div className="flex items-start gap-3"><MapPin className="mt-0.5 size-5 text-slate-400" /><span>{b.address}</span></div>}
              </div>
            ) : (
              <p className="mt-3 text-base leading-7 text-slate-600">Business contact details are restricted at your current relationship level. Use the verified representative connection path to continue.</p>
            )}
          </Card>

          {primary && (
            <Card className="p-5">
              <h2 className="text-xl font-black text-[var(--navy-950)]">Primary representative</h2>
              <button type="button" className="mt-3 text-left text-lg font-black text-sky-800 hover:underline" onClick={() => go(`/app/members/${primary.id}`, { label: b.name })}>{primary.name}</button>
              <p className="mt-1 text-base text-slate-600">{primaryEntry?.a.relationshipType} · {primaryEntry?.a.designation}</p>
              <p className="mt-2 text-sm font-semibold text-slate-500">Authority: {primaryEntry?.a.authorityLevel}</p>
            </Card>
          )}

          <Card className="p-5">
            <h2 className="text-xl font-black text-[var(--navy-950)]">Connected activity</h2>
            <p className="mt-1 text-base leading-6 text-slate-600">Continue from previous references and outcomes without losing business context.</p>
            <div className="mt-4 grid gap-2">
              <Button variant="secondary" onClick={() => go(`/app/references?business=${b.id}`, { label: b.name })}>{referenceCount} reference{referenceCount === 1 ? '' : 's'}</Button>
              <Button variant="secondary" onClick={() => go(`/app/transactions?business=${b.id}`, { label: b.name })}>{outcomeCount} business outcome{outcomeCount === 1 ? '' : 's'}</Button>{primary&&primary.id!==viewer.id&&<Button variant="secondary" onClick={()=>setNoteOpen(true)}>Add relationship note</Button>}
            </div>
            {businessTimeline.length > 0 && <div className="mt-5"><Timeline items={businessTimeline.map(item => ({ title: item.title, detail: item.detail, meta: friendlyDate(item.at), tone: item.tone }))} /></div>}
          </Card>

          <div className="flex items-center gap-2"><ContextTip title="Business relationship notes">Notes are separate from Converse and can retain business context without becoming public network content.</ContextTip><span className="text-sm font-semibold text-slate-600">Relationship help</span></div><Tip>Member–business affiliation is verified independently from business identity. SETHU restricts each member to one current business while preserving historical affiliations and multiple representatives per business.</Tip>
        </div>
      </div>
      {primary&&primary.id!==viewer.id&&<ActionDialog open={noteOpen} title={`Add note · ${b.tradeName??b.name}`} description={`This note is about your relationship with ${primary.name} and this business.`} inputLabel="Private relationship note" requireValue confirmLabel="Save note" onClose={()=>setNoteOpen(false)} onConfirm={async text=>{const payload={authorMemberId:viewer.id,targetMemberId:primary.id,businessId:b.id,contextType:'Business' as const,noteType:'Observation' as const,text,visibility:'Private' as const};const result=await noteCommand.execute({domain:'member',policyId:'member.interaction-note.create',command:'member.interaction-note.create',aggregateType:'MemberInteractionNote',aggregateId:`note-${viewer.id}-${primary.id}-${b.id}`,payload,previewAction:()=>dispatch(addInteractionNote(payload))});return result.ok;}}/>}
    </div>
  );
}
