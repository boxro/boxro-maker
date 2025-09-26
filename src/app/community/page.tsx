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
  Search,
  Filter,
  TrendingUp,
  Users,
  Star,
  Plus,
  MessageCircle,
  Eye
} from "lucide-react";
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import CommonHeader from '@/components/CommonHeader';
import PageHeader from '@/components/PageHeader';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, orderBy, where, limit } from 'firebase/firestore';

interface CommunityDesign {
  id: string;
  name: string;
  type: string;
  author: string;
  authorEmail: string;
  thumbnail: string;
  likes: number;
  downloads: number;
  views: number;
  comments: number;
  createdAt: string;
  updatedAt: string;
  isLiked: boolean;
  description?: string;
  tags?: string[];
}

export default function CommunityPage() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("trending");
  const [designs, setDesigns] = useState<CommunityDesign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);


  // Firebase에서 디자인 데이터 가져오기
  const fetchDesigns = async () => {
    try {
      setLoading(true);
      
      // 인증 상태 확인
      if (!user) {
        console.log('사용자가 로그인되지 않았습니다.');
        setDesigns([]);
        setLoading(false);
        return;
      }
      
      const designsRef = collection(db, 'communityDesigns');
      const q = query(designsRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const designsData: CommunityDesign[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        designsData.push({
          id: doc.id,
          name: data.name || 'Untitled',
          type: data.type || 'sedan',
          author: data.author || 'Anonymous',
          authorEmail: data.authorEmail || '',
          thumbnail: data.thumbnail || '/api/placeholder/300/200',
          likes: data.likes || 0,
          downloads: data.downloads || 0,
          views: data.views || 0,
          comments: data.comments || 0,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          isLiked: data.likedBy?.includes(user?.uid) || false,
          description: data.description || '',
          tags: data.tags || []
        });
      });
      
      setDesigns(designsData);
      setError(null);
    } catch (err) {
      console.error('디자인 데이터 로드 실패:', err);
      setError('디자인을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    fetchDesigns();
  }, []);

  // 좋아요 토글 함수
  const toggleLike = async (designId: string) => {
    if (!user) {
      alert('로그인이 필요합니다.');
      return;
    }

    try {
      const designRef = doc(db, 'communityDesigns', designId);
      const design = designs.find(d => d.id === designId);
      
      if (!design) return;

      const isCurrentlyLiked = design.isLiked;
      const newLikes = isCurrentlyLiked ? design.likes - 1 : design.likes + 1;
      
      // Firebase 업데이트
      await updateDoc(designRef, {
        likes: newLikes,
        likedBy: isCurrentlyLiked 
          ? design.likedBy?.filter((uid: string) => uid !== user.uid) || []
          : [...(design.likedBy || []), user.uid]
      });

      // 로컬 상태 업데이트
      setDesigns(prevDesigns => 
        prevDesigns.map(d => 
          d.id === designId 
            ? { ...d, likes: newLikes, isLiked: !isCurrentlyLiked }
            : d
        )
      );
    } catch (error) {
      console.error('좋아요 토글 실패:', error);
      alert('좋아요 처리 중 오류가 발생했습니다.');
    }
  };

  // 다운로드 함수
  const handleDownload = async (designId: string) => {
    try {
      const designRef = doc(db, 'communityDesigns', designId);
      const design = designs.find(d => d.id === designId);
      
      if (!design) return;

      // 다운로드 수 증가
      await updateDoc(designRef, {
        downloads: design.downloads + 1
      });

      // 로컬 상태 업데이트
      setDesigns(prevDesigns => 
        prevDesigns.map(d => 
          d.id === designId 
            ? { ...d, downloads: d.downloads + 1 }
            : d
        )
      );

      // 실제 다운로드 로직 (여기서는 알림만)
      alert('다운로드가 시작됩니다!');
    } catch (error) {
      console.error('다운로드 실패:', error);
      alert('다운로드 중 오류가 발생했습니다.');
    }
  };

  const filteredAndSortedDesigns = designs
    .filter(design => {
      const matchesSearch = design.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           design.author.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filterType === "all" || design.type === filterType;
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "trending":
          return (b.likes + b.downloads) - (a.likes + a.downloads);
        case "newest":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "popular":
          return b.likes - a.likes;
        case "downloads":
          return b.downloads - a.downloads;
        default:
          return 0;
      }
    });

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'sedan': return 'bg-blue-100 text-blue-800'; // 꼬마세단(sedan)
      case 'suv': return 'bg-green-100 text-green-800'; // SUV(suv)
      case 'truck': return 'bg-orange-100 text-orange-800'; // 빵빵트럭(truck)
      case 'bus': return 'bg-purple-100 text-purple-800'; // 네모버스(bus)
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const shareDesign = (designId: string) => {
    const shareUrl = `${window.location.origin}/design/${designId}`;
    navigator.clipboard.writeText(shareUrl);
    alert('공유 링크가 클립보드에 복사되었습니다!');
  };

  return (
    <div 
      className="min-h-screen py-16 md:py-24"
      style={{
        background: 'linear-gradient(100deg, #2563eb, #7c3aed, #ec4899)',
        touchAction: 'pan-y',
        overscrollBehavior: 'none'
      }}
    >
      {/* Common Header */}
      <CommonHeader />
      
      <div className="max-w-7xl mx-auto px-0 md:px-8">
        <div className="mb-6 mt-10 px-4 md:px-0">
          <PageHeader 
            title="커뮤니티"
            description="다른 친구들의 작품도 구경하고, 내가 만든 박스카도 뽐내보세요!"
          />
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 px-4 md:px-0">
          <Link href="/draw">
            <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 rounded-full px-6 py-3">
              <Plus className="w-4 h-4 mr-2" />
              내 디자인 공유하기
            </Button>
          </Link>
        </div>

        {/* Search and Filter */}
        <Card className="bg-white border-2 border-white/30 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden py-5 w-full rounded-2xl mb-6">
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="디자인이나 창작자 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex gap-2">
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">모든 유형</option>
                  <option value="sedan">꼬마세단(sedan)</option>
                  <option value="suv">SUV(suv)</option>
                  <option value="truck">빵빵트럭(truck)</option>
                  <option value="bus">네모버스(bus)</option>
                </select>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="trending">인기순</option>
                  <option value="newest">최신순</option>
                  <option value="popular">좋아요순</option>
                  <option value="downloads">다운로드순</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-white border-2 border-white/30 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden py-5 w-full rounded-2xl">
            <CardContent>
              <div className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{designs.length}</div>
                <div className="text-sm text-gray-600">전체 디자인</div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white border-2 border-white/30 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden py-5 w-full rounded-2xl">
            <CardContent>
              <div className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {designs.reduce((sum, d) => sum + d.likes, 0)}
                </div>
                <div className="text-sm text-gray-600">전체 좋아요</div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white border-2 border-white/30 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden py-5 w-full rounded-2xl">
            <CardContent>
              <div className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {designs.reduce((sum, d) => sum + d.downloads, 0)}
                </div>
                <div className="text-sm text-gray-600">전체 다운로드</div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white border-2 border-white/30 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden py-5 w-full rounded-2xl">
            <CardContent>
              <div className="p-4 text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {new Set(designs.map(d => d.author)).size}
                </div>
                <div className="text-sm text-gray-600">창작자</div>
              </div>
            </CardContent>
          </Card>
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
              <div className="text-red-500 text-4xl mb-4">⚠️</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">오류가 발생했습니다</h3>
              <p className="text-gray-600 mb-6">{error}</p>
              <Button 
                onClick={fetchDesigns}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 rounded-full px-6 py-3"
              >
                다시 시도
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Designs Grid */}
        {!loading && !error && filteredAndSortedDesigns.length === 0 ? (
          <Card className="bg-white border-2 border-white/30 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden py-5 w-full rounded-2xl">
            <CardContent className="text-center py-12">
              <Car className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">디자인이 없습니다</h3>
              <p className="text-gray-600 mb-6">
                {searchTerm || filterType !== "all" 
                  ? "검색어나 필터 조건을 조정해보세요"
                  : "첫 번째로 디자인을 공유해보세요!"
                }
              </p>
              <Link href="/draw">
                <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 rounded-full px-6 py-3">
                  <Car className="w-4 h-4 mr-2" />
                  디자인 만들고 공유하기
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSortedDesigns.map((design) => (
              <Card key={design.id} className="bg-white border-2 border-white/30 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden py-5 w-full rounded-2xl">
                <div className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="text-lg font-semibold">{design.name}</div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(design.type)}`}>
                      {design.type === 'sedan' ? '꼬마세단(sedan)' : design.type === 'suv' ? 'SUV(suv)' : design.type === 'truck' ? '빵빵트럭(truck)' : design.type === 'bus' ? '네모버스(bus)' : design.type}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500 mb-2">
                    by <span className="font-medium">{design.author}</span>
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
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <Heart className="w-4 h-4" />
                        {design.likes}
                      </div>
                      <div className="flex items-center gap-1">
                        <Download className="w-4 h-4" />
                        {design.downloads}
                      </div>
                      <div className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        {design.views}
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageCircle className="w-4 h-4" />
                        {design.comments}
                      </div>
                    </div>
                    <span>{new Date(design.createdAt).toLocaleDateString()}</span>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      variant={design.isLiked ? "default" : "outline"}
                      onClick={() => toggleLike(design.id)}
                      className={`flex-1 ${design.isLiked 
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white' 
                        : 'bg-white/20 backdrop-blur-sm border border-white/30 text-white hover:bg-white/30'
                      }`}
                    >
                      <Heart className={`w-4 h-4 mr-1 ${design.isLiked ? 'fill-current' : ''}`} />
                      {design.isLiked ? '좋아요 취소' : '좋아요'}
                    </Button>
                    <Button 
                      variant="outline" 
                      className="flex-1 bg-white/20 backdrop-blur-sm border border-white/30 text-white hover:bg-white/30"
                      onClick={() => handleDownload(design.id)}
                    >
                      <Download className="w-4 h-4 mr-1" />
                      다운로드
                    </Button>
                    <Button 
                      variant="outline"
                      className="bg-white/20 backdrop-blur-sm border border-white/30 text-white hover:bg-white/30"
                      onClick={() => shareDesign(design.id)}
                    >
                      <Share2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Featured Creators */}
        <Card className="bg-white border-2 border-white/30 shadow-xl hover:shadow-2xl transition-all duration-300 rounded-2xl overflow-hidden mt-8 w-full">
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <Star className="w-5 h-5 mr-2 text-yellow-500" />
              인기 창작자
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {['CarDesigner123', 'TruckMaster', 'FamilyDesigns'].map((creator, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="font-medium">{creator}</div>
                    <div className="text-sm text-gray-500">
                      {designs.filter(d => d.author === creator).length}개 디자인
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

