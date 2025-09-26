"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useMagazine } from "@/contexts/MagazineContext";
import { useRouter } from "next/navigation";
import { collection, getDocs, doc, deleteDoc, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home, Menu, Plus, X, Palette, Download, Play, Smartphone, ShoppingBag, BookOpen } from "lucide-react";
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

// 공통 스타일 상수
const MENU_BUTTON_STYLES = "bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white hover:bg-white/30 transition-all duration-200";
const MENU_ITEM_STYLES = "bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg p-3 text-white hover:bg-white/30 transition-all duration-200";
const DROPDOWN_STYLES = "absolute top-full right-0 mt-2 w-64 bg-white/90 backdrop-blur-sm border border-white/30 rounded-lg shadow-xl";

export default function MagazinePageClient() {
  const { user, logout } = useAuth();
  const { articles, setArticles, deleteArticle: contextDeleteArticle } = useMagazine();
  const [loading, setLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleLogout = async () => {
    try {
      await logout();
      setIsMenuOpen(false);
      console.log('로그아웃 성공');
    } catch (error) {
      console.error('로그아웃 실패:', error);
    }
  };

  const fetchArticles = async () => {
    try {
      const articlesRef = collection(db, 'magazine');
      
      if (process.env.NODE_ENV === 'development') {
        console.log('매거진 글 목록을 불러오는 중...');
      }
      
      const q = query(articlesRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const articlesData: MagazineArticle[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        articlesData.push({
          id: doc.id,
          title: data.title || '',
          content: data.content || '',
          author: data.author || '',
          authorEmail: data.authorEmail || '',
          authorId: data.authorId || '',
          thumbnail: data.thumbnail || '',
          summary: data.summary || '',
          tags: data.tags || [],
          views: data.views || 0,
          likes: data.likes || 0,
          isPublished: data.isPublished || false,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt
        });
      });
      
      setArticles(articlesData);
      setLoading(false);
      
      if (process.env.NODE_ENV === 'development') {
        console.log('매거진 글 목록 로드 완료:', articlesData.length, '개');
      }
    } catch (error) {
      console.error('매거진 글 목록 로드 실패:', error);
      setLoading(false);
    }
  };

  const deleteArticle = async (articleId: string) => {
    if (!user) return;
    
    try {
      await deleteDoc(doc(db, 'magazine', articleId));
      await contextDeleteArticle(articleId);
      console.log('글 삭제 완료');
    } catch (error) {
      console.error('글 삭제 실패:', error);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  if (loading) {
    return (
      <>
        <header className="fixed top-0 left-0 right-0 z-40 bg-gradient-to-br from-gray-900 to-gray-700 text-white shadow-lg">
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            <div className="flex justify-between items-center h-16">
              <Link href="/" className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">B</span>
                </div>
                <span className="text-xl font-bold">박스로메이커</span>
              </Link>
              
              <div className="flex items-center gap-4">
                <button
                  onClick={toggleMenu}
                  className={MENU_BUTTON_STYLES}
                >
                  <Menu className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </header>

        <div className="pt-20">
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            <div className="mb-6 mt-10">
              <h1 className="text-[24px] font-bold text-white mb-2" style={{fontFamily: 'CookieRun, sans-serif'}}>매거진</h1>
              <p className="text-white/90 text-[14px]">자동차 디자인과 창작의 모든 것을 만나보세요</p>
            </div>
            <div className="text-center">
              <p className="text-white">매거진을 불러오는 중...</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Common Header */}
      <CommonHeader />

      <div className="pt-20">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="mb-6 mt-10">
            <h1 className="text-[24px] font-bold text-white mb-2" style={{fontFamily: 'CookieRun, sans-serif'}}>매거진</h1>
            <p className="text-white/90 text-[14px]">자동차 디자인과 창작의 모든 것을 만나보세요</p>
          </div>
          
          {articles.length === 0 ? (
            <div className="text-center">
              <p className="text-white">아직 등록된 글이 없습니다.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {articles.map((article) => (
                <div key={article.id} className="bg-white/10 backdrop-blur-sm rounded-lg p-6 hover:bg-white/20 transition-all duration-200">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-white mb-2">{article.title}</h3>
                    <p className="text-white/80 text-sm">{article.summary}</p>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm text-white/60">
                    <span>{article.author}</span>
                    <span>{article.views} 조회</span>
                  </div>
                  
                  <div className="mt-4 flex gap-2">
                    <Link href={`/magazine/${article.id}`}>
                      <Button variant="outline" className="bg-white/20 border-white/30 text-white hover:bg-white/30">
                        읽기
                      </Button>
                    </Link>
                    {user && user.uid === article.authorId && (
                      <>
                        <Link href={`/magazine/edit/${article.id}`}>
                          <Button variant="outline" className="bg-white/20 border-white/30 text-white hover:bg-white/30">
                            편집
                          </Button>
                        </Link>
                        <Button 
                          variant="outline" 
                          className="bg-red-500/20 border-red-500/30 text-red-300 hover:bg-red-500/30"
                          onClick={() => deleteArticle(article.id)}
                        >
                          삭제
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {user && (
            <div className="mt-8 text-center">
              <Link href="/magazine/write">
                <button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 rounded-full px-6 py-3">
                  <Plus className="w-4 h-4 mr-2 inline" />
                  새 글 작성하기
                </button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}