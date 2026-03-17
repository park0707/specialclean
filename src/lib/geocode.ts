// src/lib/geocode.ts
export interface GeoPoint {
  lat: number;
  lng: number;
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
