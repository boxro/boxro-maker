"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Shield, Plus, Edit, Eye, Trash2, ExternalLink } from 'lucide-react';
import { collection, getDocs, addDoc, updateDoc, doc, query, where, orderBy, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import ServiceTermsEditor from './ServiceTermsEditor';
import PrivacyPolicyEditor from './PrivacyPolicyEditor';

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

interface TermsManagementProps {}

const TermsManagement: React.FC<TermsManagementProps> = () => {
  const [activeSubTab, setActiveSubTab] = useState<'service' | 'privacy'>('service');
  const [serviceTerms, setServiceTerms] = useState<TermsVersion[]>([]);
  const [privacyTerms, setPrivacyTerms] = useState<TermsVersion[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingVersion, setEditingVersion] = useState<string | null>(null);
  const [editingType, setEditingType] = useState<'service' | 'privacy' | null>(null);

  // 데이터 로드
  const fetchTermsData = async () => {
    try {
      setLoading(true);
      console.log('이용약관 데이터 불러오기 시작...');

      // 모든 데이터를 가져와서 클라이언트에서 필터링 (인덱스 문제 해결)
      const allQuery = query(collection(db, 'termsVersions'));
      const allSnapshot = await getDocs(allQuery);
      const allData = allSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as TermsVersion));
      
      // 클라이언트에서 필터링 및 정렬
      const serviceData = allData
        .filter(item => item.type === 'service')
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setServiceTerms(serviceData);
      
      const privacyData = allData
        .filter(item => item.type === 'privacy')
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setPrivacyTerms(privacyData);

      console.log('이용약관 데이터 로드 완료:', { service: serviceData.length, privacy: privacyData.length });
    } catch (error) {
      console.error('이용약관 데이터 불러오기 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  // 새 버전 생성
  const createNewVersion = async (type: 'service' | 'privacy') => {
    try {
      setLoading(true);
      const currentVersions = type === 'service' ? serviceTerms : privacyTerms;
      const latestVersionNum = currentVersions.reduce((max, term) => {
        const versionMatch = term.version.match(/^(\d+)\.(\d+)$/);
        if (versionMatch) {
          return Math.max(max, parseInt(versionMatch[1]));
        }
        return max;
      }, 0);
      const newVersion = `${latestVersionNum + 1}.0`;

      const newDocRef = await addDoc(collection(db, 'termsVersions'), {
        type,
        version: newVersion,
        content: '',
        isActive: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        title: type === 'service' ? '서비스이용약관' : '개인정보처리방침',
        summary: '',
      });
      
      alert('새 버전이 생성되었습니다. 내용을 편집해주세요.');
      setEditingVersion(newDocRef.id);
      setEditingType(type);
      fetchTermsData();
    } catch (error) {
      console.error('새 버전 생성 실패:', error);
      alert('새 버전 생성에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 버전 활성화
  const activateVersion = async (id: string, type: 'service' | 'privacy') => {
    try {
      setLoading(true);
      // 기존 활성 버전 비활성화
      const currentActiveQuery = query(
        collection(db, 'termsVersions'),
        where('type', '==', type),
        where('isActive', '==', true)
      );
      const currentActiveSnapshot = await getDocs(currentActiveQuery);
      currentActiveSnapshot.docs.forEach(async (docToUpdate) => {
        await updateDoc(doc(db, 'termsVersions', docToUpdate.id), { isActive: false });
      });

      // 새 버전 활성화
      await updateDoc(doc(db, 'termsVersions', id), { isActive: true, updatedAt: new Date() });
      alert('버전이 활성화되었습니다.');
      fetchTermsData();
    } catch (error) {
      console.error('버전 활성화 실패:', error);
      alert('버전 활성화에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 버전 삭제
  const deleteVersion = async (id: string, type: 'service' | 'privacy') => {
    if (window.confirm('이 버전을 삭제하시겠습니까? 삭제된 버전은 복구할 수 없습니다.')) {
      try {
        setLoading(true);
        await deleteDoc(doc(db, 'termsVersions', id));
        alert('버전이 삭제되었습니다.');
        fetchTermsData();
      } catch (error) {
        console.error('버전 삭제 실패:', error);
        alert('버전 삭제에 실패했습니다.');
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchTermsData();
  }, []);

  const currentTerms = activeSubTab === 'service' ? serviceTerms : privacyTerms;
  const activeVersion = currentTerms.find(term => term.isActive);

  // 에디터 모드 처리
  if (editingVersion && editingType) {
    if (editingType === 'service') {
      return (
        <ServiceTermsEditor
          versionId={editingVersion}
          onClose={() => {
            setEditingVersion(null);
            setEditingType(null);
          }}
          onSave={() => {
            fetchTermsData();
            setEditingVersion(null);
            setEditingType(null);
          }}
        />
      );
    } else if (editingType === 'privacy') {
      return (
        <PrivacyPolicyEditor
          versionId={editingVersion}
          onClose={() => {
            setEditingVersion(null);
            setEditingType(null);
          }}
          onSave={() => {
            fetchTermsData();
            setEditingVersion(null);
            setEditingType(null);
          }}
        />
      );
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white/95 backdrop-blur-sm border border-white/20 rounded-lg p-6">
        <Tabs value={activeSubTab} onValueChange={(value) => setActiveSubTab(value as 'service' | 'privacy')} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6 bg-gray-200 rounded-full p-1">
            <TabsTrigger value="service" className="flex items-center gap-2 data-[state=active]:bg-sky-500 data-[state=active]:text-white data-[state=active]:shadow-sm rounded-full transition-all duration-200">
              <FileText className="w-4 h-4" /> 서비스이용약관
            </TabsTrigger>
            <TabsTrigger value="privacy" className="flex items-center gap-2 data-[state=active]:bg-sky-500 data-[state=active]:text-white data-[state=active]:shadow-sm rounded-full transition-all duration-200">
              <Shield className="w-4 h-4" /> 개인정보처리방침
            </TabsTrigger>
          </TabsList>
          
          
                 <TabsContent value="service" className="mt-6">
                   <div className="flex items-center justify-between mb-4">
                     <h4 className="text-md font-semibold text-gray-800">
                       서비스이용약관 목록 ({serviceTerms.length}개)
                     </h4>
                     <Button
                       onClick={() => createNewVersion('service')}
                       className="bg-blue-600 hover:bg-blue-700 text-white rounded-full text-sm px-3 py-1"
                     >
                       <Plus className="w-4 h-4 mr-1" />
                       새 버전 생성
                     </Button>
                   </div>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-gray-600">데이터를 불러오는 중...</p>
              </div>
            ) : serviceTerms.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>등록된 서비스이용약관이 없습니다.</p>
                <p className="text-sm">새 버전을 생성하여 약관을 작성해주세요.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {serviceTerms.map((version) => (
                  <Card 
                    key={version.id} 
                      className="bg-gray-50 rounded-lg border border-gray-200 shadow-none cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => {
                        setEditingVersion(version.id);
                        setEditingType('service');
                      }}
                    >
                    <CardContent className="px-6 py-2 flex items-center justify-between">
                      <div className="flex flex-col items-start">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-gray-900">버전: {version.version}</span>
                          {version.isActive && <Badge className="bg-green-500 hover:bg-green-500">활성</Badge>}
                        </div>
                        <div className="text-gray-600" style={{fontSize: '13px'}}>
                          <div>시행일자: {version.effectiveDate ? new Date(version.effectiveDate).toLocaleDateString('ko-KR') : (version.createdAt ? new Date(version.createdAt.seconds ? version.createdAt.seconds * 1000 : version.createdAt).toLocaleDateString('ko-KR') : '정보 없음')}</div>
                          <div>수정일자: {version.updatedAt ? new Date(version.updatedAt.seconds ? version.updatedAt.seconds * 1000 : version.updatedAt).toLocaleDateString('ko-KR') : '정보 없음'}</div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {!version.isActive && (
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              activateVersion(version.id, 'service');
                            }}
                            className="bg-green-600 hover:bg-green-700 text-white rounded-full"
                          >
                            활성화하기
                          </Button>
                        )}
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open('/terms', '_blank');
                          }}
                          className="bg-gray-600 hover:bg-gray-700 text-white rounded-full"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteVersion(version.id, 'service');
                          }}
                          className="bg-red-600 hover:bg-red-700 text-white rounded-full"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="privacy" className="mt-6">
            <div className="flex items-center justify-between mb-4">
                     <h4 className="text-md font-semibold text-gray-800">
                       개인정보처리방침 목록 ({privacyTerms.length}개)
                     </h4>
              <Button
                onClick={() => createNewVersion('privacy')}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-full text-sm px-3 py-1"
              >
                <Plus className="w-4 h-4 mr-1" />
                새 버전 생성
              </Button>
            </div>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-gray-600">데이터를 불러오는 중...</p>
              </div>
            ) : privacyTerms.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>등록된 개인정보처리방침이 없습니다.</p>
                <p className="text-sm">새 버전을 생성하여 약관을 작성해주세요.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {privacyTerms.map((version) => (
                  <Card 
                    key={version.id} 
                    className="bg-gray-50 rounded-lg border border-gray-200 shadow-none cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => {
                      setEditingVersion(version.id);
                      setEditingType('privacy');
                    }}
                  >
                    <CardContent className="px-6 py-2 flex items-center justify-between">
                      <div className="flex flex-col items-start">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-gray-900">버전: {version.version}</span>
                          {version.isActive && <Badge className="bg-green-500 hover:bg-green-500">활성</Badge>}
                        </div>
                        <div className="text-gray-600" style={{fontSize: '13px'}}>
                          <div>시행일자: {version.effectiveDate ? new Date(version.effectiveDate).toLocaleDateString('ko-KR') : (version.createdAt ? new Date(version.createdAt.seconds ? version.createdAt.seconds * 1000 : version.createdAt).toLocaleDateString('ko-KR') : '정보 없음')}</div>
                          <div>수정일자: {version.updatedAt ? new Date(version.updatedAt.seconds ? version.updatedAt.seconds * 1000 : version.updatedAt).toLocaleDateString('ko-KR') : '정보 없음'}</div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {!version.isActive && (
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              activateVersion(version.id, 'privacy');
                            }}
                            className="bg-green-600 hover:bg-green-700 text-white rounded-full"
                          >
                            활성화하기
                          </Button>
                        )}
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open('/privacy', '_blank');
                          }}
                          className="bg-gray-600 hover:bg-gray-700 text-white rounded-full"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteVersion(version.id, 'privacy');
                          }}
                          className="bg-red-600 hover:bg-red-700 text-white rounded-full"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default TermsManagement;