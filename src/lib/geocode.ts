// src/lib/geocode.ts
import { normalizeSido } from "./regionNormalize";

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface GeoResult {
  lat: number;
  lng: number;
  sido: string;
  fullAddress: string;
  displayName?: string;
  detailAddress?: string;
}

export const geocodeAddress = async (address: string): Promise<GeoPoint> => {
  const apiKey = import.meta.env.VITE_KAKAO_REST_API_KEY;
  const url = `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(address)}`;

  const res = await fetch(url, {
    headers: { Authorization: `KakaoAK ${apiKey}` },
  });

  if (!res.ok) throw new Error('Kakao API 요청 실패');

  const data = await res.json();
  const doc = data.documents?.[0];

  if (!doc) throw new Error('주소를 찾을 수 없습니다.');

  return {
    lat: parseFloat(doc.y),
    lng: parseFloat(doc.x),
  };
};

export const searchAddressWithMeta = async (query: string): Promise<GeoResult[]> => {
  const apiKey = import.meta.env.VITE_KAKAO_REST_API_KEY;
  const headers = { Authorization: `KakaoAK ${apiKey}` };

  // 1차: 주소 검색 (도로명·지번에 강함)
  const addrRes = await fetch(
    `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(query)}&size=5`,
    { headers },
  );
  const addrData = await addrRes.json();

  if (addrData.documents?.length > 0) {
    return addrData.documents.map((doc: any) => ({
      lat: parseFloat(doc.y),
      lng: parseFloat(doc.x),
      sido: normalizeSido(doc.address?.region_1depth_name ?? ''),
      fullAddress: doc.address_name,
      displayName: undefined,
      detailAddress: undefined,
    }));
  }

  // 2차: 키워드 검색 (아파트명·건물명에 강함)
  const kwRes = await fetch(
    `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(query)}&size=5`,
    { headers },
  );
  const kwData = await kwRes.json();

  return (kwData.documents ?? []).map((doc: any) => ({
    lat: parseFloat(doc.y),
    lng: parseFloat(doc.x),
    sido: normalizeSido(doc.address_name?.split(' ')[0] ?? ''),
    fullAddress: doc.address_name,
    displayName: doc.place_name ?? undefined,
    detailAddress: doc.place_name ? doc.address_name : undefined,
  }));
};

// Haversine 거리 계산
export const getDistanceKm = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};