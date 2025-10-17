"use client";

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowUp, ArrowDown, Eye, Trash2, Download, Share2, MessageCircle, Heart } from 'lucide-react';
import Image from 'next/image';

interface UserStats {
  email: string;
  displayName: string;
  photoURL: string;
  createdAt: any;
  lastSignIn: string;
  designsCount: number;
  boxroTalksCount: number;
  likesCount: number;
  downloadsCount: number;
  sharesCount: number;
  viewsCount: number;
  storeRedirectsCount: number;
  uid: string;
  authorNickname?: string;
}

interface UserStatisticsProps {
  // Loading states
  userStatsLoading: boolean;
  
  // Data
  userStats: UserStats[];
  
  // Search and filter states
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  statusFilter: string;
  setStatusFilter: (filter: string) => void;
  sortBy: string;
  setSortBy: (sort: string) => void;
  userStatsPageSize: number;
  handleUserStatsPageSizeChange: (size: number) => void;
  
  // Table sort states
  tableSortField: string;
  setTableSortField: (field: string) => void;
  tableSortDirection: 'asc' | 'desc';
  setTableSortDirection: (direction: 'asc' | 'desc') => void;
  
  // Functions
  getFilteredUserStats: () => UserStats[];
  handleUserStatsPageChange: (page: number) => void;
  userStatsTotalPages: number;
  userStatsCurrentPage: number;
  deleteUser: (uid: string) => Promise<void>;
  deletingUser: string | null;
}

