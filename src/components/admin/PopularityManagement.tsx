"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';

interface PopularityItem {
  id: string;
  title?: string;
  name?: string;
  type: 'community' | 'story' | 'store';
  thumbnail?: string;
  createdAt?: any;
  likes?: number;
  shares?: number;
  views?: number;
  downloads?: number;
}

interface PopularityBoosts {
  [key: string]: {
    likes: number;
    shares: number;
    views: number;
    downloads: number;
  };
}

interface PopularityManagementProps {
  popularityItems: PopularityItem[];
  popularityLoading: boolean;
  popularityFilter: string;
  setPopularityFilter: (filter: string) => void;
  popularitySortBy: string;
  setPopularitySortBy: (sortBy: string) => void;
  popularitySortOrder: string;
  setPopularitySortOrder: (order: string) => void;
  popularityPageSize: number;
  handlePageSizeChange: (size: number) => void;
  popularityBoosts: PopularityBoosts;
  setPopularityBoosts: (boosts: PopularityBoosts | ((prev: PopularityBoosts) => PopularityBoosts)) => void;
  updatePopularityBoost: (itemId: string, type: string, boosts: {likes: number, shares: number, views: number, downloads: number}) => Promise<void>;
  getSortedPopularityItems: () => PopularityItem[];
  handlePageChange: (page: number) => void;
  popularityTotalPages: number;
  popularityCurrentPage: number;
  popularityAllItems: PopularityItem[];
}

