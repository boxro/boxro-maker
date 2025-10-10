"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Save, Eye, History, ArrowLeft, Shield } from 'lucide-react';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import RichTextEditor from '@/components/RichTextEditor';

interface TermsVersion {
  id: string;
  type: 'service' | 'privacy';
  version: string;
  content: string;
  isActive: boolean;
  createdAt: any;
  updatedAt: any;
  title?: string;
  summary?: string;
}

interface PrivacyPolicyEditorProps {
  versionId: string;
  onClose: () => void;
  onSave: () => void;
}

const PrivacyPolicyEditor: React.FC<PrivacyPolicyEditorProps> = ({
  versionId,
  onClose,
  onSave
}) => {
  const [version, setVersion] = useState<TermsVersion | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [versionNumber, setVersionNumber] = useState('');
  const [createdDate, setCreatedDate] = useState('');
  const [updatedDate, setUpdatedDate] = useState('');
  const [isPreview, setIsPreview] = useState(false);

  // 안전한 날짜 변환 함수
  const safeDateToString = (dateValue: any): string => {
    if (!dateValue) return '';
    
    try {
      let date: Date;
      
      // Firebase Timestamp인 경우
      if (dateValue && typeof dateValue === 'object' && dateValue.seconds) {
        date = new Date(dateValue.seconds * 1000);
      } 
      // 일반 Date 객체나 문자열인 경우
      else {
        date = new Date(dateValue);
      }
      
      // 유효한 날짜인지 확인
      if (isNaN(date.getTime())) {
        return '';
      }
      
      return date.toISOString().split('T')[0];
    } catch (error) {
      console.error('날짜 변환 오류:', error);
      return '';
    }
  };

  // 버전 데이터 로드
  const loadVersion = async () => {
    try {
      setLoading(true);
      const docRef = doc(db, 'termsVersions', versionId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data() as TermsVersion;
        setVersion({
          id: docSnap.id,
          ...data
        });
        setTitle(data.title || '');
        setSummary(data.summary || '');
        setContent(data.content || '');
        setVersionNumber(data.version || '');
        setCreatedDate(data.effectiveDate || safeDateToString(data.createdAt));
        setUpdatedDate(safeDateToString(data.updatedAt));
      }
    } catch (error) {
      console.error('버전 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  // 저장
  const handleSave = async () => {
    try {
      setSaving(true);
      const docRef = doc(db, 'termsVersions', versionId);
      await updateDoc(docRef, {
        title,
        summary,
        content,
        version: versionNumber,
        effectiveDate: createdDate,
        createdAt: createdDate ? new Date(createdDate) : new Date(),
        updatedAt: updatedDate ? new Date(updatedDate) : new Date()
      });
      onSave();
    } catch (error) {
      console.error('저장 실패:', error);
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    loadVersion();
  }, [versionId]);

  if (loading) {
    return (
      <Card className="bg-white/95 backdrop-blur-sm border border-white/20">
        <CardContent className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">데이터를 불러오는 중...</p>
        </CardContent>
      </Card>
    );
  }

  if (!version) {
    return (
      <Card className="bg-white/95 backdrop-blur-sm border border-white/20">
        <CardContent className="text-center py-12">
          <p className="text-gray-600">버전을 찾을 수 없습니다.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* 편집 영역 */}
      <div className="space-y-4">
        <Card className="bg-white/95 backdrop-blur-sm border border-white/20">
          <CardHeader>
            <CardTitle className="text-lg">개인정보처리방침 내용</CardTitle>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  버전
                </label>
                <Input
                  value={versionNumber}
                  onChange={(e) => setVersionNumber(e.target.value)}
                  placeholder="예: 1.0"
                  className="w-full bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  시행일자
                </label>
                <Input
                  type="date"
                  value={createdDate}
                  onChange={(e) => setCreatedDate(e.target.value)}
                  className="w-full bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  수정일자
                </label>
                <Input
                  type="date"
                  value={updatedDate}
                  onChange={(e) => setUpdatedDate(e.target.value)}
                  className="w-full bg-white"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div>
              <RichTextEditor
                content={content}
                onChange={setContent}
                placeholder="개인정보처리방침의 전체 내용을 작성해주세요..."
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 하단 버튼들 */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={onClose}
          className="flex items-center gap-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-300"
        >
          <ArrowLeft className="w-4 h-4" />
          목록으로
        </Button>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 rounded-full"
        >
          <Save className="w-4 h-4" />
          {saving ? '저장 중...' : '저장'}
        </Button>
      </div>
    </div>
  );
};

export default PrivacyPolicyEditor;