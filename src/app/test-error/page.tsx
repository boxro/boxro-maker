'use client';

import { useState } from 'react';

export default function TestErrorPage() {
  const [shouldError, setShouldError] = useState(false);

  if (shouldError) {
    throw new Error('테스트용 오류입니다!');
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">
          오류 페이지 테스트
        </h1>
        <p className="text-gray-600 mb-6">
          아래 버튼을 클릭하면 오류 페이지가 표시됩니다.
        </p>
        <button
          onClick={() => setShouldError(true)}
          className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-medium"
        >
          오류 발생시키기
        </button>
      </div>
    </div>
  );
}