const PopularityManagement: React.FC<PopularityManagementProps> = ({
  popularityItems,
  popularityLoading,
  popularityFilter,
  setPopularityFilter,
  popularitySortBy,
  setPopularitySortBy,
  popularitySortOrder,
  setPopularitySortOrder,
  popularityPageSize,
  handlePageSizeChange,
  popularityBoosts,
  setPopularityBoosts,
  updatePopularityBoost,
  getSortedPopularityItems,
  handlePageChange,
  popularityTotalPages,
  popularityCurrentPage,
  popularityAllItems,
}) => {
  return (
    <>
      <div className="space-y-6">
        <div className="bg-white/95 backdrop-blur-sm border border-white/20 rounded-lg p-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              인기도 관리 ({popularityItems.length}개)
            </h3>
            
            {/* 필터링 및 정렬 UI */}
            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
              {/* 타입 필터 */}
              <select
                value={popularityFilter}
                onChange={(e) => setPopularityFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="all">전체</option>
                <option value="community">갤러리</option>
                <option value="story">이야기</option>
                <option value="store">스토어</option>
              </select>
              
              {/* 정렬 기준 */}
              <select
                value={popularitySortBy}
                onChange={(e) => setPopularitySortBy(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="createdAt">등록일</option>
                <option value="likes">좋아요</option>
                <option value="shares">공유</option>
                <option value="views">조회</option>
              </select>
              
              {/* 정렬 순서 */}
              <select
                value={popularitySortOrder}
                onChange={(e) => setPopularitySortOrder(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="desc">내림차순</option>
                <option value="asc">오름차순</option>
              </select>
              
              {/* 페이지 크기 선택 */}
              <select
                value={popularityPageSize}
                onChange={(e) => handlePageSizeChange(parseInt(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="20">20개씩</option>
                <option value="30">30개씩</option>
                <option value="50">50개씩</option>
                <option value="100">100개씩</option> {/* 페이지 크기 옵션 */}
              </select>
            </div>
          </div>

          {popularityLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-600">인기도 데이터를 불러오는 중...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse min-w-[1200px]">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-2 text-sm font-medium text-gray-800 w-20">썸네일</th>
                    <th className="text-left py-3 px-2 text-sm font-medium text-gray-800 w-48">제목</th>
                    <th className="text-left py-3 px-2 text-sm font-medium text-gray-800 w-20">타입</th>
                    <th className="text-left py-3 px-2 text-sm font-medium text-gray-800 w-24">
                      <button
                        onClick={() => {
                          if (popularitySortBy === 'createdAt') {
                            setPopularitySortOrder(popularitySortOrder === 'asc' ? 'desc' : 'asc');
                          } else {
                            setPopularitySortBy('createdAt');
                            setPopularitySortOrder('desc');
                          }
                        }}
                        className="flex items-center gap-1 hover:text-blue-600 transition-colors"
                      >
                        등록일
                        {popularitySortBy === 'createdAt' && (
                          popularitySortOrder === 'desc' ? <ArrowDown className="w-3 h-3" /> : <ArrowUp className="w-3 h-3" />
                        )}
                      </button>
                    </th>
                    <th className="text-left py-3 px-2 text-sm font-medium text-gray-800 w-20">
                      <button
                        onClick={() => {
                          if (popularitySortBy === 'likes') {
                            setPopularitySortOrder(popularitySortOrder === 'asc' ? 'desc' : 'asc');
                          } else {
                            setPopularitySortBy('likes');
                            setPopularitySortOrder('desc');
                          }
                        }}
                        className="flex items-center gap-1 hover:text-blue-600 transition-colors"
                      >
                        좋아요
                        {popularitySortBy === 'likes' && (
                          popularitySortOrder === 'desc' ? <ArrowDown className="w-3 h-3" /> : <ArrowUp className="w-3 h-3" />
                        )}
                      </button>
                    </th>
                    <th className="text-left py-3 px-2 text-sm font-medium text-gray-800 w-20">
                      <button
                        onClick={() => {
                          if (popularitySortBy === 'shares') {
                            setPopularitySortOrder(popularitySortOrder === 'asc' ? 'desc' : 'asc');
                          } else {
                            setPopularitySortBy('shares');
                            setPopularitySortOrder('desc');
                          }
                        }}
                        className="flex items-center gap-1 hover:text-blue-600 transition-colors"
                      >
                        공유
                        {popularitySortBy === 'shares' && (
                          popularitySortOrder === 'desc' ? <ArrowDown className="w-3 h-3" /> : <ArrowUp className="w-3 h-3" />
                        )}
                      </button>
                    </th>
                    <th className="text-left py-3 px-2 text-sm font-medium text-gray-800 w-20">
                      <button
                        onClick={() => {
                          if (popularitySortBy === 'views') {
                            setPopularitySortOrder(popularitySortOrder === 'asc' ? 'desc' : 'asc');
                          } else {
                            setPopularitySortBy('views');
                            setPopularitySortOrder('desc');
                          }
                        }}
                        className="flex items-center gap-1 hover:text-blue-600 transition-colors"
                      >
                        조회
                        {popularitySortBy === 'views' && (
                          popularitySortOrder === 'desc' ? <ArrowDown className="w-3 h-3" /> : <ArrowUp className="w-3 h-3" />
                        )}
                      </button>
                    </th>
                    <th className="text-left py-3 px-2 text-sm font-medium text-gray-800 w-20">
                      <button
                        onClick={() => {
                          if (popularitySortBy === 'downloads') {
                            setPopularitySortOrder(popularitySortOrder === 'asc' ? 'desc' : 'asc');
                          } else {
                            setPopularitySortBy('downloads');
                            setPopularitySortOrder('desc');
                          }
                        }}
                        className="flex items-center gap-1 hover:text-blue-600 transition-colors"
                      >
                        다운로드
                        {popularitySortBy === 'downloads' && (
                          popularitySortOrder === 'desc' ? <ArrowDown className="w-3 h-3" /> : <ArrowUp className="w-3 h-3" />
                        )}
                      </button>
                    </th>
                    <th className="text-left py-3 px-2 text-sm font-medium text-gray-800 w-32">가산점 부여</th>
                  </tr>
                </thead>
                <tbody>
                  {getSortedPopularityItems().map((item) => (
                    <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-2 px-2 w-20">
                        <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                          {item.thumbnail ? (
                            <img 
                              src={item.thumbnail} 
                              alt={item.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                              <span className="text-gray-400 text-xs">없음</span>
                            </div>
                          )}
                        </div>
                      </td>
                      
                      <td className="py-2 px-2 w-48">
                        <div className="max-w-xs">
                          <a 
                            href={
                              item.type === 'community' ? `/community` :
                              item.type === 'story' ? `/story` :
                              item.type === 'store' ? `/store` : '#'
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-gray-800 hover:text-gray-600 hover:underline truncate block"
                            style={{ fontSize: '13px' }}
                          >
                            {item.title || item.name || '제목 없음'}
                          </a>
                        </div>
                      </td>
                      
                      <td className="py-2 px-2 w-20">
                        <span className="inline-flex items-center px-1 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {item.type === 'community' ? '갤러리' : 
                           item.type === 'story' ? '이야기' : '스토어'}
                        </span>
                      </td>
                      
                      <td className="py-2 px-2 w-24">
                        <span className="text-xs text-gray-800">
                          {item.createdAt ? new Date(item.createdAt).toLocaleDateString('ko-KR') : '-'}
                        </span>
                      </td>
                      
                      <td className="py-2 px-2 w-20">
                        <div className="text-center">
                          <div className="text-base font-bold text-blue-600">
                            {(item.likes || 0) + (popularityBoosts[item.id]?.likes || 0)}
                          </div>
                          <div className="text-xs text-gray-800">
                            {item.likes || 0} + {popularityBoosts[item.id]?.likes || 0}
                          </div>
                        </div>
                      </td>
                      
                      <td className="py-2 px-2 w-20">
                        <div className="text-center">
                          <div className="text-base font-bold text-green-600">
                            {(item.shares || 0) + (popularityBoosts[item.id]?.shares || 0)}
                          </div>
                          <div className="text-xs text-gray-800">
                            {item.shares || 0} + {popularityBoosts[item.id]?.shares || 0}
                          </div>
                        </div>
                      </td>
                      
                      <td className="py-2 px-2 w-20">
                        {(item.type === 'story' || item.type === 'store') ? (
                          <div className="text-center">
                            <div className="text-base font-bold text-purple-600">
                              {(item.views || 0) + (popularityBoosts[item.id]?.views || 0)}
                            </div>
                            <div className="text-xs text-gray-800">
                              {item.views || 0} + {popularityBoosts[item.id]?.views || 0}
                            </div>
                          </div>
                        ) : (
                          <div className="text-center text-gray-400">-</div>
                        )}
                      </td>
                      
                      <td className="py-2 px-2 w-20">
                        {item.type === 'community' ? (
                          <div className="text-center">
                            <div className="text-base font-bold text-orange-600">
                              {(item.downloads || 0) + (popularityBoosts[item.id]?.downloads || 0)}
                            </div>
                            <div className="text-xs text-gray-800">
                              {item.downloads || 0} + {popularityBoosts[item.id]?.downloads || 0}
                            </div>
                          </div>
                        ) : (
                          <div className="text-center text-gray-400">-</div>
                        )}
                      </td>
                      
                      <td className="py-2 px-2 w-32">
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="0" // 최소값 0
                            value={popularityBoosts[item.id]?.likes || 0}
                            onChange={(e) => setPopularityBoosts(prev => ({
                              ...prev,
                              [item.id]: {
                                ...prev[item.id],
                                likes: parseInt(e.target.value) || 0
                              }
                            }))}
                            className="w-[58px] px-1 py-1 border border-gray-300 rounded text-xs text-center [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                            placeholder="좋아요"
                          />
                          <input
                            type="number"
                            min="0"
                            value={popularityBoosts[item.id]?.shares || 0}
                            onChange={(e) => setPopularityBoosts(prev => ({
                              ...prev,
                              [item.id]: {
                                ...prev[item.id],
                                shares: parseInt(e.target.value) || 0
                              }
                            }))}
                            className="w-[58px] px-1 py-1 border border-gray-300 rounded text-xs text-center [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                            placeholder="공유"
                          />
                          <input
                            type="number"
                            min="0"
                            value={popularityBoosts[item.id]?.views || 0}
                            onChange={(e) => setPopularityBoosts(prev => ({
                              ...prev,
                              [item.id]: {
                                ...prev[item.id],
                                views: parseInt(e.target.value) || 0
                              }
                            }))}
                            className={`w-[58px] px-1 py-1 border border-gray-300 rounded text-xs text-center [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield] ${(item.type !== 'story' && item.type !== 'store') ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : ''}`}
                            placeholder="조회"
                            disabled={item.type !== 'story' && item.type !== 'store'}
                          />
                          <input
                            type="number"
                            min="0"
                            value={popularityBoosts[item.id]?.downloads || 0}
                            onChange={(e) => setPopularityBoosts(prev => ({
                              ...prev,
                              [item.id]: {
                                ...prev[item.id],
                                downloads: parseInt(e.target.value) || 0
                              }
                            }))}
                            className={`w-[58px] px-1 py-1 border border-gray-300 rounded text-xs text-center [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield] ${item.type !== 'community' ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : ''}`}
                            placeholder="다운로드"
                            disabled={item.type !== 'community'}
                          />
                          <Button
                            size="sm"
                            onClick={() => updatePopularityBoost(item.id, item.type, popularityBoosts[item.id] || {likes: 0, shares: 0, views: 0, downloads: 0})}
                            className="bg-blue-500 hover:bg-blue-600 text-white text-xs px-3 py-1 rounded-full"
                          >
                            저장
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {/* 페이지네이션 - 20개 이하인 경우에도 표시 */}
              {popularityTotalPages >= 1 && (
                <div className="flex flex-col items-center gap-4 mt-6">
                  {/* 디버그 정보 */}
                  <div className="text-xs text-gray-600">
                    총 데이터: {popularityAllItems.length}개 | 
                    페이지 크기: {popularityPageSize}개 | 
                    총 페이지: {popularityTotalPages}개 | 
                    현재 페이지: {popularityCurrentPage}개
                  </div>
                  
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => handlePageChange(popularityCurrentPage - 1)}
                      disabled={popularityCurrentPage === 1}
                      className="px-3 py-2 bg-white/80 border border-gray-300 rounded-lg hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                    
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, popularityTotalPages) }, (_, i) => {
                        const startPage = Math.max(1, popularityCurrentPage - 2);
                        const pageNum = startPage + i;
                        
                        if (pageNum > popularityTotalPages) return null;
                        
                        return (
                          <button
                            key={pageNum}
                            onClick={() => handlePageChange(pageNum)}
                            className={`w-8 h-8 rounded-lg text-sm font-medium transition-all duration-200 ${
                              pageNum === popularityCurrentPage
                                ? 'bg-blue-500 text-white'
                                : 'bg-white/80 border border-gray-300 text-gray-700 hover:bg-white/90'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>
                    
                    <button
                      onClick={() => handlePageChange(popularityCurrentPage + 1)}
                      disabled={popularityCurrentPage === popularityTotalPages}
                      className="px-3 py-2 bg-white/80 border border-gray-300 rounded-lg hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
              
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default PopularityManagement;
