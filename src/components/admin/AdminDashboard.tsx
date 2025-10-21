"use client";

import React from 'react';
import { Users, Calendar, MessageCircle, ShoppingBag } from 'lucide-react';

interface AdminStats {
  totalUsers: number;
  totalDesigns: number;
  totalBoxroTalks: number;
  totalLikes: number;
  totalDownloads: number;
  totalShares: number;
  totalViews: number;
  activeUsers: number;
  inactiveUsers: number;
  totalStories: number;
  totalStoreItems: number;
  galleryViews: number;
  galleryBoxroTalks: number;
  galleryLikes: number;
  galleryShares: number;
  galleryDownloads: number;
  storyViews: number;
  storyBoxroTalks: number;
  storyLikes: number;
  storyShares: number;
  storeViews: number;
  storeRedirects: number;
  storeBoxroTalks: number;
  storeLikes: number;
  storeShares: number;
  blueprintDownloads: number;
  firebaseConnected: boolean;
  dbConnected: boolean;
  storageConnected: boolean;
  totalCommits: number;
  lastDeploy: string;
  lastBuild: string;
  todayActiveUsers: number;
  recent24hActivity: number;
  pwaInstallCount: number;
}

interface AdminDashboardProps {
  adminStats: AdminStats;
  loading: boolean;
}

