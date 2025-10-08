"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ErrorModal from "@/components/ErrorModal";
import RichTextEditor from "@/components/RichTextEditor";
import { 
  ArrowLeft,
  Save,
  BookOpen,
  X
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import CommonHeader from "@/components/CommonHeader";
import CommonBackground from "@/components/CommonBackground";
import PageHeader from "@/components/PageHeader";

export default function WriteMagazinePage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [summary, setSummary] = useState("");
  const [tags, setTags] = useState("");
  const [thumbnail, setThumbnail] = useState("");
  const [isPublished, setIsPublished] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // 오류 모달 상태
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // 관리자 이메일 목록
  const adminEmails = [
    "dongwoo.kang@opsnow.com",
    "admin@boxro.com"
  ];

  // 권한 확인
  useEffect(() => {
    if (!user) {
      setErrorMessage('로그인이 필요합니다.');
      setShowErrorModal(true);
      router.push('/auth');
      return;
    }
    
    if (!adminEmails.includes(user.email || "")) {
      setErrorMessage('박스카 이야기 글 작성 권한이 없습니다.');
      setShowErrorModal(true);
      router.push('/magazine');
      return;
    }
  }, [user, router]);

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
    if (!user) return;
    
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
        tags: getTagsArray(),
        thumbnail: thumbnail,
        author: user.displayName || user.email || '익명',
        authorEmail: user.email || '',
        authorId: user.uid,
        views: 0,
        likes: 0,
        isPublished: publish,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // 개발 환경에서는 더미 데이터로 처리
      if (process.env.NODE_ENV === 'development') {
        const newId = Date.now().toString();
        console.log('개발 환경: 글 저장됨', { id: newId, ...articleData });
        alert(publish ? '글이 발행되었습니다!' : '글이 임시저장되었습니다!');
        router.push(`/magazine/${newId}`);
        return;
      }
      
      // 프로덕션 환경에서는 Firebase 사용
      const { db } = await import('@/lib/firebase');
      const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
      
      const articlesRef = collection(db, 'magazineArticles');
      const docRef = await addDoc(articlesRef, {
        ...articleData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      alert(publish ? '글이 발행되었습니다!' : '글이 임시저장되었습니다!');
      router.push(`/magazine/${docRef.id}`);
    } catch (error) {
      console.error('글 저장 실패:', error);
      setErrorMessage('글 저장에 실패했습니다.');
      setShowErrorModal(true);
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <CommonBackground className="flex items-center justify-center">
        <div className="text-center">
          <p className="text-white">로그인이 필요합니다.</p>
          <Link href="/auth">
            <Button className="mt-4">로그인하기</Button>
          </Link>
        </div>
      </CommonBackground>
    );
  }

  return (
    <CommonBackground className="py-16">
      <CommonHeader />
      
      <div className="max-w-7xl mx-auto px-4 md:px-8 flex-1">
        {/* Header */}
        <div className="mb-8 mt-10">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <PageHeader 
              title="박스카 이야기 글 작성"
              description="새로운 박스카 이야기를 작성해보세요"
            />
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
                {saving ? '저장 중...' : '임시저장'}
              </Button>
              <Button 
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={() => saveArticle(true)}
                disabled={saving}
              >
                <BookOpen className="w-4 h-4 mr-2" />
                {saving ? '발행 중...' : '발행하기'}
              </Button>
            </div>
          </div>
        </div>

        {/* 작성 폼 */}
        <Card className="max-w-4xl mx-auto mx-4 md:mx-0">
          <CardHeader>
            <CardTitle>새 글 작성</CardTitle>
          </CardHeader>
          <CardContent>
          <div className="space-y-6">
            {/* 제목 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">제목</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-[15px]"
                placeholder="제목을 입력하세요"
              />
            </div>

            {/* 요약 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">요약</label>
              <textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-[15px]"
                rows={3}
                placeholder="요약을 입력하세요"
              />
            </div>

            {/* 태그 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">태그 (쉼표로 구분)</label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-[15px]"
                placeholder="태그1, 태그2, 태그3"
              />
            </div>

            {/* 썸네일 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">썸네일</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-[15px]"
              />
              {thumbnail && (
                <div className="mt-2">
                  <img src={thumbnail} alt="썸네일 미리보기" className="w-32 h-32 object-cover rounded-md" />
                </div>
              )}
            </div>

            {/* 발행 상태 */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isPublished"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                className="mr-2"
              />
              <label htmlFor="isPublished" className="text-sm font-medium text-gray-700">
                발행하기
              </label>
            </div>

            {/* 내용 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">내용</label>
              <RichTextEditor
                content={content}
                onChange={setContent}
              />
            </div>
          </div>
          </CardContent>
        </Card>
      </div>

      {/* 오류 모달 */}
      <ErrorModal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        message={errorMessage}
      />
    </CommonBackground>
  );
}