const UserStatistics: React.FC<UserStatisticsProps> = ({
  userStatsLoading,
  userStats,
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  sortBy,
  setSortBy,
  userStatsPageSize,
  handleUserStatsPageSizeChange,
  tableSortField,
  setTableSortField,
  tableSortDirection,
  setTableSortDirection,
  getFilteredUserStats,
  handleUserStatsPageChange,
  userStatsTotalPages,
  userStatsCurrentPage,
  deleteUser,
  deletingUser,
}) => {
  return (
    <>
      {/* 회원 리스트 */}
      <div className="bg-white/95 backdrop-blur-sm border border-white/20 rounded-lg p-6 mb-4">
        <h3 className="text-lg font-semibold mb-4">
          회원 통계
        </h3>

        {/* 검색 및 필터 */}
        <div className="flex flex-col lg:flex-row gap-3 mb-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="이메일 또는 이름으로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-6 py-2 rounded-md bg-white text-[14px] border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-3 min-w-0">
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-md bg-white text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-0 flex-1 sm:flex-none"
            >
              <option value="">전체 회원</option>
              <option value="active">활성 회원</option>
              <option value="inactive">비활성 회원</option>
            </select>
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 rounded-md bg-white text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-0 flex-1 sm:flex-none"
            >
              <option value="recent">최근 가입순</option>
              <option value="oldest">오래된 가입순</option>
              <option value="name">이름순</option>
              <option value="email">이메일순</option>
            </select>
            <select
              value={userStatsPageSize}
              onChange={(e) => handleUserStatsPageSizeChange(Number(e.target.value))}
              className="px-3 py-2 rounded-md bg-white text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-0 flex-1 sm:flex-none"
            >
              <option value={20}>20개</option>
              <option value={30}>30개</option>
              <option value={50}>50개</option>
              <option value={100}>100개</option>
            </select>
          </div>
        </div>

        {userStatsLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">회원 데이터를 불러오는 중...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px]">
              <thead>
                <tr className="border-b-2 border-gray-300">
                  <th className="text-left py-3 px-1 text-[13px] font-medium text-gray-800 w-40">
                    <button
                      onClick={() => {
                        if (tableSortField === 'email') {
                          setTableSortDirection(tableSortDirection === 'asc' ? 'desc' : 'asc');
                        } else {
                          setTableSortField('email');
                          setTableSortDirection('asc');
                        }
                      }}
                      className="flex items-center gap-1 hover:text-blue-600 transition-colors"
                    >
                      이메일
                      {tableSortField === 'email' && (
                        tableSortDirection === 'desc' ? <ArrowDown className="w-2.5 h-2.5" /> : <ArrowUp className="w-2.5 h-2.5" />
                      )}
                    </button>
                  </th>
                  <th className="text-left py-3 px-1 text-[13px] font-medium text-gray-800 w-40">
                    <button
                      onClick={() => {
                        if (tableSortField === 'displayName') {
                          setTableSortDirection(tableSortDirection === 'asc' ? 'desc' : 'asc');
                        } else {
                          setTableSortField('displayName');
                          setTableSortDirection('asc');
                        }
                      }}
                      className="flex items-center gap-1 hover:text-blue-600 transition-colors"
                    >
                      이름
                      {tableSortField === 'displayName' && (
                        tableSortDirection === 'desc' ? <ArrowDown className="w-2.5 h-2.5" /> : <ArrowUp className="w-2.5 h-2.5" />
                      )}
                    </button>
                  </th>
                  <th className="text-center py-3 px-1 text-[13px] font-medium text-gray-800 w-20">
                    <button
                      onClick={() => {
                        if (tableSortField === 'createdAt') {
                          setTableSortDirection(tableSortDirection === 'asc' ? 'desc' : 'asc');
                        } else {
                          setTableSortField('createdAt');
                          setTableSortDirection('asc');
                        }
                      }}
                      className="flex items-center gap-1 hover:text-blue-600 transition-colors"
                    >
                      가입일
                      {tableSortField === 'createdAt' && (
                        tableSortDirection === 'desc' ? <ArrowDown className="w-2.5 h-2.5" /> : <ArrowUp className="w-2.5 h-2.5" />
                      )}
                    </button>
                  </th>
                  <th className="text-center py-3 px-1 text-[13px] font-medium text-gray-800 w-20">
                    <button
                      onClick={() => {
                        if (tableSortField === 'lastSignIn') {
                          setTableSortDirection(tableSortDirection === 'asc' ? 'desc' : 'asc');
                        } else {
                          setTableSortField('lastSignIn');
                          setTableSortDirection('asc');
                        }
                      }}
                      className="flex items-center gap-1 hover:text-blue-600 transition-colors"
                    >
                      최근 로그인
                      {tableSortField === 'lastSignIn' && (
                        tableSortDirection === 'desc' ? <ArrowDown className="w-2.5 h-2.5" /> : <ArrowUp className="w-2.5 h-2.5" />
                      )}
                    </button>
                  </th>
                  <th className="text-center py-3 px-1 text-[13px] font-medium text-gray-800 w-16">
                    <button
                      onClick={() => {
                        if (tableSortField === 'designsCount') {
                          setTableSortDirection(tableSortDirection === 'asc' ? 'desc' : 'asc');
                        } else {
                          setTableSortField('designsCount');
                          setTableSortDirection('asc');
                        }
                      }}
                      className="flex items-center gap-1 hover:text-blue-600 transition-colors"
                    >
                      작품
                      {tableSortField === 'designsCount' && (
                        tableSortDirection === 'desc' ? <ArrowDown className="w-2.5 h-2.5" /> : <ArrowUp className="w-2.5 h-2.5" />
                      )}
                    </button>
                  </th>
                  <th className="text-center py-3 px-1 text-[13px] font-medium text-gray-800 w-16">
                    <button
                      onClick={() => {
                        if (tableSortField === 'boxroTalksCount') {
                          setTableSortDirection(tableSortDirection === 'asc' ? 'desc' : 'asc');
                        } else {
                          setTableSortField('boxroTalksCount');
                          setTableSortDirection('asc');
                        }
                      }}
                      className="flex items-center gap-1 hover:text-blue-600 transition-colors"
                    >
                      박스로톡
                      {tableSortField === 'boxroTalksCount' && (
                        tableSortDirection === 'desc' ? <ArrowDown className="w-2.5 h-2.5" /> : <ArrowUp className="w-2.5 h-2.5" />
                      )}
                    </button>
                  </th>
                  <th className="text-center py-3 px-1 text-[13px] font-medium text-gray-800 w-16">
                    <button
                      onClick={() => {
                        if (tableSortField === 'likesCount') {
                          setTableSortDirection(tableSortDirection === 'asc' ? 'desc' : 'asc');
                        } else {
                          setTableSortField('likesCount');
                          setTableSortDirection('asc');
                        }
                      }}
                      className="flex items-center gap-1 hover:text-blue-600 transition-colors"
                    >
                      좋아요
                      {tableSortField === 'likesCount' && (
                        tableSortDirection === 'desc' ? <ArrowDown className="w-2.5 h-2.5" /> : <ArrowUp className="w-2.5 h-2.5" />
                      )}
                    </button>
                  </th>
                  <th className="text-center py-3 px-1 text-[13px] font-medium text-gray-800 w-16">
                    <button
                      onClick={() => {
                        if (tableSortField === 'downloadsCount') {
                          setTableSortDirection(tableSortDirection === 'asc' ? 'desc' : 'asc');
                        } else {
                          setTableSortField('downloadsCount');
                          setTableSortDirection('asc');
                        }
                      }}
                      className="flex items-center gap-1 hover:text-blue-600 transition-colors"
                    >
                      다운로드
                      {tableSortField === 'downloadsCount' && (
                        tableSortDirection === 'desc' ? <ArrowDown className="w-2.5 h-2.5" /> : <ArrowUp className="w-2.5 h-2.5" />
                      )}
                    </button>
                  </th>
                  <th className="text-center py-3 px-1 text-[13px] font-medium text-gray-800 w-16">
                    <button
                      onClick={() => {
                        if (tableSortField === 'sharesCount') {
                          setTableSortDirection(tableSortDirection === 'asc' ? 'desc' : 'asc');
                        } else {
                          setTableSortField('sharesCount');
                          setTableSortDirection('asc');
                        }
                      }}
                      className="flex items-center gap-1 hover:text-blue-600 transition-colors"
                    >
                      공유
                      {tableSortField === 'sharesCount' && (
                        tableSortDirection === 'desc' ? <ArrowDown className="w-2.5 h-2.5" /> : <ArrowUp className="w-2.5 h-2.5" />
                      )}
                    </button>
                  </th>
                  <th className="text-center py-3 px-1 text-[13px] font-medium text-gray-800 w-16">
                    <button
                      onClick={() => {
                        if (tableSortField === 'viewsCount') {
                          setTableSortDirection(tableSortDirection === 'asc' ? 'desc' : 'asc');
                        } else {
                          setTableSortField('viewsCount');
                          setTableSortDirection('asc');
                        }
                      }}
                      className="flex items-center gap-1 hover:text-blue-600 transition-colors"
                    >
                      조회
                      {tableSortField === 'viewsCount' && (
                        tableSortDirection === 'desc' ? <ArrowDown className="w-2.5 h-2.5" /> : <ArrowUp className="w-2.5 h-2.5" />
                      )}
                    </button>
                  </th>
                  <th className="text-center py-3 px-1 text-[13px] font-medium text-gray-800 w-16">
                    <button
                      onClick={() => {
                        if (tableSortField === 'storeRedirectsCount') {
                          setTableSortDirection(tableSortDirection === 'asc' ? 'desc' : 'asc');
                        } else {
                          setTableSortField('storeRedirectsCount');
                          setTableSortDirection('asc');
                        }
                      }}
                      className="flex items-center gap-1 hover:text-blue-600 transition-colors"
                    >
                      스토어
                      {tableSortField === 'storeRedirectsCount' && (
                        tableSortDirection === 'desc' ? <ArrowDown className="w-2.5 h-2.5" /> : <ArrowUp className="w-2.5 h-2.5" />
                      )}
                    </button>
                  </th>
                  <th className="text-center py-3 px-1 text-[13px] font-medium text-gray-800 w-20">액션</th>
                </tr>
              </thead>
              <tbody>
                {getFilteredUserStats().map((user) => (
                  <tr key={user.uid} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="py-3 px-1 w-40">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                          {user.photoURL ? (
                            <Image
                              src={user.photoURL}
                              alt={user.displayName}
                              width={32}
                              height={32}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                              <span className="text-gray-600 text-xs font-medium">
                                {user.displayName?.charAt(0) || user.email?.charAt(0) || '?'}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-1 w-40">
                      <div className="text-sm text-gray-900 truncate">
                        {user.displayName || user.authorNickname || '이름 없음'}
                      </div>
                    </td>
                    <td className="py-3 px-1 w-20 text-center">
                      <div className="text-xs text-gray-600">
                        {new Date(user.createdAt?.toDate?.() || user.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="py-3 px-1 w-20 text-center">
                      <div className="text-xs text-gray-600">
                        {user.lastSignIn ? new Date(user.lastSignIn).toLocaleDateString() : '없음'}
                      </div>
                    </td>
                    <td className="py-3 px-1 w-16 text-center">
                      <div className="text-sm font-medium text-blue-600">
                        {user.designsCount || 0}
                      </div>
                    </td>
                    <td className="py-3 px-1 w-16 text-center">
                      <div className="text-sm font-medium text-green-600">
                        {user.boxroTalksCount || 0}
                      </div>
                    </td>
                    <td className="py-3 px-1 w-16 text-center">
                      <div className="text-sm font-medium text-red-600">
                        {user.likesCount || 0}
                      </div>
                    </td>
                    <td className="py-3 px-1 w-16 text-center">
                      <div className="text-sm font-medium text-purple-600">
                        {user.downloadsCount || 0}
                      </div>
                    </td>
                    <td className="py-3 px-1 w-16 text-center">
                      <div className="text-sm font-medium text-orange-600">
                        {user.sharesCount || 0}
                      </div>
                    </td>
                    <td className="py-3 px-1 w-16 text-center">
                      <div className="text-sm font-medium text-indigo-600">
                        {user.viewsCount || 0}
                      </div>
                    </td>
                    <td className="py-3 px-1 w-16 text-center">
                      <div className="text-sm font-medium text-teal-600">
                        {user.storeRedirectsCount || 0}
                      </div>
                    </td>
                    <td className="py-3 px-1 w-20 text-center">
                      <div className="flex justify-center gap-1">
                        <Button
                          size="sm"
                          onClick={() => deleteUser(user.uid)}
                          disabled={deletingUser === user.uid}
                          className="bg-red-500 hover:bg-red-600 text-white rounded-full w-8 h-8 p-0"
                        >
                          {deletingUser === user.uid ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 페이지네이션 */}
        {userStatsTotalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-6">
            <Button
              onClick={() => handleUserStatsPageChange(userStatsCurrentPage - 1)}
              disabled={userStatsCurrentPage === 1}
              className="px-3 py-2 bg-white/80 border border-gray-300 rounded-lg hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              <ArrowUp className="w-4 h-4 rotate-90" />
            </Button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, userStatsTotalPages) }, (_, i) => {
                const startPage = Math.max(1, userStatsCurrentPage - 2);
                const pageNum = startPage + i;
                
                if (pageNum > userStatsTotalPages) return null;
                
                return (
                  <Button
                    key={pageNum}
                    onClick={() => handleUserStatsPageChange(pageNum)}
                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-all duration-200 ${
                      pageNum === userStatsCurrentPage
                        ? 'bg-blue-500 text-white'
                        : 'bg-white/80 border border-gray-300 text-gray-700 hover:bg-white/90'
                    }`}
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            
            <Button
              onClick={() => handleUserStatsPageChange(userStatsCurrentPage + 1)}
              disabled={userStatsCurrentPage === userStatsTotalPages}
              className="px-3 py-2 bg-white/80 border border-gray-300 rounded-lg hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              <ArrowDown className="w-4 h-4 rotate-90" />
            </Button>
          </div>
        )}
      </div>
    </>
  );
};

export default UserStatistics;
