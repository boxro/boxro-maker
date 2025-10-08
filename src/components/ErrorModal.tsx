'use client';

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface ErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
}

export default function ErrorModal({ 
  isOpen, 
  onClose, 
  title = "오류가 발생했습니다",
  message = "예상치 못한 오류가 발생했습니다.\n페이지를 새로고침하거나 다시 시도해주세요."
}: ErrorModalProps) {
  const router = useRouter();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-red-900/20 via-orange-900/20 to-yellow-900/20 backdrop-blur-md z-50 flex items-center justify-center">
      <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-6 max-w-sm w-full mx-6">
        <div className="text-center">
          <div className="text-2xl mb-4">⚠️</div>
          <h3 className="text-[18px] font-semibold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent mb-2">
            {title}
          </h3>
          <p className="text-gray-600 text-[14px] mb-4 whitespace-pre-line">
            {message}
          </p>
          <div className="flex gap-3">
            <Button
              onClick={onClose}
              className="flex-1 bg-white/80 backdrop-blur-sm border-2 border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 rounded-full text-[14px] text-gray-700"
            >
              다시 시도
            </Button>
            <Button
              onClick={() => {
                onClose();
                router.push('/');
              }}
              className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white transition-all duration-200 rounded-full text-[14px]"
            >
              홈으로 이동
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

