import { apiClient } from './apiClient';

export interface SpecialisationDto {
  id: string;
  name: string;
}

export interface SegmentDto {
  id: string;
  name: string;
  specialisations: SpecialisationDto[];
}

export interface CategorySectorDto {
  id: string;
  name: string;
  segments: SegmentDto[];
}

export const categoriesApi = {
  getCategories: (signal?: AbortSignal) =>
    apiClient.get<CategorySectorDto[]>('/categories', { signal, retry: 'safe' })
};
