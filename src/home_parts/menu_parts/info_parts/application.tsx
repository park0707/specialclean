// src/pages/apply/BusinessApplyForm.tsx
import { useState,useRef } from 'react';
import { collection, doc,setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import emailjs from '@emailjs/browser';
import { useAuth } from '../../../logincontext';

// 업체 신청에 저장할 타입 (참고용)
export interface BusinessApplicationInput {
  name: string;
  regionWide: string;
  regionDetail: string;
  serviceAreas: string;
  services: string;       // 입력은 콤마 구분 문자열 → 저장 시 배열로 변환
  phone: string;
  shortDescription: string;
  description: string;
  serviceRadiusKm: string;
  tags: string;           // 콤마 구분 문자열 → 배열로 변환
  ownerEmail: string;     // 대표 이메일

  // 운영 시간 (평일/주말 0~24시)
  weekdayOpen: string;
  weekdayClose: string;
  weekendOpen: string;
  weekendClose: string;
}

export default function Application() {
  const { user } = useAuth();
  const [form, setForm] = useState<BusinessApplicationInput>({
    name: '',
    regionWide: '',
    regionDetail: '',
    serviceAreas: '',
    services: '',
    phone: '',
    shortDescription: '',
    description: '',
    serviceRadiusKm: '',
    tags: '',
    ownerEmail: '',
    weekdayOpen: '',
    weekdayClose: '',
    weekendOpen: '',
    weekendClose: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const msgRef = useRef<HTMLDivElement>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setDone(false);

    // 필수 값 체크 (JS 쪽에서도 한 번 더)
    if (
      !form.name ||
      !form.regionWide ||
      !form.phone ||
      !form.serviceAreas ||
      !form.services ||
      !form.shortDescription ||
      !form.description ||
      !form.serviceRadiusKm ||
      !form.tags ||
      !form.ownerEmail ||
      !form.weekdayOpen ||
      !form.weekdayClose ||
      !form.weekendOpen ||
      !form.weekendClose
    ) {
      setErrorMsg('모든 필수 항목을 입력해 주세요.');
      return;
    }

    // 숫자 변환 - 운영 반경
    const radius = Number(form.serviceRadiusKm || '0');
    if (form.serviceRadiusKm && Number.isNaN(radius)) {
      setErrorMsg('운영 반경(km)을 올바른 숫자로 입력해 주세요.');
      return;
    }

    // 숫자 변환 - 운영 시간 (0~24 정수)
    const weekdayOpen = Number(form.weekdayOpen || '0');
    const weekdayClose = Number(form.weekdayClose || '0');
    const weekendOpen = Number(form.weekendOpen || '0');
    const weekendClose = Number(form.weekendClose || '0');

    const isValidHour = (h: number) =>
      Number.isInteger(h) && h >= 0 && h <= 24;

    if (
      !isValidHour(weekdayOpen) ||
      !isValidHour(weekdayClose) ||
      !isValidHour(weekendOpen) ||
      !isValidHour(weekendClose)
    ) {
      setErrorMsg('운영 시간은 0 이상 24 이하의 정수로 입력해 주세요.');
      return;
    }

    setSubmitting(true);

    try {
      // 문자열 → 배열 변환
      const servicesArray = form.services
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      const tagsArray = form.tags
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      // Firestore에 신청 데이터 저장
    const now = new Date();
    const dateStr = `${now.getFullYear()}_${String(now.getMonth() + 1).padStart(2, '0')}_${String(now.getDate()).padStart(2, '0')}`;
    const timeStr = `${String(now.getHours()).padStart(2, '0')}_${String(now.getMinutes()).padStart(2, '0')}`;
    const safeDocId = `${dateStr}_${timeStr}_${form.name.replace(/\s+/g, '')}`;

    const dcref = doc(db, 'businessApplications', safeDocId);
    await setDoc(dcref, {
      name: form.name,
      regionWide: form.regionWide,
      regionDetail: form.regionDetail,
      serviceAreas: form.serviceAreas,
      services: servicesArray,
      openingHours: {
        weekday: { open: weekdayOpen, close: weekdayClose },
        weekend: { open: weekendOpen, close: weekendClose },
      },
      phone: form.phone,
      shortDescription: form.shortDescription,
      description: form.description,
      serviceRadiusKm: radius || 0,
      ratingAvg: 0,
      ratingCount: 0,
      reviewCount: 0,
      bookmarkCount: 0,
      tags: tagsArray,
      ownerEmail: form.ownerEmail ?? '',
      status: 'submitted',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    const dcid = safeDocId;
      await emailjs.send(
      import.meta.env.VITE_EMAILJS_SERVICE_ID,
      import.meta.env.VITE_EMAILJS_TEMPLATE2_ID, // 업체 신청용 템플릿 ID
      {
        business_name: form.name,
        owner_email: form.ownerEmail,
        document_id: dcid,
      },
      import.meta.env.VITE_EMAILJS_PUBLIC_KEY,
    );

      setDone(true);
      setForm({
        name: '',
        regionWide: '',
        regionDetail: '',
        serviceAreas: '',
        services: '',
        phone: '',
        shortDescription: '',
        description: '',
        serviceRadiusKm: '',
        tags: '',
        ownerEmail: '',
        weekdayOpen: '',
        weekdayClose: '',
        weekendOpen: '',
        weekendClose: '',
      });
      msgRef.current?.scrollIntoView({ behavior: 'smooth' });
    } catch (err) {
      console.error(err);
      setErrorMsg('업체 신청 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
      msgRef.current?.scrollIntoView({ behavior: 'smooth' });
    } finally {
      setSubmitting(false);
    }
  };
  if (!user) {
    return (
      <div className="max-w-3xl mx-auto py-16 flex flex-col items-center justify-center gap-3 text-center">
        <div className="text-4xl">🔒</div>
        <p className="text-base font-medium text-gray-700">
          로그인한 유저만 이용 가능합니다.
        </p>
        <p className="text-sm text-gray-400">
          업체 등록 신청을 하려면 먼저 로그인해 주세요.
        </p>
      </div>
    );
  }
  return (
    <div className="max-w-3xl mx-auto" ref={msgRef}>
      <h2 className="text-xl font-bold text-gray-800 mb-4 pb-3 border-b border-gray-200">
        업체 등록 신청
      </h2>

      {done && (
        <div className="mb-4 rounded-lg bg-blue-50 border border-blue-200 p-4 text-sm text-blue-700" >
          신청이 접수되었습니다. 검토 후 결과를 이메일로 안내드리겠습니다.
        </div>
      )}

      {errorMsg && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 기본 정보 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              업체 이름
            </label>
            <input
              type="text"
              name="name"
              required
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              placeholder="예: 청소초이스 특수청소"
              value={form.name}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              광역 지역
            </label>
            <input
              type="text"
              name="regionWide"
              required
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              placeholder="예: 서울 / 경기 / 부산"
              value={form.regionWide}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              세부 지역
            </label>
            <input
              type="text"
              name="regionDetail"
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              placeholder="예: 수원 영통구"
              value={form.regionDetail}
              required
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              연락처
            </label>
            <input
              type="text"
              name="phone"
              required
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              placeholder="예: 010-0000-0000"
              value={form.phone}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* 서비스 가능 지역 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            서비스 가능 지역 설명
          </label>
          <input
            type="text"
            name="serviceAreas"
            required
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
            placeholder="예: 수원 영통구 및 인근 10km"
            value={form.serviceAreas}
            onChange={handleChange}
          />
        </div>

        {/* 제공 서비스 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            제공 서비스 (쉼표로 구분)
          </label>
          <input
            type="text"
            name="services"
            required
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
            placeholder="예: 유품정리, 쓰레기집 청소, 화재 복구"
            value={form.services}
            onChange={handleChange}
          />
        </div>

        {/* 운영 시간 (평일 / 주말·공휴일) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            운영 시간 (0~24시, 24시간 운영이면 0~24로 입력, 미 운영시 0~0)
          </label>

          <div className="space-y-2">
            {/* 평일 */}
            <div className="flex flex-col md:flex-row md:items-center gap-2">
              <span className="w-24 text-sm text-gray-700">평일</span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  name="weekdayOpen"
                  min={0}
                  max={24}
                  required
                  className="w-24 rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  placeholder="0"
                  value={form.weekdayOpen}
                  onChange={handleChange}
                />
                <span className="text-sm text-gray-600">시 ~</span>
                <input
                  type="number"
                  name="weekdayClose"
                  min={0}
                  max={24}
                  required
                  className="w-24 rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  placeholder="24"
                  value={form.weekdayClose}
                  onChange={handleChange}
                />
                <span className="text-sm text-gray-600">시</span>
              </div>
            </div>

            {/* 주말 · 공휴일 */}
            <div className="flex flex-col md:flex-row md:items-center gap-2">
              <span className="w-24 text-sm text-gray-700">주말·공휴일</span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  name="weekendOpen"
                  min={0}
                  max={24}
                  required
                  className="w-24 rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  placeholder="0"
                  value={form.weekendOpen}
                  onChange={handleChange}
                />
                <span className="text-sm text-gray-600">시 ~</span>
                <input
                  type="number"
                  name="weekendClose"
                  min={0}
                  max={24}
                  required
                  className="w-24 rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  placeholder="24"
                  value={form.weekendClose}
                  onChange={handleChange}
                />
                <span className="text-sm text-gray-600">시</span>
              </div>
            </div>
          </div>
        </div>

        {/* 운영 반경 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            운영 반경 (km)
          </label>
          <input
            type="text"
            name="serviceRadiusKm"
            required
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
            placeholder="예: 10"
            value={form.serviceRadiusKm}
            onChange={handleChange}
          />
        </div>

        {/* 소개/태그 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            한 줄 소개
          </label>
          <input
            type="text"
            name="shortDescription"
            required
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
            placeholder="예: 수원 지역 특수청소·유품정리 전문 24시 출동"
            value={form.shortDescription}
            onChange={handleChange}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            상세 설명
          </label>
          <textarea
            name="description"
            rows={5}
            required
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-blue-500 resize-none"
            placeholder="업체 소개, 주요 서비스, 강점 등을 자세히 입력해 주세요."
            value={form.description}
            onChange={handleChange}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            태그 (쉼표로 구분)
          </label>
          <input
            type="text"
            name="tags"
            required
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
            placeholder="예: 고독사, 긴급 출동, 여성 팀"
            value={form.tags}
            onChange={handleChange}
          />
        </div>

        {/* 대표 이메일 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            대표 이메일
          </label>
          <input
            type="email"
            name="ownerEmail"
            required
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
            placeholder="예: company@example.com"
            value={form.ownerEmail}
            onChange={handleChange}
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded bg-blue-500 py-2 text-sm font-semibold text-white hover:bg-blue-600 disabled:opacity-50"
        >
          {submitting ? '제출 중...' : '업체 등록 신청 보내기'}
        </button>
      </form>
    </div>
  );
}
