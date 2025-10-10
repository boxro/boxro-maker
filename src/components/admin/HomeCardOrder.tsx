"use client";

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowUp, ArrowDown, Eye, EyeOff, GripVertical } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface HomeCard {
  id: string;
  title: string;
  cardDescription?: string;
  description?: string;
  thumbnail: string;
  cardThumbnail?: string;
  url: string;
  openInNewTab: boolean;
  titleColor: string;
  descriptionColor: string;
  textPosition: number;
  backgroundColor: string;
  homeCardBackgroundColor?: string;
  showOnHome: boolean;
  isPublished: boolean;
  homeOrder: number;
  createdAt: any;
  updatedAt: any;
  source: string;
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
  // 드래그 앤 드롭을 위한 새로운 함수
  onDragEnd: (event: DragEndEvent) => void;
}

// SortableItem 컴포넌트
interface SortableItemProps {
  card: HomeCard;
  index: number;
  homeCards: HomeCard[];
  moveCard: (index: number, direction: 'up' | 'down') => void;
  toggleCardVisibility: (cardId: string) => Promise<void>;
}

const SortableItem: React.FC<SortableItemProps> = ({ card, index, homeCards, moveCard, toggleCardVisibility }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // 안전한 날짜 포맷팅 함수
  const formatDate = (dateValue: any): string => {
    if (!dateValue) return '날짜 없음';
    
    try {
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) return '날짜 없음';
      return date.toLocaleDateString('ko-KR');
    } catch (error) {
      return '날짜 없음';
    }
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card 
        className={`bg-gray-50 rounded-lg border border-gray-200 shadow-none transition-all duration-200 ${isDragging ? 'shadow-lg' : ''}`}
      >
        <CardContent className="px-6 py-2">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {/* 드래그 핸들과 화살표 버튼들 */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {/* 드래그 핸들 */}
              <div 
                className="flex items-center justify-center w-8 h-8 text-gray-500 hover:text-gray-700 cursor-grab active:cursor-grabbing bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                {...attributes}
                {...listeners}
              >
                <GripVertical className="w-5 h-5" />
              </div>
              
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
            </div>
            
            {/* 카드 정보 */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-4">
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
                      {formatDate(card.createdAt)}
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
            
            {/* 숨기기/보이기 버튼 */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
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
    </div>
  );
};

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
  onDragEnd,
}) => {
  // 드래그 앤 드롭 센서 설정
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // 안전한 날짜 포맷팅 함수
  const formatDate = (dateValue: any): string => {
    if (!dateValue) return '날짜 없음';
    
    try {
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) return '날짜 없음';
      return date.toLocaleDateString('ko-KR');
    } catch (error) {
      return '날짜 없음';
    }
  };

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
        <div className="space-y-4">
          {/* 메인 홈카드 목록 */}
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

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={onDragEnd}
            >
              <SortableContext
                items={getFilteredHomeCards().map(card => card.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {getFilteredHomeCards().map((card, index) => (
                    <SortableItem
                      key={card.id}
                      card={card}
                      index={index}
                      homeCards={homeCards}
                      moveCard={moveCard}
                      toggleCardVisibility={toggleCardVisibility}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
            
            {/* 빈 상태 메시지 */}
            {getFilteredHomeCards().length === 0 && (
              <Card className="bg-gray-50 border border-gray-200">
                <CardContent className="text-center py-8">
                  <p className="text-gray-500">
                    {homeCards.length === 0 ? '현재 홈카드가 없습니다.' : '다른 필터 조건을 시도해보세요.'}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* 숨겨진 카드들 섹션 */}
          <div className="bg-white/95 backdrop-blur-sm border border-white/20 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              보관함(숨겨진 카드) ({hiddenCards.length}개)
            </h3>
              {hiddenCards.length > 0 ? (
                <div className="space-y-2">
                  {hiddenCards.map((card) => (
                    <div key={card.id} className="flex items-center justify-between px-6 py-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center gap-4 flex-1">
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
                          <div className="flex items-center gap-4 mt-2">
                            <span className="text-xs text-gray-500">
                              {formatDate(card.createdAt)}
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
                      <Button
                        size="sm"
                        onClick={() => toggleCardVisibility(card.id)}
                        className="bg-green-500 hover:bg-green-600 text-white rounded-full flex-shrink-0"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        보이기
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>숨겨진 카드가 없습니다.</p>
                  <p className="text-sm">홈카드 노출순서에서 카드를 숨기면 여기에 표시됩니다.</p>
                </div>
              )}
          </div>
        </div>
      )}
    </>
  );
};

export default HomeCardOrder;