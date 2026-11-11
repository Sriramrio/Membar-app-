import { toGuid } from '@/services/api/guidUtils';

const norm = (v: unknown) => String(v ?? '').trim().toLowerCase();

const safeGuid = (v?: string | null): string => {
    if (!v) return '';
    try {
        return norm(toGuid(v));
    } catch {
        return '';
    }
};

/**
 * Returns true when a directory listing belongs to the logged-in member.
 * Handles both slug ids (m-001) and GUIDs coming from the database.
 */
export function isOwnListing(
    listing: { memberId?: string | null; businessId?: string | null } | null | undefined,
    currentMemberId?: string | null,
    ownBusinessId?: string | null
): boolean {
    if (!listing) return false;

    const myMemberIds = new Set<string>();
    if (currentMemberId) {
        myMemberIds.add(norm(currentMemberId));
        const g = safeGuid(currentMemberId);
        if (g) myMemberIds.add(g);
    }

    const myBusinessIds = new Set<string>();
    if (ownBusinessId) {
        myBusinessIds.add(norm(ownBusinessId));
        const g = safeGuid(ownBusinessId);
        if (g) myBusinessIds.add(g);
    }

    const listingMemberId = norm(listing.memberId);
    const listingBusinessId = norm(listing.businessId);

    return (
        (!!listingMemberId && myMemberIds.has(listingMemberId)) ||
        (!!listingBusinessId && myBusinessIds.has(listingBusinessId))
    );
}

export function excludeOwnListings<T extends { memberId?: string | null; businessId?: string | null }>(
    list: T[],
    currentMemberId?: string | null,
    ownBusinessId?: string | null
): T[] {
    return list.filter((x) => !isOwnListing(x, currentMemberId, ownBusinessId));
}