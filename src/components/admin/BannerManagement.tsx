"use client";

import React, { useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Banner {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  url: string;
  openInNewTab: boolean;
  height: number;
  targetPages: string[];
  isActive: boolean;
  createdAt: any;
  titleColor?: string;
  descriptionColor?: string;
  textPosition?: number;
  backgroundColor?: string;
}

interface BannerManagementProps {
  // Form states
  bannerTitle: string;
  setBannerTitle: (title: string) => void;
  bannerDescription: string;
  setBannerDescription: (description: string) => void;
  bannerThumbnail: string;
  setBannerThumbnail: (thumbnail: string) => void;
  bannerUrl: string;
  setBannerUrl: (url: string) => void;
  bannerOpenInNewTab: boolean;
  setBannerOpenInNewTab: (openInNewTab: boolean) => void;
  bannerTitleColor: string;
  setBannerTitleColor: (color: string) => void;
  bannerDescriptionColor: string;
  setBannerDescriptionColor: (color: string) => void;
  bannerTextPosition: number;
  setBannerTextPosition: (position: number) => void;
  bannerBackgroundColor: string;
  setBannerBackgroundColor: (color: string) => void;
  bannerTargetPages: string[];
  setBannerTargetPages: (pages: string[]) => void;
  
  // Edit states
  isEditMode: boolean;
  addingBanner: boolean;
  deletingBanner: string | null;
  
  // Functions
  addBanner: () => Promise<void>;
  saveEditBanner: () => Promise<void>;
  startEditBanner: (banner: Banner) => void;
  deleteBanner: (bannerId: string) => Promise<void>;
  toggleBannerActive: (bannerId: string, isActive: boolean) => Promise<void>;
  moveBannerOrder: (bannerId: string, direction: 'up' | 'down') => Promise<void>;
  cancelEdit: () => void;
  resetForm: () => void;
  
  // List states and functions
  bannerList: Banner[];
  getFilteredBannerList: () => Banner[];
  bannerFilterDateFrom: string;
  setBannerFilterDateFrom: (date: string) => void;
  bannerFilterDateTo: string;
  setBannerFilterDateTo: (date: string) => void;
  bannerFilterSearch: string;
  setBannerFilterSearch: (search: string) => void;
  resetBannerFilters: () => void;
  bannerSortBy: string;
  setBannerSortBy: (sortBy: string) => void;
  bannerSortOrder: string;
  setBannerSortOrder: (sortOrder: string) => void;
}

const BannerManagement: React.FC<BannerManagementProps> = ({
  bannerTitle,
  setBannerTitle,
  bannerDescription,
  setBannerDescription,
  bannerThumbnail,
  setBannerThumbnail,
  bannerUrl,
  setBannerUrl,
  bannerOpenInNewTab,
  setBannerOpenInNewTab,
  bannerTitleColor,
  setBannerTitleColor,
  bannerDescriptionColor,
  setBannerDescriptionColor,
  bannerTextPosition,
  setBannerTextPosition,
  bannerBackgroundColor,
  setBannerBackgroundColor,
  bannerTargetPages,
  setBannerTargetPages,
  isEditMode,
  addingBanner,
  deletingBanner,
  addBanner,
  saveEditBanner,
  startEditBanner,
  deleteBanner,
  toggleBannerActive,
  moveBannerOrder,
  cancelEdit,
  resetForm,
  bannerList,
  getFilteredBannerList,
  bannerFilterDateFrom,
  setBannerFilterDateFrom,
  bannerFilterDateTo,
  setBannerFilterDateTo,
  bannerFilterSearch,
  setBannerFilterSearch,
  resetBannerFilters,
  bannerSortBy,
  setBannerSortBy,
  bannerSortOrder,
  setBannerSortOrder,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // 썸네일이 초기화될 때 파일 입력 필드도 초기화
  useEffect(() => {
    if (!bannerThumbnail && fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [bannerThumbnail]);
  // 배너 썸네일 압축 함수 (450px, 800KB)
  const compressBannerThumbnail = (file: File, maxWidth: number = 450, quality: number = 0.8): Promise<string> => {
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
        // 450px로 강제 리사이즈 (가로 기준)
        const maxWidth = 450;
        const ratio = maxWidth / img.width;
        canvas.width = maxWidth;
        canvas.height = img.height * ratio;
        
        // 이미지 그리기
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        // 투명도가 있는 이미지인지 확인
        const imageData = ctx?.getImageData(0, 0, canvas.width, canvas.height);
        const hasTransparency = imageData?.data.some((_, index) => index % 4 === 3 && imageData.data[index] < 255);
        
        // 투명도가 있으면 PNG, 없으면 JPG 사용
        const format = hasTransparency ? 'image/png' : 'image/jpeg';
        let startQuality = hasTransparency ? 0.7 : 0.6;
        
        // 파일 크기가 800KB 이하가 될 때까지 품질을 낮춤
        const compressImageRecursive = (currentQuality: number): string => {
          const dataUrl = canvas.toDataURL(format, currentQuality);
          const sizeKB = dataUrl.length / 1024;
          
          console.log(`배너 압축 시도: 품질 ${currentQuality.toFixed(1)}, 크기 ${sizeKB.toFixed(1)}KB`);
          
          // 크기가 여전히 800KB보다 크고 품질을 더 낮출 수 있다면 재귀 호출
          if (sizeKB > 800 && currentQuality > 0.05) {
            return compressImageRecursive(currentQuality - 0.05);
          }
          
          console.log(`배너 최종 압축: 품질 ${currentQuality.toFixed(1)}, 크기 ${sizeKB.toFixed(1)}KB`);
          return dataUrl;
        };
        
        resolve(compressImageRecursive(startQuality));
        } catch (error) {
          console.error('❌ 압축 처리 중 오류:', error);
          reject(new Error(`이미지 압축 중 오류가 발생했습니다: ${error.message}`));
        }
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  const handleTargetPageChange = (page: string) => {
    if (bannerTargetPages.includes(page)) {
      setBannerTargetPages(bannerTargetPages.filter(p => p !== page));
    } else {
      setBannerTargetPages([...bannerTargetPages, page]);
    }
  };

  return (
    <>
      <div className="space-y-4">
        <div className="bg-white/95 backdrop-blur-sm border border-white/20 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {isEditMode ? '배너 수정' : '배너 추가'}
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* 입력 폼 */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-2">배너 제목 *</label>
                <div className="bg-transparent p-4 rounded-lg border border-gray-300">
                  <input 
                    type="text" 
                    value={bannerTitle || ''}
                    onChange={(e) => setBannerTitle(e.target.value)}
                    placeholder="배너에 표시될 제목"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-[15px] mb-3 bg-white"
                  />
                  <div className="flex gap-2">
                    <input 
                      type="color" 
                      value={bannerTitleColor || '#ffffff'}
                      onChange={(e) => setBannerTitleColor(e.target.value)}
                      className="w-[58px] h-10 border-0 rounded-md cursor-pointer"
                    />
                    <input 
                      type="text" 
                      value={bannerTitleColor || '#ffffff'}
                      onChange={(e) => setBannerTitleColor(e.target.value)}
                      placeholder="#ffffff"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-[15px] bg-white"
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-2">배너 설명</label>
                <div className="bg-transparent p-4 rounded-lg border border-gray-300">
                  <textarea 
                    value={bannerDescription || ''}
                    onChange={(e) => setBannerDescription(e.target.value)}
                    placeholder="배너에 표시될 설명"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-[15px] mb-2 bg-white"
                  />
                  <div className="flex gap-2">
                    <input 
                      type="color" 
                      value={bannerDescriptionColor || '#ffffff'}
                      onChange={(e) => setBannerDescriptionColor(e.target.value)}
                      className="w-[58px] h-10 border-0 rounded-md cursor-pointer"
                    />
                    <input 
                      type="text" 
                      value={bannerDescriptionColor || '#ffffff'}
                      onChange={(e) => setBannerDescriptionColor(e.target.value)}
                      placeholder="#ffffff"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-[15px] bg-white"
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
                        value={bannerTextPosition}
                        onChange={(e) => setBannerTextPosition(Number(e.target.value))}
                        className="flex-1 h-2 appearance-none cursor-pointer"
                        style={{
                          background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(bannerTextPosition / 75) * 100}%, #e5e7eb ${(bannerTextPosition / 75) * 100}%, #e5e7eb 100%)`,
                          borderRadius: '8px'
                        }}
                      />
                      <span className="text-sm text-gray-600 w-12">아래</span>
                    </div>
                    <div className="text-center mt-2">
                      <span className="text-xs text-gray-500">{bannerTextPosition}%</span>
                    </div>
                  </div>
                </div>
                
                {/* 배너 배경 색상 */}
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-800 mb-2">배너 배경 색상</label>
                  <div className="bg-transparent p-4 rounded-lg border border-gray-300">
                    <div className="flex gap-2">
                      <input 
                        type="color" 
                        value={bannerBackgroundColor || '#3b82f6'}
                        onChange={(e) => setBannerBackgroundColor(e.target.value)}
                        className="w-[58px] h-10 border-0 rounded-md cursor-pointer"
                      />
                      <input 
                        type="text" 
                        value={bannerBackgroundColor || '#3b82f6'}
                        onChange={(e) => setBannerBackgroundColor(e.target.value)}
                        placeholder="#3b82f6"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-[15px] bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => setBannerBackgroundColor('transparent')}
                        className={`px-3 py-2 text-sm rounded-md border flex-shrink-0 ${
                          bannerBackgroundColor === 'transparent' 
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
                <label className="block text-sm font-medium text-gray-800 mb-2">배너 썸네일</label>
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
                          const compressedImage = await compressBannerThumbnail(file, 450, 0.8);
                          setBannerThumbnail(compressedImage);
                        } catch (error) {
                          console.error('배너 썸네일 압축 실패:', error);
                          alert('이미지 압축 중 오류가 발생했습니다.');
                        }
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-[15px] bg-white"
                  />
                  {bannerThumbnail && (
                    <button
                      type="button"
                      onClick={() => {
                        setBannerThumbnail('');
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
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-2">배포 위치</label>
                <div className="bg-transparent p-4 rounded-lg border border-gray-300">
                  <div className="flex flex-wrap gap-4">
                    {['갤러리', '이야기', '스토어'].map((page) => (
                      <label key={page} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={bannerTargetPages.includes(page)}
                          onChange={() => handleTargetPageChange(page)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{page}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              {/* 배너 링크 URL 섹션 */}
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-2">배너 링크 URL</label>
                <div className="bg-transparent p-4 rounded-lg border border-gray-300">
                  <div className="mb-3">
                    <input 
                      type="url" 
                      value={bannerUrl || ''}
                      onChange={(e) => setBannerUrl(e.target.value)}
                      placeholder="예: /gallery, /story, https://example.com"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-[15px] bg-white"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      id="bannerOpenInNewTab"
                      checked={bannerOpenInNewTab || false}
                      onChange={(e) => setBannerOpenInNewTab(e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="bannerOpenInNewTab" className="text-sm text-gray-700">
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
                  onClick={isEditMode ? saveEditBanner : addBanner}
                  disabled={addingBanner}
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-full"
                >
                  {addingBanner ? (isEditMode ? '수정 중...' : '추가 중...') : (isEditMode ? '수정 저장' : '배너 추가')}
                </Button>
              </div>
            </div>

            {/* 미리보기 */}
            <div className="flex justify-center">
              <div
                className="group shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden w-full rounded-2xl relative cursor-pointer flex flex-col break-inside-avoid mb-3"
                style={{ 
                  backgroundColor: bannerBackgroundColor || '#3b82f6',
                  minHeight: '200px',
                  height: 'auto',
                  width: '325px'
                }}
              >
                {/* 배경 이미지 */}
                {bannerThumbnail && (
                  <img
                    src={bannerThumbnail}
                    alt="배너 배경"
                    className="w-full h-auto object-contain"
                  />
                )}
                
                {/* 배너 내용 */}
                <div 
                  className="p-6 flex flex-col justify-center items-start text-left"
                  style={{ 
                    marginTop: `${bannerTextPosition}%`
                  }}
                >
                  <h3 className="text-lg font-bold mb-2" style={{ color: bannerTitleColor }}>
                    {bannerTitle || '배너 제목'}
                  </h3>
                  <p className="opacity-90" style={{ color: bannerDescriptionColor, whiteSpace: 'pre-line', fontSize: '14px' }}>
                    {bannerDescription || '배너 설명을 입력하세요'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white/95 backdrop-blur-sm border border-white/20 rounded-lg p-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              배너 목록 ({getFilteredBannerList().length}개)
            </h3>
            
            {/* 필터링 UI */}
            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
              {/* 날짜 필터 */}
              <div className="flex gap-2 items-center min-w-0">
                <input
                  type="date"
                  value={bannerFilterDateFrom}
                  onChange={(e) => setBannerFilterDateFrom(e.target.value)}
                  className="px-2 py-2 border border-gray-300 rounded-md text-sm min-w-0 flex-1"
                  placeholder="시작일"
                />
                <span className="text-gray-500 text-sm flex-shrink-0">~</span>
                <input
                  type="date"
                  value={bannerFilterDateTo}
                  onChange={(e) => setBannerFilterDateTo(e.target.value)}
                  className="px-2 py-2 border border-gray-300 rounded-md text-sm min-w-0 flex-1"
                  placeholder="종료일"
                />
              </div>
              
              {/* 검색 필터 */}
              <input
                type="text"
                value={bannerFilterSearch}
                onChange={(e) => setBannerFilterSearch(e.target.value)}
                placeholder="제목, 내용 검색..."
                className="px-3 py-2 border border-gray-300 rounded-md text-sm flex-1 min-w-0"
              />
              
              {/* 정렬 옵션 */}
              <select
                value={bannerSortBy}
                onChange={(e) => setBannerSortBy(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="createdAt">생성일</option>
                <option value="title">제목</option>
                <option value="targetPages">배포위치</option>
              </select>
              
              <select
                value={bannerSortOrder}
                onChange={(e) => setBannerSortOrder(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="desc">내림차순</option>
                <option value="asc">오름차순</option>
              </select>
              
              {/* 필터 초기화 */}
              <button
                onClick={resetBannerFilters}
                className="px-3 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-md text-sm whitespace-nowrap"
              >
                초기화
              </button>
            </div>
          </div>
          <div className="space-y-2">
            {getFilteredBannerList().length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {bannerList.length === 0 ? (
                  <>
                    <p>아직 등록된 배너가 없습니다.</p>
                    <p className="text-sm">위에서 새로운 배너를 추가해보세요.</p>
                  </>
                ) : (
                  <p className="text-sm">다른 필터 조건을 시도해보세요.</p>
                )}
              </div>
            ) : (
              getFilteredBannerList().map((banner, index) => (
                <div key={banner.id} className="flex flex-col md:flex-row items-start md:items-center gap-4 px-6 py-6 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                    {banner.thumbnail ? (
                      <img 
                        src={banner.thumbnail} 
                        alt={banner.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div 
                        className="w-full h-full"
                        style={{ 
                          backgroundColor: banner.backgroundColor === 'transparent' ? 'transparent' : banner.backgroundColor,
                          background: banner.backgroundColor === 'transparent' ? 'transparent' : `linear-gradient(135deg, ${banner.backgroundColor} 0%, ${banner.backgroundColor} 100%)`
                        }}
                      >
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-white text-xs">배너</span>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 break-words">{banner.title}</h4>
                    <p className="text-sm text-gray-600 whitespace-pre-line break-words">{banner.description}</p>
                    {banner.url && (
                      <p className="text-xs text-blue-600 mt-1 break-all">
                        {banner.url}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      배포: {banner.targetPages.join(', ')} | {(() => {
                        try {
                          if (banner.createdAt) {
                            const date = banner.createdAt.toDate ? banner.createdAt.toDate() : new Date(banner.createdAt);
                            return isNaN(date.getTime()) ? '날짜 없음' : date.toLocaleDateString();
                          }
                          return '날짜 없음';
                        } catch {
                          return '날짜 없음';
                        }
                      })()}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        banner.isActive 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-100 text-gray-500'
                      }`}>
                        {banner.isActive ? '활성' : '비활성'}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 w-full md:w-auto">
                    <Button 
                      size="sm" 
                      className="bg-gray-500 hover:bg-gray-600 text-white rounded-full flex-1 md:flex-none"
                      onClick={() => moveBannerOrder(banner.id, 'up')}
                      disabled={isEditMode}
                    >
                      ↑
                    </Button>
                    <Button 
                      size="sm" 
                      className="bg-gray-500 hover:bg-gray-600 text-white rounded-full flex-1 md:flex-none"
                      onClick={() => moveBannerOrder(banner.id, 'down')}
                      disabled={isEditMode}
                    >
                      ↓
                    </Button>
                    <Button 
                      size="sm" 
                      className={`rounded-full flex-1 md:flex-none ${
                        banner.isActive 
                          ? 'bg-orange-500 hover:bg-orange-600 text-white' 
                          : 'bg-green-500 hover:bg-green-600 text-white'
                      }`}
                      onClick={() => toggleBannerActive(banner.id, !banner.isActive)}
                      disabled={isEditMode}
                    >
                      {banner.isActive ? '숨기기' : '보이기'}
                    </Button>
                    <Button 
                      size="sm" 
                      className="bg-blue-500 hover:bg-blue-600 text-white rounded-full flex-1 md:flex-none"
                      onClick={() => startEditBanner(banner)}
                      disabled={isEditMode}
                    >
                      수정
                    </Button>
                    <Button 
                      size="sm" 
                      className="bg-red-500 hover:bg-red-600 text-white rounded-full flex-1 md:flex-none"
                      onClick={() => deleteBanner(banner.id)}
                      disabled={deletingBanner === banner.id || isEditMode}
                    >
                      {deletingBanner === banner.id ? '삭제 중...' : '삭제'}
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

export default BannerManagement;