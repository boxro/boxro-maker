"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import CommonHeader from "@/components/CommonHeader";

export default function WriteMagazinePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [summary, setSummary] = useState("");
  const [tags, setTags] = useState("");
  const [thumbnail, setThumbnail] = useState("");
  const [isPublished, setIsPublished] = useState(false);
  const [saving, setSaving] = useState(false);

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
      alert('매거진 글 작성 권한이 없습니다.');
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
      
      // 개발 환경에서는 로컬 저장만 수행
      console.log('개발 환경: 매거진 글 저장 (로컬)');
      
      const articleData = {
        title: title.trim(),
        content: content.trim(),
        summary: summary.trim(),
        author: user.displayName || 'Anonymous',
        authorEmail: user.email || '',
        authorId: user.uid,
        thumbnail: thumbnail,
        tags: getTagsArray(),
        views: 0,
        likes: 0,
        isPublished: publish,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      console.log('저장할 글 데이터:', articleData);
      
      if (publish) {
        alert('글이 성공적으로 발행되었습니다! (개발 환경)');
        router.push('/magazine');
      } else {
        alert('글이 임시저장되었습니다! (개발 환경)');
        router.push('/magazine');
      }
      
    } catch (error) {
      console.error('저장 실패:', error);
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(100deg, #2563eb, #7c3aed, #ec4899)' }}>
        <div className="text-center">
          <p className="text-white">로그인이 필요합니다.</p>
          <Link href="/auth">
            <Button className="mt-4">로그인하기</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-16" style={{ background: 'linear-gradient(100deg, #2563eb, #7c3aed, #ec4899)' }}>
      <CommonHeader />
      <div className="max-w-7xl mx-auto px-0 md:px-8">
        {/* Header */}
        <div className="mb-6 mt-10 px-4 md:px-0">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <PageHeader 
                title="매거진 글 작성"
                description="새로운 매거진 글을 작성해보세요"
              />
            </div>
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

        {/* 작성 폼 */}
        <Card className="bg-white border-2 border-white/30 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden py-5 w-full rounded-2xl max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle>새 매거진 글 작성</CardTitle>
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
                작성 완료 시 즉시 발행하기
              </label>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
