import { z } from 'zod';
import type { CanonicalDomain } from '@/services/api/domainPersistence';

export type SortDirection='asc'|'desc';
export type FilterOperator='eq'|'neq'|'in'|'contains'|'prefix'|'gte'|'lte'|'between'|'exists';
export interface QueryFilter { field:string; operator:FilterOperator; value:unknown; }
export interface QuerySort { field:string; direction:SortDirection; }
export interface CursorRequest { cursor?:string; pageSize?:number; }
export interface QueryFacetRequest { field:string; limit?:number; }
export interface DomainQueryRequest {
  queryId:string;
  domain:CanonicalDomain;
  parameters?:Record<string,unknown>;
  filters?:QueryFilter[];
  sort?:QuerySort[];
  pagination?:CursorRequest;
  facets?:QueryFacetRequest[];
  fields?:string[];
  include?:string[];
  search?:string;
  timezone?:string;
  consistencyToken?:string;
}

export interface FacetBucket { value:string; count:number; }
export interface QueryFacet { field:string; buckets:FacetBucket[]; }
export interface CursorPageMeta {
  nextCursor?:string;
  previousCursor?:string;
  pageSize:number;
  returned:number;
  hasMore:boolean;
  totalEstimate?:number;
  consistencyToken?:string;
  generatedAt?:string;
}
export interface CursorPage<T> { items:T[]; page:CursorPageMeta; facets?:QueryFacet[]; }

export const cursorPageMetaSchema=z.object({
  nextCursor:z.string().optional(),previousCursor:z.string().optional(),pageSize:z.number().int().nonnegative(),returned:z.number().int().nonnegative(),hasMore:z.boolean(),totalEstimate:z.number().int().nonnegative().optional(),consistencyToken:z.string().optional(),generatedAt:z.string().optional(),
});
export const queryFacetSchema=z.object({field:z.string(),buckets:z.array(z.object({value:z.string(),count:z.number().int().nonnegative()}))});
export const cursorPageSchema=z.object({items:z.array(z.unknown()),page:cursorPageMetaSchema,facets:z.array(queryFacetSchema).optional()});

export function normalizePageSize(value:number|undefined,defaultSize=25,maxSize=100){
  if(value===undefined||!Number.isFinite(value))return defaultSize;
  return Math.max(1,Math.min(Math.trunc(value),maxSize));
}
