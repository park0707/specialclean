import { useState, useEffect, useMemo } from 'react';
import {
  collection,
  query,
  where,
  getDocs,
  type QueryConstraint,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { FilterState, SortKey, SortDir } from '../searchcontext';

export interface Business {
  id: string;
  name: string;
  shortDescription: string;
  regionWide: string;
  regionDetail: string;
  tags: string[];
  services: string[];
  reviewCount: number;
  bookmarkCount: number;
  ratingAvg: number;
  openingHours: {
    weekday: { open: number; close: number };
    weekend: { open: number; close: number };
  };
  // price 필드는 아직 없음 — 향후 추가 시 여기에 포함
}

// Firestore 컬렉션 이름 — application.tsx에서 'businessApplications' 사용
const COLLECTION = 'businessApplications';

/**
 * Firestore에서 업체를 조회하고, 클라이언트에서 추가 필터 + 정렬을 수행하는 훅.
 *
 * Firestore의 array-contains-any는 한 쿼리에 하나만 사용 가능하므로,
 * 서버에서 가능한 만큼 좁히고 나머지는 클라이언트에서 필터링합니다.
 */
export function useBusinessSearch(text: string, filter: FilterState) {
  const [allDocs, setAllDocs] = useState<Business[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- 1) Firestore 쿼리 (region 필터는 서버에서 가능) ---
  useEffect(() => {
    let cancelled = false;

    async function fetchBusinesses() {
      setLoading(true);
      setError(null);
      try {
        const constraints: QueryConstraint[] = [];

        // 승인된 업체만 (status == 'approved') — 아직 승인 프로세스가 없을 수 있으므로 주석 처리
        // constraints.push(where('status', '==', 'approved'));

        // 지역 서버 필터: regionWide가 있으면 서버에서 좁힘
        if (filter.regionWide) {
          constraints.push(where('regionWide', '==', filter.regionWide));
        }

        // 분류 서버 필터: Firestore array-contains-any (최대 30개, 10개씩)
        // tags와 services 양쪽을 동시에 서버에서 필터할 수 없으므로 tags만 서버, services는 클라이언트
        if (filter.categories.length > 0 && filter.categories.length <= 10) {
          constraints.push(
            where('tags', 'array-contains-any', filter.categories),
          );
        }

        const q =
          constraints.length > 0
            ? query(collection(db, COLLECTION), ...constraints)
            : collection(db, COLLECTION);

        const snap = await getDocs(q);
        if (cancelled) return;

        const docs: Business[] = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            name: data.name ?? '',
            shortDescription: data.shortDescription ?? '',
            regionWide: data.regionWide ?? '',
            regionDetail: data.regionDetail ?? '',
            tags: Array.isArray(data.tags) ? data.tags : [],
            services: Array.isArray(data.services) ? data.services : [],
            reviewCount: data.reviewCount ?? 0,
            bookmarkCount: data.bookmarkCount ?? 0,
            ratingAvg: data.ratingAvg ?? 0,
            openingHours: data.openingHours ?? {
              weekday: { open: 0, close: 0 },
              weekend: { open: 0, close: 0 },
            },
          };
        });

        setAllDocs(docs);
      } catch (err) {
        if (!cancelled) {
          console.error('Business search error:', err);
          setError('업체 정보를 불러오지 못했습니다.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchBusinesses();
    return () => {
      cancelled = true;
    };
    // regionWide와 categories가 바뀔 때 재쿼리
  }, [filter.regionWide, filter.categories]);

  // --- 2) 클라이언트 필터 + 정렬 ---
  const results = useMemo(() => {
    let list = [...allDocs];

    // 텍스트 검색 (name, shortDescription, tags, services)
    const q = text.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (b) =>
          b.name.toLowerCase().includes(q) ||
          b.shortDescription.toLowerCase().includes(q) ||
          b.tags.some((t) => t.toLowerCase().includes(q)) ||
          b.services.some((s) => s.toLowerCase().includes(q)),
      );
    }

    // regionDetail 클라이언트 필터
    if (filter.regionDetail) {
      const rd = filter.regionDetail.toLowerCase();
      list = list.filter((b) => b.regionDetail.toLowerCase().includes(rd));
    }

    // 분류: categories가 11개 이상이면 서버 쿼리 제한으로 클라이언트 필터 필요
    // 또한 services 매칭도 클라이언트에서
    if (filter.categories.length > 0) {
      list = list.filter((b) => {
        const combined = [...b.tags, ...b.services];
        return filter.categories.some((c) => combined.includes(c));
      });
    }

    // 작업 시간 필터
    if (filter.only24h) {
      list = list.filter((b) => {
        const wd = b.openingHours.weekday;
        return (wd.open === 0 && (wd.close === 0 || wd.close === 24));
      });
    } else {
      if (filter.timeStart !== null) {
        list = list.filter(
          (b) => b.openingHours.weekday.open <= filter.timeStart!,
        );
      }
      if (filter.timeEnd !== null) {
        list = list.filter(
          (b) => b.openingHours.weekday.close >= filter.timeEnd!,
        );
      }
    }

    // 가격 필터 — Firestore에 price 필드가 없으므로 현재는 no-op
    // TODO: price 필드가 추가되면 아래 주석 해제
    // if (filter.priceMin !== null) {
    //   list = list.filter((b) => (b.price ?? 0) >= filter.priceMin!);
    // }
    // if (filter.priceMax !== null) {
    //   list = list.filter((b) => (b.price ?? 0) <= filter.priceMax!);
    // }

    // 정렬
    list = sortBusinesses(list, filter.sortKey, filter.sortDir);

    return list;
  }, [allDocs, text, filter]);

  return { results, loading, error };
}

function sortBusinesses(
  list: Business[],
  key: SortKey,
  dir: SortDir,
): Business[] {
  return list.sort((a, b) => {
    const av = a[key];
    const bv = b[key];
    return dir === 'asc' ? av - bv : bv - av;
  });
}
