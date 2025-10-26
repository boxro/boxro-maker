"use client";

import React, { useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface HomeCard {
  id: string;
  title: string;
  cardDescription?: string;
  description?: string;
  cardThumbnail?: string;
  url?: string;
  openInNewTab?: boolean;
  showOnHome?: boolean;
  homeOrder?: number;
  isPublished?: boolean;
  createdAt: any;
  homeCardBackgroundColor?: string;
  backgroundColor?: string;
}

interface HomeCardManagementProps {
  // Form states
  homeCardTitle: string;
  setHomeCardTitle: (title: string) => void;
  homeCardDescription: string;
  setHomeCardDescription: (description: string) => void;
  homeCardThumbnail: string;
  setHomeCardThumbnail: (thumbnail: string) => void;
  homeCardUrl: string;
  setHomeCardUrl: (url: string) => void;
  homeCardOpenInNewTab: boolean;
  setHomeCardOpenInNewTab: (openInNewTab: boolean) => void;
  homeCardTitleColor: string;
  setHomeCardTitleColor: (color: string) => void;
  homeCardDescriptionColor: string;
  setHomeCardDescriptionColor: (color: string) => void;
  homeCardTextPosition: number;
  setHomeCardTextPosition: (position: number) => void;
  homeCardBackgroundColor: string;
  setHomeCardBackgroundColor: (color: string) => void;
  
  // Edit states
  isEditMode: boolean;
  addingCard: boolean;
  deletingCard: string | null;
  editingCard: string | null;
  
  // Functions
  addHomeCard: () => Promise<void>;
  saveEditCard: () => Promise<void>;
  startEditCard: (card: HomeCard) => void;
  deleteHomeCard: (cardId: string) => Promise<void>;
  cancelEdit: () => void;
  resetForm: () => void;
  
  // List states and functions
  homeCardList: HomeCard[];
  getFilteredHomeCardList: () => HomeCard[];
  homeCardFilterDateFrom: string;
  setHomeCardFilterDateFrom: (date: string) => void;
  homeCardFilterDateTo: string;
  setHomeCardFilterDateTo: (date: string) => void;
  homeCardFilterSearch: string;
  setHomeCardFilterSearch: (search: string) => void;
  resetHomeCardFilters: () => void;
}

const HomeCardManagement: React.FC<HomeCardManagementProps> = ({
  homeCardTitle,
  setHomeCardTitle,
  homeCardDescription,
  setHomeCardDescription,
  homeCardThumbnail,
  setHomeCardThumbnail,
  homeCardUrl,
  setHomeCardUrl,
  homeCardOpenInNewTab,
  setHomeCardOpenInNewTab,
  homeCardTitleColor,
  setHomeCardTitleColor,
  homeCardDescriptionColor,
  setHomeCardDescriptionColor,
  homeCardTextPosition,
  setHomeCardTextPosition,
  homeCardBackgroundColor,
  setHomeCardBackgroundColor,
  isEditMode,
  addingCard,
  deletingCard,
  editingCard,
  addHomeCard,
  saveEditCard,
  startEditCard,
  deleteHomeCard,
  cancelEdit,
  resetForm,
  homeCardList,
  getFilteredHomeCardList,
  homeCardFilterDateFrom,
  setHomeCardFilterDateFrom,
  homeCardFilterDateTo,
  setHomeCardFilterDateTo,
  homeCardFilterSearch,
  setHomeCardFilterSearch,
  resetHomeCardFilters,
}) => {
  // 파일 입력 필드 ref
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // 썸네일 상태 디버깅
  useEffect(() => {
    console.log('홈카드 썸네일 상태 변경:', homeCardThumbnail);
  }, [homeCardThumbnail]);

  // 썸네일이 초기화될 때 파일 입력 필드도 초기화
  useEffect(() => {
    if (!homeCardThumbnail && fileInputRef.current) {
      fileInputRef.current.value = '';
      console.log('파일 입력 필드 초기화됨');
    }
  }, [homeCardThumbnail]);

  // 홈카드 썸네일 압축 함수 (400px, 1.0 품질)
  const compressHomeCardThumbnail = (file: File, maxWidth: number = 400, quality: number = 1.0): Promise<string> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onerror = (error) => {
        console.error('❌ 이미지 로드 실패:', error);
        reject(new Error('이미지 파일을 읽을 수 없습니다. 지원되지 않는 형식이거나 손상된 파일일 수 있습니다.'));
      };
      
      img.onload = () => {
        try {
        // 400px로 강제 리사이즈 (가로 기준)
        const maxWidth = 400;
        const ratio = maxWidth / img.width;
        canvas.width = maxWidth;
        canvas.height = img.height * ratio;
        
        // 이미지 그리기
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        // 투명도가 있는 이미지인지 확인
        const imageData = ctx?.getImageData(0, 0, canvas.width, canvas.height);
        const hasTransparency = imageData?.data.some((_, index) => index % 4 === 3 && imageData.data[index] < 255);
        
        // 투명도가 있으면 PNG, 없으면 JPG 사용 (원본 포맷 유지)
        const format = hasTransparency ? 'image/png' : 'image/jpeg';
        
        // 1.0 품질로 압축 (원본 품질 유지)
        const dataUrl = canvas.toDataURL(format, 1.0);
        
        console.log(`홈카드 압축 완료: 품질 1.0, 크기 ${(dataUrl.length / 1024).toFixed(1)}KB`);
        
        resolve(dataUrl);
        } catch (error) {
          console.error('❌ 압축 처리 중 오류:', error);
          reject(new Error(`이미지 압축 중 오류가 발생했습니다: ${error.message}`));
        }
      };
      
      img.src = URL.createObjectURL(file);
    });
  };
  return (
    <>
      <div className="space-y-4">
        <div className="bg-white/95 backdrop-blur-sm border border-white/20 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {isEditMode ? '홈카드 수정' : '홈카드 추가'}
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* 입력 폼 */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-2">카드 제목</label>
                <div className="bg-transparent p-4 rounded-lg border border-gray-300">
                  <input 
                    type="text" 
                    value={homeCardTitle || ''}
                    onChange={(e) => setHomeCardTitle(e.target.value)}
                    placeholder="홈카드에 표시될 제목"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-[14px] mb-3 bg-white"
                  />
                  <div className="flex gap-2">
                    <input 
                      type="color" 
                      value={homeCardTitleColor || '#ffffff'}
                      onChange={(e) => setHomeCardTitleColor(e.target.value)}
                      className="w-[58px] h-10 border-0 rounded-md cursor-pointer"
                    />
                    <input 
                      type="text" 
                      value={homeCardTitleColor || '#ffffff'}
                      onChange={(e) => setHomeCardTitleColor(e.target.value)}
                      placeholder="#ffffff"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-[14px] bg-white"
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-2">카드 설명</label>
                <div className="bg-transparent p-4 rounded-lg border border-gray-300">
                  <textarea 
                    value={homeCardDescription || ''}
                    onChange={(e) => setHomeCardDescription(e.target.value)}
                    placeholder="홈카드에 표시될 설명"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-[14px] mb-2 bg-white"
                  />
                  <div className="flex gap-2">
                    <input 
                      type="color" 
                      value={homeCardDescriptionColor || '#ffffff'}
                      onChange={(e) => setHomeCardDescriptionColor(e.target.value)}
                      className="w-[58px] h-10 border-0 rounded-md cursor-pointer"
                    />
                    <input 
                      type="text" 
                      value={homeCardDescriptionColor || '#ffffff'}
                      onChange={(e) => setHomeCardDescriptionColor(e.target.value)}
                      placeholder="#ffffff"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-[14px] bg-white"
                    />
                  </div>
                </div>
                
                {/* 텍스트 위치 조절 */}
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-800 mb-2">텍스트 위치</label>
                  <div className="bg-transparent p-4 rounded-lg border border-gray-300">
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-600 w-12">위</span>
                      <input
                        type="range"
                        min="0"
                        max="75"
                        value={homeCardTextPosition}
                        onChange={(e) => setHomeCardTextPosition(Number(e.target.value))}
                        className="flex-1 h-2 appearance-none cursor-pointer"
                        style={{
                          background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(homeCardTextPosition / 75) * 100}%, #e5e7eb ${(homeCardTextPosition / 75) * 100}%, #e5e7eb 100%)`,
                          borderRadius: '8px'
                        }}
                      />
                      <span className="text-sm text-gray-600 w-12">아래</span>
                    </div>
                    <div className="text-center mt-2">
                      <span className="text-xs text-gray-500">{homeCardTextPosition}%</span>
                    </div>
                  </div>
                </div>
                
                {/* 카드 배경 색상 */}
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-800 mb-2">카드 배경 색상</label>
                  <div className="bg-transparent p-4 rounded-lg border border-gray-300">
                    <div className="flex gap-2">
                      <input 
                        type="color" 
                        value={homeCardBackgroundColor || '#3b82f6'}
                        onChange={(e) => setHomeCardBackgroundColor(e.target.value)}
                        className="w-[58px] h-10 border-0 rounded-md cursor-pointer"
                      />
                      <input 
                        type="text" 
                        value={homeCardBackgroundColor || '#3b82f6'}
                        onChange={(e) => setHomeCardBackgroundColor(e.target.value)}
                        placeholder="#3b82f6"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-[14px] bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => setHomeCardBackgroundColor('transparent')}
                        className={`px-3 py-2 text-sm rounded-md border flex-shrink-0 ${
                          homeCardBackgroundColor === 'transparent' 
                            ? 'bg-blue-100 border-blue-300 text-blue-700' 
                            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        투명
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-2">카드 썸네일 (홈카드 배경 이미지)</label>
                <div className="flex gap-2">
                  <input 
                    ref={fileInputRef}
                    type="file" 
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        try {
                          // 이미지 압축 적용
                          const compressedImage = await compressHomeCardThumbnail(file, 400, 1.0);
                          setHomeCardThumbnail(compressedImage);
                        } catch (error) {
                          console.error('홈카드 썸네일 압축 실패:', error);
                          alert('이미지 압축 중 오류가 발생했습니다.');
                        }
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-[14px] bg-white"
                  />
                  {homeCardThumbnail && (
                    <button
                      type="button"
                      onClick={() => {
                        setHomeCardThumbnail('');
                        if (fileInputRef.current) {
                          fileInputRef.current.value = '';
                        }
                      }}
                      className="px-3 py-2 bg-sky-500 hover:bg-sky-600 text-white text-sm rounded-md transition-colors whitespace-nowrap"
                    >
                      삭제
                    </button>
                  )}
                </div>
              </div>
              {/* 카드 링크 URL 섹션 */}
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-2">카드 링크 URL</label>
                <div className="bg-transparent p-4 rounded-lg border border-gray-300">
                  <div className="mb-3">
                    <input 
                      type="url" 
                      value={homeCardUrl || ''}
                      onChange={(e) => setHomeCardUrl(e.target.value)}
                      placeholder="예: /gallery, /story, https://example.com"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-[14px] bg-white"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      id="openInNewTab"
                      checked={homeCardOpenInNewTab || false}
                      onChange={(e) => setHomeCardOpenInNewTab(e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="openInNewTab" className="text-sm text-gray-700">
                      새창으로 열기
                    </label>
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <Button 
                  onClick={isEditMode ? cancelEdit : resetForm}
                  variant="outline" 
                  className="bg-white/80 backdrop-blur-sm border-2 border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 rounded-full"
                >
                  {isEditMode ? '수정 취소' : '초기화'}
                </Button>
                <Button 
                  onClick={isEditMode ? saveEditCard : addHomeCard}
                  disabled={addingCard}
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-full"
                >
                  {addingCard ? (isEditMode ? '수정 중...' : '추가 중...') : (isEditMode ? '수정 저장' : '카드 추가')}
                </Button>
              </div>
            </div>

            {/* 미리보기 */}
            <div className="flex justify-center">
              <Card className="group hover:shadow-xl transition-all duration-300 border-0 border-green-300/50 shadow-2xl break-inside-avoid mb-4 relative overflow-hidden bg-transparent w-[325px] h-[480px] flex flex-col justify-end cursor-pointer">
                {/* 배경 이미지 */}
                <div className="absolute inset-0 overflow-hidden">
                  {homeCardThumbnail ? (
                    <img
                      src={homeCardThumbnail}
                      alt="홈카드 배경"
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    />
                  ) : (
                    <div 
                      className="w-full h-full"
                      style={{ 
                        backgroundColor: homeCardBackgroundColor === 'transparent' ? 'transparent' : homeCardBackgroundColor,
                        background: homeCardBackgroundColor === 'transparent' ? 'transparent' : `linear-gradient(135deg, ${homeCardBackgroundColor} 0%, ${homeCardBackgroundColor} 100%)`
                      }}
                    >
                    </div>
                  )}
                </div>
                <CardHeader 
                  className="text-center pt-1 pb-2 relative z-10" 
                  style={{ 
                    position: 'absolute',
                    bottom: `${homeCardTextPosition}%`,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '100%'
                  }}
                >
                  <CardTitle className="text-[24px] font-bold mb-1 font-cookie-run" style={{ color: homeCardTitleColor }}>
                    {homeCardTitle || "카드 제목"}
                  </CardTitle>
                  <p className="leading-relaxed" style={{ fontSize: '15px', whiteSpace: 'pre-line', color: homeCardDescriptionColor }}>
                    {homeCardDescription || "카드 설명이 여기에 표시됩니다.\n최대 2줄까지 권장됩니다."}
                  </p>
                </CardHeader>
              </Card>
            </div>
          </div>
        </div>

        <div className="bg-white/95 backdrop-blur-sm border border-white/20 rounded-lg p-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              홈카드 목록 ({getFilteredHomeCardList().length}개)
            </h3>
            
            {/* 필터링 UI */}
            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
              {/* 날짜 필터 */}
              <div className="flex gap-2 items-center min-w-0">
                <input
                  type="date"
                  value={homeCardFilterDateFrom}
                  onChange={(e) => setHomeCardFilterDateFrom(e.target.value)}
                  className="px-2 py-2 border border-gray-300 rounded-md text-sm min-w-0 flex-1"
                  placeholder="시작일"
                />
                <span className="text-gray-500 text-sm flex-shrink-0">~</span>
                <input
                  type="date"
                  value={homeCardFilterDateTo}
                  onChange={(e) => setHomeCardFilterDateTo(e.target.value)}
                  className="px-2 py-2 border border-gray-300 rounded-md text-sm min-w-0 flex-1"
                  placeholder="종료일"
                />
              </div>
              
              {/* 검색 필터 */}
              <input
                type="text"
                value={homeCardFilterSearch}
                onChange={(e) => setHomeCardFilterSearch(e.target.value)}
                placeholder="제목, 내용 검색..."
                className="px-3 py-2 border border-gray-300 rounded-md text-sm flex-1 min-w-0"
              />
              
              {/* 필터 초기화 */}
              <button
                onClick={resetHomeCardFilters}
                className="px-3 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-md text-sm whitespace-nowrap"
              >
                초기화
              </button>
            </div>
          </div>
          <div className="space-y-2">
            {getFilteredHomeCardList().length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {homeCardList.length === 0 ? (
                  <>
                    <p>아직 등록된 홈카드가 없습니다.</p>
                    <p className="text-sm">위에서 새로운 홈카드를 추가해보세요.</p>
                  </>
                ) : (
                  <p className="text-sm">다른 필터 조건을 시도해보세요.</p>
                )}
              </div>
            ) : (
              getFilteredHomeCardList().map((card, index) => (
                <div key={card.id} className="flex flex-col md:flex-row items-start md:items-center gap-4 px-6 py-6 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                    {card.cardThumbnail ? (
                      <img 
                        src={card.cardThumbnail} 
                        alt={card.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div 
                        className="w-full h-full"
                        style={{ 
                          backgroundColor: card.homeCardBackgroundColor || card.backgroundColor || 'transparent',
                          background: (card.homeCardBackgroundColor || card.backgroundColor) ? 
                            `linear-gradient(135deg, ${card.homeCardBackgroundColor || card.backgroundColor} 0%, ${card.homeCardBackgroundColor || card.backgroundColor} 100%)` : 
                            'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)'
                        }}
                      >
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 break-words">{card.title}</h4>
                    <p className="text-sm text-gray-600 whitespace-pre-line break-words">{card.cardDescription || card.description}</p>
                    {card.url && (
                      <p className="text-xs text-blue-600 mt-1 break-all">
                        {card.url}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(card.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2 w-full md:w-auto">
                    <Button 
                      size="sm" 
                      className="bg-blue-500 hover:bg-blue-600 text-white rounded-full flex-1 md:flex-none"
                      onClick={() => startEditCard(card)}
                      disabled={editingCard === card.id}
                    >
                      수정
                    </Button>
                    <Button 
                      size="sm" 
                      className="bg-red-500 hover:bg-red-600 text-white rounded-full flex-1 md:flex-none"
                      onClick={() => deleteHomeCard(card.id)}
                      disabled={deletingCard === card.id || editingCard === card.id}
                    >
                      {deletingCard === card.id ? '삭제 중...' : '삭제'}
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default HomeCardManagement;
