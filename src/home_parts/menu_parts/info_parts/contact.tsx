// src/pages/info/Contact.tsx
import { useRef, useState } from 'react';
import emailjs from '@emailjs/browser';
import Application from './application';

interface Props {
  activeSection: string;
}

export default function ContactPage({ activeSection }: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formRef.current) return;

    setSending(true);
    setErrorMsg('');

    try {
      await emailjs.sendForm(
        import.meta.env.VITE_EMAILJS_SERVICE_ID,
        import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
        formRef.current,
        import.meta.env.VITE_EMAILJS_PUBLIC_KEY,
      );
      setSubmitted(true);
      formRef.current.reset(); // 폼 초기화
    } catch (err) {
      console.error(err);
      setErrorMsg('문의 전송 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      setSending(false);
    }
  };

  if (activeSection === '문의 안내') {
    return (
      <div>
        <h2 className="text-xl font-bold text-gray-800 mb-4 pb-3 border-b border-gray-200">
          문의 안내
        </h2>
        <p className="text-sm text-gray-600 leading-7 whitespace-pre-line">
          {`서비스 이용 중 불편한 점, 업체 정보 오류 신고, 개선 제안 등 어떤 내용이든 편하게 문의해 주세요.

• 운영 이메일: forwork1817@gmail.com
• 답변은 영업일 기준 1~3일 이내에 이메일로 드립니다.
• 스팸성 문의나 욕설이 포함된 내용은 처리되지 않을 수 있습니다.

또는 아래 문의 양식을 통해 직접 보내주셔도 됩니다.`}
        </p>
      </div>
    );
  }

  if (activeSection === '문의 양식') {
    return (
      <div>
        <h2 className="text-xl font-bold text-gray-800 mb-4 pb-3 border-b border-gray-200">
          문의 양식
        </h2>

        {submitted ? (
          <div className="rounded-lg bg-blue-50 border border-blue-200 p-6 text-center">
            <p className="text-blue-600 font-semibold text-sm">
              문의가 접수되었습니다. 빠른 시일 내에 답변 드리겠습니다.
            </p>
            <button
              className="mt-4 text-sm text-blue-500 underline cursor-pointer"
              onClick={() => setSubmitted(false)}
            >
              새 문의 작성하기
            </button>
          </div>
        ) : (
          // ref를 form에 직접 연결
          <form ref={formRef} onSubmit={handleSubmit} className="space-y-4 max-w-lg">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                이름
              </label>
              {/* name 속성이 EmailJS 템플릿 변수명과 일치해야 함 */}
              <input
                type="text"
                name="from_name"
                required
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                placeholder="홍길동"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                이메일
              </label>
              <input
                type="email"
                name="from_email"
                required
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                placeholder="example@email.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                제목
              </label>
              <input
                type="text"
                name="subject"
                required
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                placeholder="문의 제목을 입력해 주세요."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                문의 내용
              </label>
              <textarea
                name="message"
                required
                rows={6}
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-blue-500 resize-none"
                placeholder="문의하실 내용을 입력해 주세요."
              />
            </div>

            {errorMsg && (
              <p className="text-sm text-red-500">{errorMsg}</p>
            )}

            <button
              type="submit"
              disabled={sending}
              className="w-full rounded bg-blue-500 py-2 text-sm font-semibold text-white hover:bg-blue-600 disabled:opacity-50"
            >
              {sending ? '전송 중...' : '문의 보내기'}
            </button>
          </form>
        )}
      </div>
    );
  }
  if (activeSection === '업체 신청') {
    return <Application />;
  }

  return null;
}