export default function AdminDashboard({ adminStats, loading }: AdminDashboardProps) {
  if (loading) {
    return (
      <div className="bg-white/95 backdrop-blur-sm border border-white/20 rounded-lg p-6 mb-4">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-gray-100 rounded-lg p-6">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-8 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/95 backdrop-blur-sm border border-white/20 rounded-lg p-6 mb-4">
      <h3 className="text-lg font-semibold mb-4">전체 통계</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
        {/* 전체 회원 수 */}
        <div className="bg-white text-gray-900 py-2 gap-2 border border-gray-200 rounded-lg px-8 py-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2 border-b border-gray-200">
            <div className="text-sm font-medium">전체 회원 수</div>
            <Users className="h-4 w-4 text-blue-500" />
          </div>
          <div className="flex flex-row items-end justify-between h-24">
            <div className="text-3xl font-bold text-blue-600">{adminStats.totalUsers}</div>
            <div className="text-right">
              <div className="text-xs text-gray-800">
                활성: {adminStats.activeUsers || 0}<br/>
                비활성: {adminStats.inactiveUsers || 0}<br/>
                활동 사용자 수: {adminStats.todayActiveUsers || 0}<br/>
                활동량: {adminStats.recent24hActivity || 0}<br/>
                PWA 설치수: {adminStats.pwaInstallCount || 0}개
              </div>
            </div>
          </div>
        </div>

        {/* 갤러리 작품 수 */}
        <div className="bg-white text-gray-900 py-2 gap-2 border border-gray-200 rounded-lg px-8 py-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2 border-b border-gray-200">
            <div className="text-sm font-medium">갤러리 작품 수</div>
            <Calendar className="h-4 w-4 text-green-500" />
          </div>
          <div className="flex flex-row items-end justify-between h-24">
            <div className="text-3xl font-bold text-green-600">{adminStats.totalDesigns}</div>
            <div className="text-right">
              <div className="text-xs text-gray-800">
                좋아요: {adminStats.galleryLikes||0}<br/>
                공유: {adminStats.galleryShares||0}<br/>
                박스로 톡: {adminStats.galleryBoxroTalks||0}<br/>
                다운로드: {adminStats.galleryDownloads||0}<br/>
                조회: {adminStats.galleryViews||0}
              </div>
            </div>
          </div>
        </div>

        {/* 발행된 이야기 수 */}
        <div className="bg-white text-gray-900 py-2 gap-2 border border-gray-200 rounded-lg px-8 py-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2 border-b border-gray-200">
            <div className="text-sm font-medium">발행된 이야기 수</div>
            <MessageCircle className="h-4 w-4 text-purple-500" />
          </div>
          <div className="flex flex-row items-end justify-between h-24">
            <div className="text-3xl font-bold text-purple-600">{adminStats.totalStories || 0}</div>
            <div className="text-right">
              <div className="text-xs text-gray-800">
                좋아요: {adminStats.storyLikes||0}<br/>
                공유: {adminStats.storyShares||0}<br/>
                박스로 톡: {adminStats.storyBoxroTalks||0}<br/>
                조회: {adminStats.storyViews||0}
              </div>
            </div>
          </div>
        </div>

        {/* 스토어 도안 수 */}
        <div className="bg-white text-gray-900 py-2 gap-2 border border-gray-200 rounded-lg px-8 py-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2 border-b border-gray-200">
            <div className="text-sm font-medium">스토어 도안 수</div>
            <ShoppingBag className="h-4 w-4 text-orange-500" />
          </div>
          <div className="flex flex-row items-end justify-between h-24">
            <div className="text-3xl font-bold text-orange-600">{adminStats.totalStoreItems || 0}</div>
            <div className="text-right">
              <div className="text-xs text-gray-800">
                좋아요: {adminStats.storeLikes||0}<br/>
                공유: {adminStats.storeShares||0}<br/>
                박스로 톡: {adminStats.storeBoxroTalks||0}<br/>
                조회: {adminStats.storeViews||0}<br/>
                스토어 바로가기: {adminStats.storeRedirects||0}
              </div>
            </div>
          </div>
        </div>

        {/* 시스템 상태 */}
        <div className="bg-white text-gray-900 py-2 gap-2 border border-gray-200 rounded-lg px-8 py-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2 border-b border-gray-200">
            <div className="text-sm font-medium">시스템 상태</div>
            <div className={`w-4 h-4 rounded-full ${adminStats.firebaseConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          </div>
          <div className="flex flex-row items-end justify-between h-24">
            <div className={`text-3xl font-bold ${adminStats.firebaseConnected ? 'text-green-600' : 'text-red-600'}`}>
              {adminStats.firebaseConnected ? '정상' : '오류'}
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-800">
                Firebase: {adminStats.firebaseConnected ? '연결됨' : '실패'}<br/>
                DB: {adminStats.dbConnected ? '정상' : '오류'}<br/>
                스토리지: {adminStats.storageConnected ? '정상' : '오류'}
              </div>
            </div>
          </div>
        </div>

        {/* 프로젝트 정보 */}
        <div className="bg-white text-gray-900 py-2 gap-2 border border-gray-200 rounded-lg px-8 py-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2 border-b border-gray-200">
            <div className="text-sm font-medium">프로젝트 정보</div>
            <div className="w-4 h-4 rounded-full bg-blue-500"></div>
          </div>
          <div className="flex flex-row items-end justify-between h-24">
            <div className="text-3xl font-bold text-blue-600">
              v1.0.0
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-800">
                커밋: {adminStats.totalCommits || 'N/A'}<br/>
                배포: {adminStats.lastDeploy || 'N/A'}<br/>
                빌드: {adminStats.lastBuild || 'N/A'}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-xs text-blue-800">
          • <strong>회원 기준:</strong><br/>
            &nbsp;&nbsp;- <strong>활성 회원:</strong> 도안 만들기, 도안 다운로드, 갤러리 공유, 갤러리/이야기 박스로 톡 작성 중 하나 이상 활동한 회원<br/>
            &nbsp;&nbsp;- <strong>비활성 회원:</strong> 회원가입만 하고 아직 활동이 없는 회원<br/>
            &nbsp;&nbsp;- <strong>활동 사용자 수(최근 24시간):</strong> 작품을 만들거나 박스로톡을 작성한 사용자만 카운트(단순히 로그인만 한 사용자는 카운트 안 됨)<br/>
            &nbsp;&nbsp;- <strong>활동량(최근 24시간):</strong> 최근 24시간 동안의 작품 생성 + 박스로톡 작성 수(같은 사용자가 여러 번 활동하면 모두 카운트됨)<br/>
            &nbsp;&nbsp;- <strong>피크 시간(최근 30일):</strong> 최근 30일간의 활동 데이터를 시간대별로 분석<br/>
          • <strong>통계 계산 기준:</strong><br/>
            &nbsp;&nbsp;- <strong>조회수:</strong> 로그인한 사용자만 카운트 (여러 번 조회해도 매번 카운트)<br/>
            &nbsp;&nbsp;- <strong>좋아요:</strong> 로그인한 사용자만 카운트 (1회만 카운트)<br/>
            &nbsp;&nbsp;- <strong>공유:</strong> 로그인 + 비로그인 사용자 모두 카운트 (여러 번 공유해도 매번 카운트)<br/>
            &nbsp;&nbsp;- <strong>박스로 톡:</strong> 로그인한 사용자만 카운트 (여러 번 작성 가능)<br/>
            &nbsp;&nbsp;- <strong>다운로드:</strong> 로그인한 사용자만 카운트 (여러 번 다운로드해도 매번 카운트)<br/>
            &nbsp;&nbsp;- <strong>스토어 바로가기:</strong> 로그인 + 비로그인 사용자 모두 카운트 (여러 번 바로가기해도 매번 카운트)<br/>
            &nbsp;&nbsp;- <strong>통계 수치:</strong> 전체 합계(로그인 합계 + 비로그인 합계)
        </p>
      </div>
    </div>
  );
}
