"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  ArrowLeft,
  Calendar,
  User,
  Heart,
  Share2,
  Edit,
  Trash2,
  Eye
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useMagazine } from "@/contexts/MagazineContext";
import CommonHeader from "@/components/CommonHeader";

interface MagazineArticle {
  id: string;
  title: string;
  content: string;
  author: string;
  authorEmail: string;
  authorId: string;
  thumbnail: string;
  summary: string;
  tags: string[];
  views: number;
  likes: number;
  isPublished: boolean;
  createdAt: any;
  updatedAt: any;
}

export default function MagazineArticlePage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { articles, deleteArticle: contextDeleteArticle } = useMagazine();
  const router = useRouter();
  const [article, setArticle] = useState<MagazineArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // 관리자 이메일 목록
  const adminEmails = [
    "admin@boxro.com",
    "dongwoo.kang@boxro.com",
    "beagle3651@gmail.com",
    "boxro.crafts@gmail.com"
  ];

  // 관리자 권한 확인
  useEffect(() => {
    if (user && adminEmails.includes(user.email || "")) {
      setIsAdmin(true);
    } else {
      setIsAdmin(false);
    }
  }, [user]);

  // 매거진 글 가져오기
  const fetchArticle = async () => {
    try {
      setLoading(true);
      
      if (process.env.NODE_ENV === 'development') {
        console.log('개발 환경: Context에서 매거진 글 데이터 사용');
        const articleFromContext = articles.find(a => a.id === id);
        if (articleFromContext) {
          setArticle(articleFromContext);
        } else {
          setError('글이 존재하지 않습니다. (개발 환경)');
        }
        setLoading(false);
        return;
      }
      
      // 프로덕션 환경에서는 Firebase에서 가져오기
      const { doc, getDoc, updateDoc } = await import("firebase/firestore");
      const { db } = await import("@/lib/firebase");
      
      const articleRef = doc(db, 'magazineArticles', id as string);
      const articleSnap = await getDoc(articleRef);
      
      if (articleSnap.exists()) {
        const articleData = {
          id: articleSnap.id,
          ...articleSnap.data()
        } as MagazineArticle;
        
        setArticle(articleData);
        
        // 조회수 증가
        await updateDoc(articleRef, {
          views: (articleData.views || 0) + 1
        });
      } else {
        setError('글이 존재하지 않습니다.');
      }
    } catch (error) {
      console.error('글 로드 실패:', error);
      setError('글을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 글 삭제
  const deleteArticle = async () => {
    if (!user || !isAdmin) return;
    
    if (!confirm('정말로 이 글을 삭제하시겠습니까?')) {
      return;
    }

    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('개발 환경: Context에서 글 삭제');
        contextDeleteArticle(id as string);
        alert('글이 삭제되었습니다. (개발 환경)');
        router.push('/magazine');
        return;
      }
      
      // 프로덕션 환경에서는 Firebase에서 삭제
      const { doc, deleteDoc } = await import("firebase/firestore");
      const { db } = await import("@/lib/firebase");
      
      await deleteDoc(doc(db, 'magazineArticles', id as string));
      alert('글이 삭제되었습니다.');
      router.push('/magazine');
    } catch (error) {
      console.error('삭제 실패:', error);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  // 좋아요 토글
  const toggleLike = async () => {
    if (!user) {
      alert('로그인이 필요합니다.');
      return;
    }
    
    if (!article) return;

    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('개발 환경: 로컬에서 좋아요 증가');
        setArticle(prev => prev ? { ...prev, likes: (prev.likes || 0) + 1 } : null);
        return;
      }
      
      // 프로덕션 환경에서는 Firebase에서 업데이트
      const { doc, updateDoc } = await import("firebase/firestore");
      const { db } = await import("@/lib/firebase");
      
      const articleRef = doc(db, 'magazineArticles', id as string);
      await updateDoc(articleRef, {
        likes: (article.likes || 0) + 1
      });
      
      setArticle(prev => prev ? { ...prev, likes: (prev.likes || 0) + 1 } : null);
    } catch (error) {
      console.error('좋아요 실패:', error);
    }
  };

  // 공유하기
  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/magazine/${id}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: article?.title,
          text: article?.summary,
          url: shareUrl
        });
      } catch (error) {
        console.log('공유 취소됨');
      }
    } else {
      await navigator.clipboard.writeText(shareUrl);
      alert('링크가 클립보드에 복사되었습니다!');
    }
  };

  useEffect(() => {
    if (id) {
      fetchArticle();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">글을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || '글을 찾을 수 없습니다.'}</p>
          <Link href="/magazine">
            <Button>목록으로 돌아가기</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-16" style={{ background: 'linear-gradient(100deg, #2563eb, #7c3aed, #ec4899)' }}>
      <CommonHeader />
      <div className="max-w-7xl mx-auto px-0 md:px-8">
        <div className="mb-6 mt-10 px-4 md:px-0">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex gap-2">
              <Link href="/magazine">
                <Button variant="outline" className="bg-white/20 backdrop-blur-sm border border-white/30 text-white hover:bg-white/30">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  뒤로가기
                </Button>
              </Link>
              {isAdmin && (
                <>
                  <Link href={`/magazine/edit/${article.id}`}>
                    <Button variant="outline" className="bg-white/20 backdrop-blur-sm border border-white/30 text-white hover:bg-white/30">
                      <Edit className="w-4 h-4 mr-2" />
                      편집
                    </Button>
                  </Link>
                  <Button 
                    variant="outline" 
                    className="bg-red-500/20 backdrop-blur-sm border border-red-300/30 text-red-200 hover:bg-red-500/30"
                    onClick={deleteArticle}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    삭제
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* 글 내용 */}
        <Card className="bg-white border-2 border-white/30 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden py-5 w-full rounded-2xl max-w-4xl mx-auto">
          {/* 썸네일 */}
          {article.thumbnail && (
            <div className="aspect-video bg-gray-200">
              <img 
                src={article.thumbnail} 
                alt={article.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          
          <CardHeader className="pb-4">
            <div className="flex flex-wrap gap-2 mb-4">
              {article.tags.map((tag, index) => (
                <span 
                  key={index}
                  className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                >
                  {tag}
                </span>
              ))}
            </div>
            
            <CardTitle className="text-3xl font-bold mb-4">{article.title}</CardTitle>
            
            <div className="flex items-center gap-6 text-sm text-gray-600 mb-4">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span>{article.author}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>{new Date(article.createdAt?.toDate?.() || article.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4" />
                <span>{article.views || 0}</span>
              </div>
            </div>
            
            <p className="text-lg text-gray-700 leading-relaxed">{article.summary}</p>
          </CardHeader>
          
          <CardContent>
            {/* 액션 버튼 */}
            <div className="flex gap-2 mb-8">
              <Button 
                variant="outline" 
                onClick={toggleLike}
                className="flex-1"
              >
                <Heart className="w-4 h-4 mr-2" />
                좋아요 {article.likes || 0}
              </Button>
              <Button 
                variant="outline" 
                onClick={handleShare}
                className="flex-1"
              >
                <Share2 className="w-4 h-4 mr-2" />
                공유하기
              </Button>
            </div>
            
            {/* 본문 내용 */}
            <div className="rich-text-editor prose prose-lg max-w-none">
            <div 
              className="prose prose-lg max-w-none leading-relaxed prose-headings:text-gray-900 prose-p:text-gray-700 prose-a:text-blue-600 prose-strong:text-gray-900 prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-gray-100 prose-blockquote:border-l-4 prose-blockquote:border-gray-300 prose-blockquote:pl-4"
              dangerouslySetInnerHTML={{ 
                __html: article.content
              }}
            />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
