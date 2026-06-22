// src/lib/filterBusinesses.ts

import { getDistanceKm } from './geocode';
import type { GeoResult } from './geocode';

export interface Business {
  id: string;
  name: string;
  shortDescription: string;
  phone: string;
  businessRegNumber: string;
  ownerEmail: string;
  coverageType: 'nationwide' | 'regional' | 'radius';
  coverageSido?: string[];
  geoPoint?: { lat: number; lng: number };
  serviceRadiusKm?: number;
  services: string[];
  tags: string[];
  openingHours?: {
    weekday: { open: number; close: number; closed: boolean };
    weekend: { open: number; close: number; closed: boolean };
  };
  ratingAvg: number;
  ratingCount: number;
  reviewCount: number;
  bookmarkCount: number;
  status: string;
}

// ── 위치 기반 필터 ────────────────────────────────────────
export const filterByLocation = (
  businesses: Business[],
  loc: GeoResult | null,
): Business[] => {
  if (!loc) return businesses; // 위치 미설정 시 전체 반환

  return businesses.filter((biz) => {
    if (biz.coverageType === 'nationwide') return true;

    if (biz.coverageType === 'regional') {
      return biz.coverageSido?.includes(loc.sido) ?? false;
    }

    if (biz.coverageType === 'radius') {
      if (!biz.geoPoint || !biz.serviceRadiusKm) return false;
      const dist = getDistanceKm(
        loc.lat, loc.lng,
        biz.geoPoint.lat, biz.geoPoint.lng,
      );
      return dist <= biz.serviceRadiusKm;
    }

    return false;
  });
};

// ── 서비스 종류 필터 ──────────────────────────────────────
// 선택한 서비스 중 하나라도 포함하면 통과 (OR 조건)
export const filterByServices = (
  businesses: Business[],
  selectedServices: string[],
): Business[] => {
  if (selectedServices.length === 0) return businesses;
  return businesses.filter((biz) =>
    selectedServices.some((s) => biz.services.includes(s)),
  );
};

// ── 태그 필터 ─────────────────────────────────────────────
// 선택한 태그 모두 포함해야 통과 (AND 조건)
export const filterByTags = (
  businesses: Business[],
  selectedTags: string[],
): Business[] => {
  if (selectedTags.length === 0) return businesses;
  return businesses.filter((biz) =>
    selectedTags.every((t) => biz.tags.includes(t)),
  );
};

// ── 텍스트 검색 필터 ──────────────────────────────────────
export const filterByText = (
  businesses: Business[],
  query: string,
): Business[] => {
  if (!query.trim()) return businesses;
  const q = query.toLowerCase();
  return businesses.filter((biz) => biz.name.toLowerCase().includes(q));
};

// ── 전체 필터 한번에 적용 ─────────────────────────────────
export const applyAllFilters = (
  businesses: Business[],
  filters: {
    loc: GeoResult | null;
    selectedServices: string[];
    selectedTags: string[];
    query: string;
  },
): Business[] => {
  return filterByText(
    filterByTags(
      filterByServices(
        filterByLocation(businesses, filters.loc),
        filters.selectedServices,
      ),
      filters.selectedTags,
    ),
    filters.query,
  );
};
