"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Car, 
  Heart, 
  Share2, 
  Download, 
  Plus,
  Trash2,
  Eye,
  MessageCircle,
  Lock,
  Calendar,
  FileText
} from "lucide-react";
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import CommonHeader from '@/components/CommonHeader';
import PageHeader from '@/components/PageHeader';
import { collection, getDocs, doc, deleteDoc, query, where, orderBy } from 'firebase/firestore';

interface UserDesign {
  id: string;
  name: string;
  type: string;
  thumbnail: string;
  createdAt: string;
  isPublic: boolean;
  description?: string;
  tags?: string[];
  likes?: number;
  downloads?: number;
  views?: number;
  comments?: number;
  blueprintImages?: string[];
}

// 공통 스타일 상수 (일부는 CommonStyles.tsx로 이동됨)
const MENU_BUTTON_STYLES = "bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white hover:bg-white/30 transition-all duration-200 w-[50px] h-[50px] flex items-center justify-center";
const DROPDOWN_STYLES = "absolute top-full right-0 mt-2 w-64 bg-white/90 backdrop-blur-sm border border-white/30 rounded-lg shadow-xl";

export default function MyDesignsPage() {
  const { user } = useAuth();
  const [designs, setDesigns] = useState<UserDesign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [designToDelete, setDesignToDelete] = useState<string | null>(null);


  // Firebase에서 사용자의 디자인 가져오기
  const fetchUserDesigns = async () => {
    if (!user) {
      setDesigns([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const designsRef = collection(db, 'userDesigns');
          const q = query(
            designsRef, 
            where('authorId', '==', user.uid)
          );
      const querySnapshot = await getDocs(q);
      
      const designsData: UserDesign[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        designsData.push({
          id: doc.id,
          name: data.name || 'Untitled',
          type: data.type || 'sedan',
          thumbnail: data.thumbnail || '/api/placeholder/300/200',
          createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          isPublic: data.isPublic || false,
          description: data.description || '',
          tags: data.tags || [],
          likes: data.likes || 0,
          downloads: data.downloads || 0,
          views: data.views || 0,
          comments: data.comments || 0,
          blueprintImages: data.blueprintImages || []
        });
      });
      
      // 클라이언트 사이드에서 최신순 정렬
      designsData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      setDesigns(designsData);
      setError(null);
    } catch (err) {
      console.error('디자인 데이터 로드 실패:', err);
      setError('디자인을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 디자인 삭제 확인 모달 열기
  const handleDeleteClick = (designId: string) => {
    setDesignToDelete(designId);
    setShowDeleteModal(true);
  };

  // 디자인 삭제 취소
  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setDesignToDelete(null);
  };

  // 디자인 삭제 실행
  const deleteDesign = async () => {
    if (!user || !designToDelete) return;

    try {
      await deleteDoc(doc(db, 'userDesigns', designToDelete));
      setDesigns(prevDesigns => prevDesigns.filter(d => d.id !== designToDelete));
      setShowDeleteModal(false);
      setDesignToDelete(null);
    } catch (error) {
      console.error('삭제 실패:', error);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  // PDF 다운로드 함수
  const downloadDesignAsPDF = async (blueprintImages: string[], designName: string) => {
    try {
      // jsPDF 동적 import
      const { default: jsPDF } = await import('jspdf');
      
      // A4 가로 방향으로 PDF 생성 (mm 단위)
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });
      
      // 각 페이지를 PDF에 추가
      for (let i = 0; i < blueprintImages.length; i++) {
        if (i > 0) {
          pdf.addPage(); // 첫 번째 페이지 이후에 새 페이지 추가
        }
        
        // 이미지를 A4 가로 크기로 PDF 페이지에 추가
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        await new Promise((resolve, reject) => {
          img.onload = () => {
            // A4 가로 크기 (297mm x 210mm)로 이미지 추가
            pdf.addImage(img, 'PNG', 0, 0, 297, 210);
            resolve(true);
          };
          img.onerror = reject;
          img.src = blueprintImages[i];
        });
      }
      
      // PDF 다운로드
      pdf.save(`${designName}.pdf`);
      
    } catch (error) {
      console.error('PDF 생성 실패:', error);
      alert('PDF 생성 중 오류가 발생했습니다.');
    }
  };

  // useEffect로 데이터 로드
  useEffect(() => {
    fetchUserDesigns();
  }, [user]);




  return (
    <div 
      className="min-h-screen py-16 md:py-24"
      style={{
        background: 'linear-gradient(130deg, #2563eb, #7c3aed, #ec4899)',
        touchAction: 'pan-y',
        overscrollBehavior: 'none'
      }}
    >
      {/* Common Header */}
      <CommonHeader />
      
      <div className="max-w-7xl mx-auto px-0 md:px-8">
        <div className="mb-6 mt-10 px-4 md:px-0">
          <PageHeader 
            title="나만의 박스카 ✨"
            description="내가 만든 박스카가 여기 모여 있어요! 언제든 친구들에게 자랑해보세요."
          />
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 px-4 md:px-0">
          <Link href="/draw">
            <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 rounded-full px-6 py-3">
              <Plus className="w-4 h-4 mr-2" />
              나만의 박스카 만들기
            </Button>
          </Link>
        </div>

        {/* Loading State */}
        {loading && (
          <Card className="bg-white border-2 border-white/30 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden py-5 w-full rounded-2xl">
            <CardContent className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">디자인을 불러오는 중...</h3>
              <p className="text-gray-600">잠시만 기다려주세요.</p>
            </CardContent>
          </Card>
        )}

        {/* Error State */}
        {error && (
          <Card className="bg-white border-2 border-white/30 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden py-5 w-full rounded-2xl">
            <CardContent className="text-center py-12">
              <div className="text-red-500 text-6xl mb-4">⚠️</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">오류가 발생했습니다</h3>
              <p className="text-gray-600 mb-6">{error}</p>
              <Button 
                variant="outline" 
                onClick={fetchUserDesigns}
                className="bg-white/20 backdrop-blur-sm border border-white/30 text-white hover:bg-white/30 transition-all duration-200"
              >
                다시 시도
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Designs Grid */}
        {!loading && !error && designs.length === 0 ? (
          <Card className="bg-white border-2 border-white/30 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden py-5 w-full rounded-2xl">
            <CardContent className="text-center py-12">
              <Car className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-[16px] font-semibold text-gray-900 mb-2">와! 아직 빈 공간이에요</h3>
              <p className="text-[14px] text-gray-600">멋진 첫 번째 박스카를 만들어보세요!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {designs.map((design) => (
              <Card key={design.id} className="bg-white border-2 border-white/30 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden py-5 w-full rounded-2xl">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg" title={design.name}>
                      {design.name.length > 20 ? `${design.name.substring(0, 20)}...` : design.name}
                    </CardTitle>
                  </div>
                  <div className="text-sm text-gray-500 mb-2">
                    {design.isPublic ? (
                      <div className="flex items-center gap-1">
                        <Share2 className="w-4 h-4 text-green-600" />
                        <span className="text-green-600 font-medium">공개</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <Lock className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-500 font-medium">비공개</span>
                      </div>
                    )}
                  </div>
                  {design.description && (
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                      {design.description}
                    </p>
                  )}
                  {design.tags && design.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {design.tags.slice(0, 3).map((tag, index) => (
                        <span 
                          key={index}
                          className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                        >
                          #{tag}
                        </span>
                      ))}
                      {design.tags.length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                          +{design.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <div className="w-full h-48 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center overflow-hidden">
                      {design.thumbnail && design.thumbnail !== '/api/placeholder/300/200' ? (
                        <img 
                          src={design.thumbnail} 
                          alt={design.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                      ) : null}
                      <div className={`w-full h-full flex items-center justify-center ${design.thumbnail && design.thumbnail !== '/api/placeholder/300/200' ? 'hidden' : ''}`}>
                        <Car className="w-16 h-16 text-gray-400" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center text-sm text-gray-500 mb-4">
                    {design.isPublic ? (
                      // 공개된 경우: 소셜 통계 표시
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <Heart className="w-4 h-4" />
                          {design.likes || 0}
                        </div>
                        <div className="flex items-center gap-1">
                          <Download className="w-4 h-4" />
                          {design.downloads || 0}
                        </div>
                        <div className="flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          {design.views || 0}
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageCircle className="w-4 h-4" />
                          {design.comments || 0}
                        </div>
                      </div>
                    ) : (
                      // 비공개인 경우: 도안 페이지 수만 표시
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <FileText className="w-4 h-4" />
                          {design.blueprintImages?.length || 0}페이지
                        </div>
                      </div>
                    )}
                  </div>
                  
             <div className="flex gap-2">
               <Button 
                 size="sm" 
                 variant="outline" 
                 className="flex-1 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 text-gray-700 hover:bg-white/30 transition-all duration-200"
                 disabled={design.isPublic}
                 onClick={() => {
                   // 커뮤니티 공유 기능 (실제 구현 필요)
                   alert('커뮤니티 공유 기능은 준비 중입니다.');
                 }}
               >
                 <Share2 className="w-4 h-4 mr-1" />
                 {design.isPublic ? '이미 공유됨' : '커뮤니티 공유'}
               </Button>
               <Button 
                 size="sm" 
                 variant="outline" 
                 className="flex-1 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 text-gray-700 hover:bg-white/30 transition-all duration-200"
                 onClick={() => {
                   // PDF 다운로드 기능 - blueprintImages가 있으면 PDF로 다운로드
                   if (design.blueprintImages && design.blueprintImages.length > 0) {
                     downloadDesignAsPDF(design.blueprintImages, design.name);
                   } else {
                     alert('다운로드할 이미지가 없습니다.');
                   }
                 }}
               >
                 <Download className="w-4 h-4 mr-1" />
                 PDF 다운로드
               </Button>
             </div>
                  
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <Button 
                      size="sm" 
                      variant="destructive" 
                      className="w-full rounded-full bg-red-500/20 backdrop-blur-sm border border-red-300/30 text-red-700 hover:bg-red-500/30 transition-all duration-200"
                      onClick={() => handleDeleteClick(design.id)}
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      삭제
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* 삭제 확인 모달 */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-pink-900/20 backdrop-blur-md z-50 flex items-center justify-center">
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-6 max-w-sm w-full mx-6">
            <div className="text-center">
              <div className="text-2xl mb-4">✨</div>
              <h3 className="text-lg font-semibold bg-gradient-to-r from-blue-600 to-pink-600 bg-clip-text text-transparent mb-2">
                삭제하면 되돌릴 수 없어요
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                계속 진행할까요?
              </p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleDeleteCancel}
                  className="flex-1 border-2 border-gray-200 hover:bg-gray-50 hover:border-gray-300"
                >
                  아니요, 남겨둘래요
                </Button>
                <Button
                  onClick={deleteDesign}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                >
                  네, 삭제할래요
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
