import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'URL이 필요합니다' }, { status: 400 });
  }

  try {
    // URL 유효성 검사
    new URL(url);
  } catch {
    return NextResponse.json({ error: '유효하지 않은 URL입니다' }, { status: 400 });
  }

  try {
    // URL에서 HTML 가져오기
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; LinkPreview/1.0)',
      },
      // 타임아웃 설정
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();
    
    // 메타데이터 추출
    const metadata = extractMetadata(html, url);
    
    return NextResponse.json(metadata);
  } catch (error) {
    console.error('메타데이터 가져오기 실패:', error);
    return NextResponse.json(
      { error: '메타데이터를 가져올 수 없습니다' },
      { status: 500 }
    );
  }
}

function extractMetadata(html: string, url: string) {
  const title = extractMetaContent(html, ['og:title', 'twitter:title', 'title']);
  const description = extractMetaContent(html, ['og:description', 'twitter:description', 'description']);
  const image = extractMetaContent(html, ['og:image', 'twitter:image']);
  const siteName = extractMetaContent(html, ['og:site_name', 'twitter:site']);

  return {
    title: title || new URL(url).hostname,
    description: description || '',
    image: image || '',
    siteName: siteName || new URL(url).hostname,
    url: url,
  };
}

function extractMetaContent(html: string, properties: string[]): string | null {
  for (const property of properties) {
    // Open Graph 태그
    const ogMatch = html.match(new RegExp(`<meta[^>]*property=["']${property}["'][^>]*content=["']([^"']*)["']`, 'i'));
    if (ogMatch) return ogMatch[1];

    // Twitter Card 태그
    const twitterMatch = html.match(new RegExp(`<meta[^>]*name=["']${property}["'][^>]*content=["']([^"']*)["']`, 'i'));
    if (twitterMatch) return twitterMatch[1];

    // 일반 title 태그
    if (property === 'title') {
      const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
      if (titleMatch) return titleMatch[1].trim();
    }
  }
  
  return null;
}
