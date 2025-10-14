"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, ExternalLink, Play, Image as ImageIcon } from 'lucide-react';

interface UrlPreviewProps {
  url: string;
  onRemove: () => void;
}

interface PreviewData {
  title?: string;
  description?: string;
  image?: string;
  siteName?: string;
  type: 'youtube' | 'twitter' | 'instagram' | 'general';
}

export default function UrlPreview({ url, onRemove }: UrlPreviewProps) {
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // URL 타입 감지
  const detectUrlType = (url: string): PreviewData['type'] => {
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
    if (url.includes('twitter.com') || url.includes('x.com')) return 'twitter';
    if (url.includes('instagram.com')) return 'instagram';
    return 'general';
  };

  // YouTube 썸네일 추출
  const getYouTubeThumbnail = (url: string): string | null => {
    const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)?.[1];
    if (videoId) {
      return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
    }
    return null;
  };

  // 메타데이터 가져오기
  const fetchMetadata = async (url: string) => {
    try {
      setLoading(true);
      setError(false);

      const urlType = detectUrlType(url);
      
      // YouTube 처리
      if (urlType === 'youtube') {
        const thumbnail = getYouTubeThumbnail(url);
        const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)?.[1];
        
        if (thumbnail && videoId) {
          setPreviewData({
            title: `YouTube Video`,
            description: `YouTube 동영상`,
            image: thumbnail,
            siteName: 'YouTube',
            type: 'youtube'
          });
          setLoading(false);
          return;
        }
      }

      // 일반 URL 메타데이터 가져오기
      const response = await fetch(`/api/metadata?url=${encodeURIComponent(url)}`);
      
      if (!response.ok) {
        throw new Error('메타데이터를 가져올 수 없습니다');
      }

      const data = await response.json();
      
      setPreviewData({
        title: data.title || '링크',
        description: data.description || '',
        image: data.image || '',
        siteName: data.siteName || new URL(url).hostname,
        type: urlType
      });
      
    } catch (err) {
      console.error('메타데이터 가져오기 실패:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetadata(url);
  }, [url]);

  if (loading) {
    return (
      <div className="my-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
          <span className="text-sm text-gray-600">미리보기 로딩 중...</span>
        </div>
      </div>
    );
  }

  if (error || !previewData) {
    return (
      <div className="my-4 p-4 border border-red-200 rounded-lg bg-red-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ExternalLink className="h-4 w-4 text-red-500" />
            <span className="text-sm text-red-600">미리보기를 생성할 수 없습니다</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRemove}
            className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="mt-2">
          <a 
            href={url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:text-blue-800 underline"
          >
            {url}
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="my-4 border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow">
      <div className="flex">
        {/* 이미지 영역 */}
        {previewData.image && (
          <div className="w-32 h-24 flex-shrink-0 relative">
            <img
              src={previewData.image}
              alt={previewData.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            {previewData.type === 'youtube' && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-red-600 rounded-full p-2">
                  <Play className="h-4 w-4 text-white" />
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* 콘텐츠 영역 */}
        <div className="flex-1 p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-gray-900 truncate">
                {previewData.title}
              </h3>
              {previewData.description && (
                <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                  {previewData.description}
                </p>
              )}
              <div className="flex items-center mt-2 space-x-2">
                <span className="text-xs text-gray-500">
                  {previewData.siteName}
                </span>
                <ExternalLink className="h-3 w-3 text-gray-400" />
              </div>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onRemove}
              className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600 flex-shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
