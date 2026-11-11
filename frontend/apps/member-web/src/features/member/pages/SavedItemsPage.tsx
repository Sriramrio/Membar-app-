import { useEffect, useState } from 'react';
import { Bookmark, RefreshCw } from 'lucide-react';
import { useAppDispatch, useAppSelector, useNetworkSlice } from '@/app/hooks';
import { Button } from '@/components/ui/Button';
import { EmptyState, OpportunityCard, BusinessCard, PageHead, Section, Tip } from '@/features/network/components/NetworkUI';
import { activeMemberId, affiliatedBusinessIdsForMember, opportunityVisibleToMember, savedBusinesses, savedOpportunities } from '@/features/network/selectors';
import { toggleSavedBusiness, toggleSavedOpportunity } from '@/features/network/networkSlice';
import { useMemberNavigation } from '@/features/member/navigation/useMemberNavigation';
import { savedItemsApi, type SavedItemRecord } from '@/services/api/savedItemsApi';

export default function SavedItemsPage() {
  const dispatch = useAppDispatch();
  const { go } = useMemberNavigation();
  const memberId = useAppSelector(activeMemberId);
  const n = useNetworkSlice(['affiliations', 'businesses', 'categories', 'members', 'opportunities', 'savedBusinessIdsByMember', 'savedOpportunityIdsByMember'] as const);

  const [dbSavedItems, setDbSavedItems] = useState<SavedItemRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLiveConnected, setIsLiveConnected] = useState(false);

  // Load bookmarks directly from backend PostgreSQL database
  const loadSavedItems = () => {
    setLoading(true);
    savedItemsApi.getSavedItems()
      .then((items) => {
        if (Array.isArray(items)) {
          setDbSavedItems(items);
          setIsLiveConnected(true);
          // Also sync any items from DB to Redux if missing
          items.forEach((item) => {
            if (item.itemType === 'business') {
              const currentSaved = n.savedBusinessIdsByMember[memberId] ?? [];
              if (!currentSaved.includes(item.itemId)) {
                dispatch(toggleSavedBusiness({ memberId, businessId: item.itemId }));
              }
            } else if (item.itemType === 'opportunity') {
              const currentSaved = n.savedOpportunityIdsByMember[memberId] ?? [];
              if (!currentSaved.includes(item.itemId)) {
                dispatch(toggleSavedOpportunity({ memberId, opportunityId: item.itemId }));
              }
            }
          });
        }
      })
      .catch(() => {
        // Fallback to local Redux if offline
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    loadSavedItems();
  }, [memberId]);

  // Combine DB item IDs and Redux item IDs
  const dbSavedBusinessIds = dbSavedItems.filter((x) => x.itemType === 'business').map((x) => x.itemId);
  const dbSavedOpportunityIds = dbSavedItems.filter((x) => x.itemType === 'opportunity').map((x) => x.itemId);

  const reduxSavedBusinessIds = savedBusinesses(n, memberId);
  const reduxSavedOpportunityIds = savedOpportunities(n, memberId);

  const combinedBusinessIds = Array.from(new Set([...reduxSavedBusinessIds, ...dbSavedBusinessIds]));
  const combinedOpportunityIds = Array.from(new Set([...reduxSavedOpportunityIds, ...dbSavedOpportunityIds]));

  const businesses = n.businesses.filter(
    (b) => combinedBusinessIds.includes(b.id) && (b.visibility !== 'hidden' || affiliatedBusinessIdsForMember(n, memberId).includes(b.id))
  );
  const opportunities = n.opportunities.filter(
    (o) => combinedOpportunityIds.includes(o.id) && opportunityVisibleToMember({ network: n }, o, memberId)
  );

  const inaccessibleCount = (combinedBusinessIds.length - businesses.length) + (combinedOpportunityIds.length - opportunities.length);
  const [actionError, setActionError] = useState<string | null>(null);

  // Handler that synchronises Redux and Backend Database API with rollback on failure (FE-002, SAVE-05)
  const handleToggleBusiness = async (businessId: string) => {
    setActionError(null);
    dispatch(toggleSavedBusiness({ memberId, businessId }));
    try {
      await savedItemsApi.toggleSavedItem('business', businessId);
      loadSavedItems();
    } catch {
      dispatch(toggleSavedBusiness({ memberId, businessId }));
      setActionError('Failed to update bookmark in database. Reverting change.');
    }
  };

  const handleToggleOpportunity = async (opportunityId: string) => {
    setActionError(null);
    dispatch(toggleSavedOpportunity({ memberId, opportunityId }));
    try {
      await savedItemsApi.toggleSavedItem('opportunity', opportunityId);
      loadSavedItems();
    } catch {
      dispatch(toggleSavedOpportunity({ memberId, opportunityId }));
      setActionError('Failed to update bookmark in database. Reverting change.');
    }
  };

  return (
    <div>
      <PageHead
        eyebrow={isLiveConnected ? "Database Bookmarks Connected" : undefined}
        title="Saved"
        description="Businesses and opportunities you intentionally saved for later, persisted securely in the database and validated against current access policies."
        actions={
          <Button variant="secondary" onClick={loadSavedItems} disabled={loading}>
            <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        }
      />

      {actionError && (
        <div role="alert" className="mb-4 flex items-center justify-between rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-800">
          <span>{actionError}</span>
          <button type="button" onClick={() => setActionError(null)} className="ml-2 font-bold text-red-600 hover:text-red-900">✕</button>
        </div>
      )}

      {inaccessibleCount > 0 && (
        <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-base text-amber-900">
          <strong>{inaccessibleCount} saved item{inaccessibleCount === 1 ? ' is' : 's are'} no longer available.</strong> It may have been hidden, removed, closed or moved outside your current network scope. The application does not reveal restricted record details.
        </div>
      )}

      <Section title="Businesses" subtitle={`${businesses.length} currently accessible saved business${businesses.length === 1 ? '' : 'es'}`}>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {businesses.map((b) => (
            <BusinessCard
              key={b.id}
              business={b}
              saved
              onSave={() => handleToggleBusiness(b.id)}
            />
          ))}
        </div>
        {!businesses.length && (
          <EmptyState
            title="No accessible saved businesses"
            body="Save useful businesses from the directory to find them quickly later."
            action={<Button onClick={() => go('/app/directory', { label: 'Saved' })}>Browse Directory</Button>}
          />
        )}
      </Section>

      <div className="mt-8">
        <Section title="Opportunities" subtitle={`${opportunities.length} currently accessible saved opportunit${opportunities.length === 1 ? 'y' : 'ies'}`}>
          <div className="grid gap-4 lg:grid-cols-3">
            {opportunities.map((o) => (
              <OpportunityCard
                key={o.id}
                opportunity={o}
                categoryName={n.categories.find((c) => c.id === o.categoryId)?.name ?? 'Category unavailable'}
                businessName={n.businesses.find((b) => b.id === o.businessId)?.name ?? 'Business unavailable'}
                saved
                onSave={() => handleToggleOpportunity(o.id)}
              />
            ))}
          </div>
          {!opportunities.length && (
            <EmptyState
              title="No accessible saved opportunities"
              body="Save requirements from the opportunity marketplace to review later."
              action={<Button variant="secondary" onClick={() => go('/app/opportunities', { label: 'Saved' })}>Explore Opportunities</Button>}
            />
          )}
        </Section>
      </div>

      <div className="mt-5">
        <Tip>
          <Bookmark className="mr-1 inline size-4" />
          Saving is a convenience bookmark, stored persistently in the database and re-evaluated against current visibility rules when this page opens.
        </Tip>
      </div>
    </div>
  );
}
