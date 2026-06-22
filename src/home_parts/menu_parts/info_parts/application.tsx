// src/home_parts/menu_parts/info_parts/application.tsx
import { useState, useRef } from 'react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import emailjs from '@emailjs/browser';
import { useAuth } from '../../../logincontext';
import { SIDO_LIST } from '../../../lib/regions';
import { geocodeAddress } from '../../../lib/geocode';
import { SERVICE_CATEGORIES, TAG_GROUPS } from '../../../lib/companyFormOptions';

// ── 타입 ──────────────────────────────────────────────
type CoverageType = 'nationwide' | 'regional' | 'radius';

interface BaseFormInput {
  name: string;
  phone: string;
  businessRegNumber: string;
  shortDescription: string;
  description: string;
  weekdayOpen: string;
  weekdayClose: string;
  weekendOpen: string;
  weekendClose: string;
  website: string;
}

const INITIAL_FORM: BaseFormInput = {
  name: '',
  phone: '',
  businessRegNumber: '',
  shortDescription: '',
  description: '',
  weekdayOpen: '',
  weekdayClose: '',
  weekendOpen: '',
  weekendClose: '',
  website: '',
};

// ── 컴포넌트 ──────────────────────────────────────────
export default function Application() {
  const { user } = useAuth();

  const [form, setForm] = useState<BaseFormInput>(INITIAL_FORM);
  const [coverageType, setCoverageType] = useState<CoverageType | ''>('');
  const [selectedSido, setSelectedSido] = useState<string[]>([]);
  const [baseAddress, setBaseAddress] = useState('');
  const [serviceRadiusKm, setServiceRadiusKm] = useState(30);

  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const [weekdayClosed, setWeekdayClosed] = useState(false);
  const [weekendClosed, setWeekendClosed] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const msgRef = useRef<HTMLDivElement>(null);

  // ── 핸들러 ──────────────────────────────────────────
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const toggleSido = (sido: string) => {
    setSelectedSido((prev) =>
      prev.includes(sido) ? prev.filter((s) => s !== sido) : [...prev, sido],
    );
  };

  const toggleService = (item: string) => {
    setSelectedServices((prev) =>
      prev.includes(item) ? prev.filter((s) => s !== item) : [...prev, item],
    );
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setDone(false);

    // ── 공통 유효성 검사 ──
    if (!coverageType) {
      setErrorMsg('서비스 범위 유형을 선택해주세요.');
      msgRef.current?.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    if (
      !form.name || !form.phone || !form.businessRegNumber ||
      !form.shortDescription || !form.description
    ) {
      setErrorMsg('모든 필수 항목을 입력해 주세요.');
      msgRef.current?.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    if (selectedServices.length === 0) {
      setErrorMsg('제공 서비스를 1개 이상 선택해주세요.');
      msgRef.current?.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    if (selectedTags.length === 0) {
      setErrorMsg('태그를 1개 이상 선택해주세요.');
      msgRef.current?.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    // ── 운영시간 검사 ──
    if (!weekdayClosed) {
      if (!form.weekdayOpen || !form.weekdayClose) {
        setErrorMsg('평일 운영 시간을 입력해주세요.');
        msgRef.current?.scrollIntoView({ behavior: 'smooth' });
        return;
      }
      const wo = Number(form.weekdayOpen);
      const wc = Number(form.weekdayClose);
      const isValid = (h: number) => Number.isInteger(h) && h >= 0 && h <= 24;
      if (!isValid(wo) || !isValid(wc)) {
        setErrorMsg('운영 시간은 0 이상 24 이하의 정수로 입력해 주세요.');
        msgRef.current?.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }
    if (!weekendClosed) {
      if (!form.weekendOpen || !form.weekendClose) {
        setErrorMsg('주말 운영 시간을 입력해주세요.');
        msgRef.current?.scrollIntoView({ behavior: 'smooth' });
        return;
      }
      const wo = Number(form.weekendOpen);
      const wc = Number(form.weekendClose);
      const isValid = (h: number) => Number.isInteger(h) && h >= 0 && h <= 24;
      if (!isValid(wo) || !isValid(wc)) {
        setErrorMsg('운영 시간은 0 이상 24 이하의 정수로 입력해 주세요.');
        msgRef.current?.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }

    // ── 유형별 유효성 검사 ──
    if (coverageType === 'regional' && selectedSido.length === 0) {
      setErrorMsg('최소 1개 시/도를 선택해주세요.');
      msgRef.current?.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    if (coverageType === 'radius') {
      if (!baseAddress.trim()) {
        setErrorMsg('본사 주소를 입력해주세요.');
        msgRef.current?.scrollIntoView({ behavior: 'smooth' });
        return;
      }
      if (serviceRadiusKm < 10 || serviceRadiusKm > 100) {
        setErrorMsg('반경은 10~100km 사이로 설정해주세요.');
        msgRef.current?.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }

    setSubmitting(true);

    try {
      // ── 문서 ID 생성 ──
      const now = new Date();
      const dateStr = `${now.getFullYear()}_${String(now.getMonth() + 1).padStart(2, '0')}_${String(now.getDate()).padStart(2, '0')}`;
      const timeStr = `${String(now.getHours()).padStart(2, '0')}_${String(now.getMinutes()).padStart(2, '0')}`;
      const safeDocId = `${dateStr}_${timeStr}_${form.name.replace(/\s+/g, '')}`;

      // ── 커버리지 유형별 데이터 구성 ──
      let coverageData: Record<string, unknown> = { coverageType };

      if (coverageType === 'regional') {
        coverageData = { ...coverageData, coverageSido: selectedSido };
      }

      if (coverageType === 'radius') {
        let geoPoint = { lat: 0, lng: 0 };
        try {
          geoPoint = await geocodeAddress(baseAddress.trim());
        } catch {
          setErrorMsg('주소를 찾을 수 없습니다. 다시 확인해주세요.');
          setSubmitting(false);
          return;
        }
        coverageData = {
          ...coverageData,
          baseAddress: baseAddress.trim(),
          geoPoint,
          serviceRadiusKm,
        };
      }

      // ── Firestore 저장 ──
      const dcref = doc(db, 'businessApplications', safeDocId);
      await setDoc(dcref, {
        name: form.name,
        phone: form.phone,
        businessRegNumber: form.businessRegNumber,
        ownerEmail: user!.email,
        ownerUid: user!.uid,
        shortDescription: form.shortDescription,
        description: form.description,
        services: selectedServices,
        tags: selectedTags,
        website: form.website || '',
        ...coverageData,
        openingHours: {
          weekday: {
            open: weekdayClosed ? 0 : Number(form.weekdayOpen),
            close: weekdayClosed ? 0 : Number(form.weekdayClose),
            closed: weekdayClosed,
          },
          weekend: {
            open: weekendClosed ? 0 : Number(form.weekendOpen),
            close: weekendClosed ? 0 : Number(form.weekendClose),
            closed: weekendClosed,
          },
        },
        ratingAvg: 0,
        ratingCount: 0,
        reviewCount: 0,
        bookmarkCount: 0,
        status: 'submitted',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // ── EmailJS 전송 ──
      await emailjs.send(
        import.meta.env.VITE_EMAILJS_SERVICE_ID,
        import.meta.env.VITE_EMAILJS_TEMPLATE2_ID,
        { business_name: form.name, owner_email: user!.email, document_id: safeDocId },
        import.meta.env.VITE_EMAILJS_PUBLIC_KEY,
      );

      // ── 초기화 ──
      setDone(true);
      setForm(INITIAL_FORM);
      setCoverageType('');
      setSelectedSido([]);
      setBaseAddress('');
      setServiceRadiusKm(30);
      setSelectedServices([]);
      setSelectedTags([]);
      setWeekdayClosed(false);
      setWeekendClosed(true);
      msgRef.current?.scrollIntoView({ behavior: 'smooth' });

    } catch (err) {
      console.error(err);
      setErrorMsg('업체 신청 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
      msgRef.current?.scrollIntoView({ behavior: 'smooth' });
    } finally {
      setSubmitting(false);
    }
  };

  // ── 비로그인 화면 ──────────────────────────────────
  if (!user) {
    return (
      <div className="max-w-3xl mx-auto py-16 flex flex-col items-center justify-center gap-3 text-center">
        <div className="text-4xl">🔒</div>
        <p className="text-base font-medium text-gray-700">로그인한 유저만 이용 가능합니다.</p>
        <p className="text-sm text-gray-400">업체 등록 신청을 하려면 먼저 로그인해 주세요.</p>
      </div>
    );
  }

  // ── 메인 렌더 ──────────────────────────────────────
  return (
    <div className="max-w-3xl mx-auto" ref={msgRef}>
      <h2 className="text-xl font-bold text-gray-800 mb-4 pb-3 border-b border-gray-200">
        업체 등록 신청
      </h2>

      {done && (
        <div className="mb-4 rounded-lg bg-blue-50 border border-blue-200 p-4 text-sm text-blue-700">
          신청이 접수되었습니다. 검토 후 결과를 이메일로 안내드리겠습니다.
        </div>
      )}
      {errorMsg && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* 1. 업체 이름 / 연락처 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">업체 이름 *</label>
            <input
              type="text" name="name" required
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              placeholder="예: 에버그린 특수청소"
              value={form.name} onChange={handleChange}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">연락처 *</label>
            <input
              type="text" name="phone" required
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              placeholder="예: 010-0000-0000"
              value={form.phone} onChange={handleChange}
            />
          </div>
        </div>

        {/* 2. 사업자등록번호 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">사업자등록번호 *</label>
          <input
            type="text" name="businessRegNumber" required
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
            placeholder="예: 123-45-67890"
            value={form.businessRegNumber} onChange={handleChange}
          />
        </div>

        {/* 3. 대표 이메일 (읽기 전용) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">대표 이메일</label>
          <div className="w-full rounded border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500 select-none">
            {user.email}
          </div>
          <p className="mt-1 text-xs text-gray-400">로그인 계정 이메일이 자동으로 사용됩니다.</p>
        </div>

        {/* 사이트 주소 (선택) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">사이트 주소 (선택)</label>
          <input
            type="url" name="website"
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
            placeholder="예: https://example.com"
            value={form.website} onChange={handleChange}
          />
        </div>

        {/* 4. 서비스 범위 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">서비스 범위 *</label>
          <div className="grid grid-cols-3 gap-3">
            {(
              [
                { type: 'nationwide', icon: '🌐', title: '전국 출장', sub: '출장비 별도' },
                { type: 'regional',   icon: '📍', title: '광역권 선택', sub: '시/도 복수 선택' },
                { type: 'radius',     icon: '🏠', title: '거점 반경', sub: '주소 + 반경 설정' },
              ] as const
            ).map(({ type, icon, title, sub }) => (
              <button
                key={type}
                type="button"
                onClick={() => setCoverageType(type)}
                className={`rounded-lg border-2 p-4 text-center transition-colors duration-150 cursor-pointer ${
                  coverageType === type
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-blue-300'
                }`}
              >
                <div className="text-2xl mb-1">{icon}</div>
                <div className="text-sm font-medium text-gray-800">{title}</div>
                <div className="text-xs text-gray-400 mt-0.5">{sub}</div>
              </button>
            ))}
          </div>

          {coverageType === 'nationwide' && (
            <div className="mt-3 rounded-lg bg-blue-50 border border-blue-200 p-3 text-sm text-blue-700">
              ℹ️ 전국 어디든 출장 가능한 업체로 등록됩니다. 출장비는 고객과 직접 협의하세요.
            </div>
          )}

          {coverageType === 'regional' && (
            <div className="mt-3">
              <p className="text-sm text-gray-600 mb-2">서비스 가능 시/도 선택 (복수 선택 가능) *</p>
              <div className="flex flex-wrap gap-2">
                {SIDO_LIST.map((sido) => (
                  <button
                    key={sido}
                    type="button"
                    onClick={() => toggleSido(sido)}
                    className={`rounded-full px-3 py-1 text-sm font-medium border transition-colors duration-150 cursor-pointer ${
                      selectedSido.includes(sido)
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                    }`}
                  >
                    {sido}
                  </button>
                ))}
              </div>
            </div>
          )}

          {coverageType === 'radius' && (
            <div className="mt-3 space-y-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">본사(거점) 주소 *</label>
                <input
                  type="text"
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  placeholder="예: 경기도 수원시 영통구 매탄동"
                  value={baseAddress}
                  onChange={(e) => setBaseAddress(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-2">
                  서비스 반경 *&nbsp;
                  <span className="font-semibold text-blue-600">{serviceRadiusKm}km</span>
                </label>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-400">10km</span>
                  <input
                    type="range" min={10} max={100} step={1}
                    value={serviceRadiusKm}
                    onChange={(e) => setServiceRadiusKm(Number(e.target.value))}
                    className="flex-1 accent-blue-500"
                  />
                  <span className="text-xs text-gray-400">100km</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  ℹ️ 입력한 주소 기준 반경 내 의뢰만 수신됩니다.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* 5. 제공 서비스 (카테고리별 칩 선택) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            제공 서비스 * (1개 이상 선택)
          </label>
          {selectedServices.length === 0 && (
            <p className="text-xs text-red-400 mb-2">최소 1개 이상 선택해주세요.</p>
          )}
          <div className="space-y-4">
            {SERVICE_CATEGORIES.map(({ category, items }) => (
              <div key={category}>
                <p className="text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                  {category}
                </p>
                <div className="flex flex-wrap gap-2">
                  {items.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => toggleService(item)}
                      className={`rounded-full px-3 py-1 text-sm border transition-colors duration-150 cursor-pointer ${
                        selectedServices.includes(item)
                          ? 'bg-blue-500 text-white border-blue-500'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          {selectedServices.length > 0 && (
            <div className="mt-2 text-xs text-blue-600">
              선택됨: {selectedServices.join(', ')}
            </div>
          )}
        </div>

        {/* 6. 운영 시간 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            운영 시간 * (0~24시)
          </label>
          <div className="space-y-3">
            {/* 평일 */}
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="w-24 text-sm text-gray-700">평일</span>
                <input
                  type="checkbox" id="weekdayClosed"
                  checked={weekdayClosed}
                  onChange={(e) => setWeekdayClosed(e.target.checked)}
                  className="accent-blue-500"
                />
                <label htmlFor="weekdayClosed" className="text-sm text-gray-600 cursor-pointer">
                  평일 미운영
                </label>
              </div>
              {!weekdayClosed && (
                <div className="flex items-center gap-2 ml-24">
                  <input
                    type="number" name="weekdayOpen" min={0} max={24}
                    className="w-24 rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                    placeholder="0"
                    value={form.weekdayOpen} onChange={handleChange}
                  />
                  <span className="text-sm text-gray-600">시 ~</span>
                  <input
                    type="number" name="weekdayClose" min={0} max={24}
                    className="w-24 rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                    placeholder="24"
                    value={form.weekdayClose} onChange={handleChange}
                  />
                  <span className="text-sm text-gray-600">시</span>
                </div>
              )}
            </div>

            {/* 주말 */}
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="w-24 text-sm text-gray-700">주말·공휴일</span>
                <input
                  type="checkbox" id="weekendClosed"
                  checked={weekendClosed}
                  onChange={(e) => setWeekendClosed(e.target.checked)}
                  className="accent-blue-500"
                />
                <label htmlFor="weekendClosed" className="text-sm text-gray-600 cursor-pointer">
                  주말·공휴일 미운영
                </label>
              </div>
              {!weekendClosed && (
                <div className="flex items-center gap-2 ml-24">
                  <input
                    type="number" name="weekendOpen" min={0} max={24}
                    className="w-24 rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                    placeholder="0"
                    value={form.weekendOpen} onChange={handleChange}
                  />
                  <span className="text-sm text-gray-600">시 ~</span>
                  <input
                    type="number" name="weekendClose" min={0} max={24}
                    className="w-24 rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                    placeholder="24"
                    value={form.weekendClose} onChange={handleChange}
                  />
                  <span className="text-sm text-gray-600">시</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 7. 한 줄 소개 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">한 줄 소개 *</label>
          <input
            type="text" name="shortDescription" required
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
            placeholder="예: 인천·경기 고독사·유품정리 전문 24시 긴급 출동"
            value={form.shortDescription} onChange={handleChange}
          />
        </div>

        {/* 8. 상세 설명 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">상세 설명 *</label>
          <textarea
            name="description" rows={5} required
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-blue-500 resize-none"
            placeholder="업체 소개, 주요 서비스, 강점 등을 자세히 입력해 주세요."
            value={form.description} onChange={handleChange}
          />
        </div>

        {/* 9. 태그 (3그룹 구조화) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            태그 * (업체 특징 선택, 1개 이상)
          </label>
          <div className="space-y-5">
            {TAG_GROUPS.map(({ group, description, tags }) => (
              <div key={group}>
                <div className="mb-2">
                  <p className="text-xs font-bold text-gray-600 uppercase tracking-wide">
                    {group}
                  </p>
                  <p className="text-xs text-gray-400">{description}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`rounded-full px-3 py-1 text-sm border transition-colors duration-150 cursor-pointer ${
                        selectedTags.includes(tag)
                          ? 'bg-emerald-500 text-white border-emerald-500'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-emerald-400'
                      }`}
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          {selectedTags.length > 0 && (
            <div className="mt-3 text-xs text-emerald-600">
              선택됨: {selectedTags.map((t) => `#${t}`).join(' ')}
            </div>
          )}
        </div>

        <button
          type="submit" disabled={submitting}
          className="w-full rounded bg-blue-500 py-2 text-sm font-semibold text-white hover:bg-blue-600 disabled:opacity-50 transition-colors duration-200"
        >
          {submitting ? '제출 중...' : '업체 등록 신청 보내기'}
        </button>
      </form>
    </div>
  );
}
