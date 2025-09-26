"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import RichTextEditor from "@/components/RichTextEditor";
import { 
  ArrowLeft,
  Save,
  BookOpen,
  X
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

export default function EditMagazinePage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { articles, updateArticle } = useMagazine();
  const router = useRouter();
  const [article, setArticle] = useState<MagazineArticle | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [summary, setSummary] = useState("");
  const [tags, setTags] = useState("");
  const [thumbnail, setThumbnail] = useState("");
  const [isPublished, setIsPublished] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // 관리자 이메일 목록
  const adminEmails = [
    "admin@boxro.com",
    "dongwoo.kang@boxro.com",
    "beagle3651@gmail.com",
    "boxro.crafts@gmail.com"
  ];

  // 관리자 권한 확인
  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    
    if (!adminEmails.includes(user.email || "")) {
      alert('매거진 글 편집 권한이 없습니다.');
      router.push('/magazine');
      return;
    }
  }, [user, router]);

  // 기존 글 데이터 로드
  const fetchArticle = async () => {
    try {
      setLoading(true);
      
      // 개발 환경에서는 Context에서 데이터 가져오기
      if (process.env.NODE_ENV === 'development') {
        console.log('개발 환경: Context에서 매거진 데이터 사용');
        const foundArticle = articles.find(a => a.id === id);
        if (foundArticle) {
          setArticle(foundArticle);
          setTitle(foundArticle.title);
          setContent(foundArticle.content);
          setSummary(foundArticle.summary);
          setTags(foundArticle.tags.join(', '));
          setThumbnail(foundArticle.thumbnail || '');
          setIsPublished(foundArticle.isPublished);
        } else {
          alert('글이 존재하지 않습니다.');
          router.push('/magazine');
        }
        setLoading(false);
        return;
      }
      
      // 프로덕션 환경에서는 Firebase 사용
      const articleRef = doc(db, 'magazineArticles', id as string);
      const articleSnap = await getDoc(articleRef);
      
      if (articleSnap.exists()) {
        const articleData = {
          id: articleSnap.id,
          ...articleSnap.data()
        } as MagazineArticle;
        
        setArticle(articleData);
        setTitle(articleData.title);
        setContent(articleData.content);
        setSummary(articleData.summary);
        setTags(articleData.tags.join(', '));
        setThumbnail(articleData.thumbnail || '');
        setIsPublished(articleData.isPublished);
      } else {
        alert('글이 존재하지 않습니다.');
        router.push('/magazine');
      }
    } catch (error) {
      console.error('글 로드 실패:', error);
      alert('글을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchArticle();
    }
  }, [id]);

  // 이미지 업로드 처리
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setThumbnail(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // 태그 배열로 변환
  const getTagsArray = () => {
    return tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
  };

  // 글 저장
  const saveArticle = async (publish: boolean = false) => {
    if (!user || !article) return;
    
    if (!title.trim()) {
      alert('제목을 입력해주세요.');
      return;
    }
    
    if (!content.trim()) {
      alert('내용을 입력해주세요.');
      return;
    }
    
    if (!summary.trim()) {
      alert('요약을 입력해주세요.');
      return;
    }

    try {
      setSaving(true);
      
      const articleData = {
        title: title.trim(),
        content: content.trim(),
        summary: summary.trim(),
        thumbnail: thumbnail,
        tags: getTagsArray(),
        isPublished: publish,
        updatedAt: new Date()
      };

      // 개발 환경에서는 Context에서 업데이트
      if (process.env.NODE_ENV === 'development') {
        console.log('개발 환경: Context에서 글 수정');
        updateArticle(article.id, articleData);
        
        if (publish) {
          alert('글이 성공적으로 발행되었습니다! (개발 환경)');
        } else {
          alert('글이 임시저장되었습니다! (개발 환경)');
        }
        router.push('/magazine');
        return;
      }
      
      // 프로덕션 환경에서는 Firebase 사용
      const articleRef = doc(db, 'magazineArticles', article.id);
      await updateDoc(articleRef, articleData);
      
      if (publish) {
        alert('글이 성공적으로 발행되었습니다!');
        router.push('/magazine');
      } else {
        alert('글이 임시저장되었습니다!');
        router.push('/magazine');
      }
      
    } catch (error) {
      console.error('저장 실패:', error);
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

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

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">로그인이 필요합니다.</p>
          <Link href="/login">
            <Button className="mt-4">로그인하기</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">글을 찾을 수 없습니다.</p>
          <Link href="/magazine">
            <Button className="mt-4">목록으로</Button>
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
                  목록으로
                </Button>
              </Link>
              <Button 
                variant="outline" 
                className="bg-white/20 backdrop-blur-sm border border-white/30 text-white hover:bg-white/30"
                onClick={() => saveArticle(false)}
                disabled={saving}
              >
                <Save className="w-4 h-4 mr-2" />
                임시저장
              </Button>
              <Button 
                className="bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600"
                onClick={() => saveArticle(true)}
                disabled={saving}
              >
                <BookOpen className="w-4 h-4 mr-2" />
                발행하기
              </Button>
            </div>
          </div>
        </div>

        {/* 편집 폼 */}
        <Card className="bg-white border-2 border-white/30 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden py-5 w-full rounded-2xl max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle>매거진 글 편집</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 제목 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                제목 *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="매력적인 제목을 입력하세요"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* 요약 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                요약 *
              </label>
              <textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="글의 핵심 내용을 간단히 요약해주세요"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* 썸네일 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                썸네일 이미지
              </label>
              <div className="flex gap-4">
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                {thumbnail && (
                  <div className="relative">
                    <img 
                      src={thumbnail} 
                      alt="썸네일 미리보기"
                      className="w-20 h-20 object-cover rounded-md"
                    />
                    <button
                      onClick={() => setThumbnail("")}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* 태그 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                태그
              </label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="태그를 쉼표로 구분하여 입력하세요 (예: 디자인, 창작, 자동차)"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-sm text-gray-500 mt-1">
                입력된 태그: {getTagsArray().length > 0 ? getTagsArray().join(', ') : '없음'}
              </p>
            </div>

            {/* 내용 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                내용 *
              </label>
              <RichTextEditor
                content={content}
                onChange={setContent}
                placeholder="매거진 글의 본문을 작성하세요..."
              />
              <p className="text-sm text-gray-500 mt-1">
                위의 툴바를 사용하여 텍스트 스타일을 조절할 수 있습니다.
              </p>
            </div>

            {/* 발행 옵션 */}
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-md">
              <input
                type="checkbox"
                id="publish"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                className="w-4 h-4 text-blue-600"
              />
              <label htmlFor="publish" className="text-sm font-medium text-gray-700">
                발행 상태로 변경하기
              </label>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
