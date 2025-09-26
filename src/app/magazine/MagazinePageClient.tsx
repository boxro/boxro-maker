"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useMagazine } from "@/contexts/MagazineContext";
import { useRouter } from "next/navigation";
import { collection, getDocs, doc, deleteDoc, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import CommonHeader from "@/components/CommonHeader";
import PageHeader from "@/components/PageHeader";

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


export default function MagazinePageClient() {
  const { user } = useAuth();
  const { articles, setArticles, deleteArticle: contextDeleteArticle } = useMagazine();
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // 매거진 글 목록 가져오기
  const fetchArticles = async () => {
    try {
      setLoading(true);
      
      if (process.env.NODE_ENV === 'development') {
        console.log('개발 환경: Context에서 매거진 글 목록 사용', articles);
        console.log('개발 환경: articles.length =', articles.length);
        console.log('개발 환경: loading 상태를 false로 변경');
        setLoading(false);
        return;
      }
      
      const articlesRef = collection(db, 'magazineArticles');
      const q = query(articlesRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const articlesData: MagazineArticle[] = [];
      querySnapshot.forEach((doc) => {
        articlesData.push({
          id: doc.id,
          ...doc.data()
        } as MagazineArticle);
      });
      
      setArticles(articlesData);
    } catch (error) {
      console.error('매거진 글 목록 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  // 글 삭제
  const deleteArticle = async (id: string) => {
    if (!user) {
      alert('로그인이 필요합니다.');
      return;
    }
    
    if (!confirm('정말로 이 글을 삭제하시겠습니까?')) {
      return;
    }

    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('개발 환경: Context에서 글 삭제');
        contextDeleteArticle(id);
        return;
      }
      
      await deleteDoc(doc(db, 'magazineArticles', id));
      setArticles(articles.filter(article => article.id !== id));
      alert('글이 삭제되었습니다.');
    } catch (error) {
      console.error('삭제 실패:', error);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  useEffect(() => {
    console.log('MagazinePageClient: useEffect 실행');
    
    if (process.env.NODE_ENV === 'development') {
      console.log('개발 환경: Context에서 매거진 글 목록 사용', articles);
      console.log('개발 환경: articles.length =', articles.length);
      console.log('개발 환경: loading 상태를 false로 변경');
      setLoading(false);
    } else {
      fetchArticles();
    }
  }, []);

  console.log('MagazinePageClient render:', { loading, articlesCount: articles.length });

  if (loading) {
    return (
      <div className="min-h-screen py-16 md:py-24" style={{background: 'linear-gradient(100deg, #2563eb, #7c3aed, #ec4899)'}}>
        <CommonHeader />
        <div className="max-w-7xl mx-auto px-0 md:px-8">
          <div className="mb-6 mt-10 px-4 md:px-0">
            <PageHeader 
              title="매거진"
              description="자동차 디자인과 창작의 모든 것을 만나보세요"
            />
          </div>
          <div className="text-center">
            <p className="text-white">매거진을 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-16 md:py-24" style={{background: 'linear-gradient(100deg, #2563eb, #7c3aed, #ec4899)'}}>
      <CommonHeader />
      <div className="max-w-7xl mx-auto px-0 md:px-8">
        <div className="mb-6 mt-10 px-4 md:px-0">
          <PageHeader 
            title="매거진"
            description="자동차 디자인과 창작의 모든 것을 만나보세요"
          />
        </div>
        
        {articles.length === 0 ? (
          <div className="text-center">
            <p className="text-white">아직 등록된 글이 없습니다.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article) => (
              <div key={article.id} className="bg-white border-2 border-white/30 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden py-5 w-full rounded-2xl">
                <div className="aspect-w-16 aspect-h-9">
                  <img 
                    src={article.thumbnail || '/boxro_draw.png'} 
                    alt={article.title}
                    className="w-full h-48 object-cover"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
                    {article.title}
                  </h3>
                  <p className="text-gray-600 mb-4 line-clamp-3">
                    {article.summary}
                  </p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {article.tags.map((tag, index) => (
                      <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                        #{tag}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <span>작성자: {article.author}</span>
                    <span>조회수: {article.views}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => router.push(`/magazine/${article.id}`)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200"
                    >
                      읽기
                    </button>
                    {user && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => router.push(`/magazine/edit/${article.id}`)}
                          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors duration-200"
                        >
                          편집
                        </button>
                        <button
                          onClick={() => deleteArticle(article.id)}
                          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors duration-200"
                        >
                          삭제
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {user && (
          <div className="mt-8 text-center">
            <button
              onClick={() => router.push('/magazine/write')}
              className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors duration-200"
            >
              새 글 작성하기
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
