"use client";

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowUp, ArrowDown, Eye, EyeOff, GripVertical } from 'lucide-react';

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
  source?: string;
  likes?: number;
  shares?: number;
  boxroTalks?: number;
  views?: number;
}

interface HomeCardOrderProps {
  // Loading states
  homeCardsLoading: boolean;
  saving: boolean;
  
  // Data
  homeCards: HomeCard[];
  hiddenCards: HomeCard[];
  
  // Filter states
  filterSource: string;
  setFilterSource: (source: string) => void;
  filterDateFrom: string;
  setFilterDateFrom: (date: string) => void;
  filterDateTo: string;
  setFilterDateTo: (date: string) => void;
  filterSearch: string;
  setFilterSearch: (search: string) => void;
  
  // Functions
  getFilteredHomeCards: () => HomeCard[];
  moveCard: (index: number, direction: 'up' | 'down') => void;
  saveOrder: () => Promise<void>;
  toggleCardVisibility: (cardId: string) => Promise<void>;
  resetFilters: () => void;
}

const HomeCardOrder: React.FC<HomeCardOrderProps> = ({
  homeCardsLoading,
  saving,
  homeCards,
  hiddenCards,
  filterSource,
  setFilterSource,
  filterDateFrom,
  setFilterDateFrom,
  filterDateTo,
  setFilterDateTo,
  filterSearch,
  setFilterSearch,
  getFilteredHomeCards,
  moveCard,
  saveOrder,
  toggleCardVisibility,
  resetFilters,
}) => {
  return (
    <>
      {homeCardsLoading ? (
        <Card className="bg-white/95 backdrop-blur-sm border border-white/20">
          <CardContent className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">홈카드 데이터를 불러오는 중...</p>
          </CardContent>
        </Card>
      ) : (
        <div className="bg-white/95 backdrop-blur-sm border border-white/20 rounded-lg p-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              홈카드 노출순서 ({getFilteredHomeCards().length}개)
            </h3>
            
            {/* 필터링 UI */}
            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
              {/* 출처 필터 */}
              <select
                value={filterSource}
                onChange={(e) => setFilterSource(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="">모든 출처</option>
                <option value="storyArticles">박스카 이야기</option>
                <option value="storeItems">박스로 스토어</option>
                <option value="homeCards">홈 카드 관리</option>
              </select>
              
              {/* 날짜 필터 */}
              <div className="flex gap-2 items-center min-w-0">
                <input
                  type="date"
                  value={filterDateFrom}
                  onChange={(e) => setFilterDateFrom(e.target.value)}
                  className="px-2 py-2 border border-gray-300 rounded-md text-sm min-w-0 flex-1"
                  placeholder="시작일"
                />
                <span className="text-gray-500 text-sm flex-shrink-0">~</span>
                <input
                  type="date"
                  value={filterDateTo}
                  onChange={(e) => setFilterDateTo(e.target.value)}
                  className="px-2 py-2 border border-gray-300 rounded-md text-sm min-w-0 flex-1"
                  placeholder="종료일"
                />
              </div>
              
              {/* 검색 필터 */}
              <input
                type="text"
                value={filterSearch}
                onChange={(e) => setFilterSearch(e.target.value)}
                placeholder="제목, 내용 검색..."
                className="px-3 py-2 border border-gray-300 rounded-md text-sm flex-1 min-w-0"
              />
              
              {/* 필터 초기화 */}
              <button
                onClick={resetFilters}
                className="px-3 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-md text-sm whitespace-nowrap"
              >
                초기화
              </button>
            </div>
          </div>
          <div className="space-y-4">
            {getFilteredHomeCards().map((card, index) => (
              <Card 
                key={card.id} 
                className="bg-gray-50 rounded-lg border border-gray-200 shadow-none transition-all duration-200"
              >
                <CardContent className="px-6 py-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    {/* 상단: 화살표 버튼들 */}
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          onClick={() => moveCard(index, 'up')}
                          disabled={index === 0}
                          className="w-8 h-8 p-0 bg-blue-500 hover:bg-blue-600 text-white rounded-full"
                        >
                          <ArrowUp className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => moveCard(index, 'down')}
                          disabled={index === homeCards.length - 1}
                          className="w-8 h-8 p-0 bg-blue-500 hover:bg-blue-600 text-white rounded-full"
                        >
                          <ArrowDown className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      {/* 드래그 핸들 */}
                      <div className="flex items-center gap-2 text-gray-400">
                        <GripVertical className="w-4 h-4" />
                        <span className="text-sm">순서 변경</span>
                      </div>
                    </div>
                    
                    {/* 카드 정보 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-4">
                        {/* 썸네일 */}
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
                        
                        {/* 카드 내용 */}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 break-words">{card.title}</h4>
                          <p className="text-sm text-gray-600 whitespace-pre-line break-words">{card.cardDescription || card.description}</p>
                          {card.url && (
                            <p className="text-xs text-blue-600 mt-1 break-all">
                              {card.url}
                            </p>
                          )}
                          <div className="flex items-center gap-4 mt-2">
                            <span className="text-xs text-gray-500">
                              {new Date(card.createdAt).toLocaleDateString()}
                            </span>
                            {card.source && (
                              <span className="text-xs text-blue-600">
                                {card.source === 'storyArticles' ? '박스카 이야기' : 
                                 card.source === 'storeItems' ? '박스로 스토어' : '홈 카드 관리'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* 통계 정보 */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        {card.likes !== undefined && (
                          <span>좋아요: {card.likes}</span>
                        )}
                        {card.shares !== undefined && (
                          <span>공유: {card.shares}</span>
                        )}
                        {card.boxroTalks !== undefined && (
                          <span>박스로톡: {card.boxroTalks}</span>
                        )}
                        {card.views !== undefined && (
                          <span>조회: {card.views}</span>
                        )}
                      </div>
                      
                      {/* 숨기기/보이기 버튼 */}
                      <Button
                        size="sm"
                        onClick={() => toggleCardVisibility(card.id)}
                        className={`rounded-full ${
                          card.showOnHome === false 
                            ? 'bg-green-500 hover:bg-green-600 text-white' 
                            : 'bg-gray-500 hover:bg-gray-600 text-white'
                        }`}
                      >
                        {card.showOnHome === false ? (
                          <>
                            <Eye className="w-4 h-4 mr-1" />
                            보이기
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-4 h-4 mr-1" />
                            숨기기
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {/* 숨겨진 카드들 섹션 */}
            {hiddenCards.length > 0 && (
              <Card className="bg-gray-100 border border-gray-300">
                <CardContent className="px-6 py-4">
                  <h4 className="font-semibold text-gray-700 mb-3">숨겨진 카드들 ({hiddenCards.length}개)</h4>
                  <div className="space-y-2">
                    {hiddenCards.map((card) => (
                      <div key={card.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
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
                          <div>
                            <h5 className="font-medium text-gray-900">{card.title}</h5>
                            <p className="text-sm text-gray-600">{card.cardDescription || card.description}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(card.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => toggleCardVisibility(card.id)}
                          className="bg-green-500 hover:bg-green-600 text-white rounded-full"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          보이기
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* 빈 상태 메시지 */}
            {getFilteredHomeCards().length === 0 && hiddenCards.length === 0 && (
              <Card className="bg-gray-50 border border-gray-200">
                <CardContent className="text-center py-8">
                  <p className="text-gray-500">
                    {homeCards.length === 0 ? '현재 홈카드가 없습니다.' : '다른 필터 조건을 시도해보세요.'}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default HomeCardOrder;
