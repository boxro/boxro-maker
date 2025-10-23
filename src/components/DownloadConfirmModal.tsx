'use client';

import { Button } from '@/components/ui/button';

interface DownloadConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function DownloadConfirmModal({ isOpen, onClose, onConfirm }: DownloadConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-pink-900/20 backdrop-blur-md z-50 flex items-center justify-center">
      <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-6 max-w-sm w-full mx-6">
        <div className="text-center">
          <div className="flex justify-center mb-2">
            <div className="text-[30px]">✨</div>
          </div>
          <h3 className="text-lg font-semibold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
            도안을 다운로드하시겠어요?
          </h3>
          <p className="text-gray-900 mb-7" style={{fontSize: '14px'}}>
            이제 이 멋진 박스카가 현실로 태어날 차례예요! 🚗✨
          </p>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 border-2 border-gray-200 hover:bg-gray-50 hover:border-gray-300 rounded-full text-gray-900"
              style={{fontSize: '14px'}}
            >
              취소
            </Button>
            <Button
              onClick={onConfirm}
              className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-full"
              style={{fontSize: '14px'}}
            >
              다운로드
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
