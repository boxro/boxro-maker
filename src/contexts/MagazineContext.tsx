"use client";

import { createContext, useContext, useState, ReactNode } from 'react';

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

interface MagazineContextType {
  articles: MagazineArticle[];
  setArticles: (articles: MagazineArticle[]) => void;
  updateArticle: (id: string, articleData: Partial<MagazineArticle>) => void;
  deleteArticle: (id: string) => void;
}

const MagazineContext = createContext<MagazineContextType | undefined>(undefined);

export function MagazineProvider({ children }: { children: ReactNode }) {
  const [articles, setArticles] = useState<MagazineArticle[]>([
    {
      id: '1',
      title: '박스카 만들기의 모든 것',
      content: '<h2>박스카 만들기 시작하기</h2><p>아이들과 함께 박스카를 만드는 재미있는 방법들을 알아보세요. 창의적인 디자인과 환경을 생각하는 놀이를 통해 즐거운 시간을 보낼 수 있습니다.</p><h3>필요한 재료</h3><ul><li>큰 박스</li><li>색종이</li><li>가위</li><li>풀</li><li>색연필</li></ul><h3>만들기 과정</h3><p>1. 박스를 자동차 모양으로 자릅니다.</p><p>2. 창문과 문을 그려줍니다.</p><p>3. 색종이로 장식합니다.</p><p>4. 바퀴를 만들어 붙입니다.</p>',
      author: '박스로팀',
      authorEmail: 'team@boxro.com',
      authorId: 'team',
      thumbnail: '/boxro_draw.png',
      summary: '아이들과 함께 박스카를 만드는 재미있는 방법들을 알아보세요.',
      tags: ['박스카', '만들기', '아이들'],
      views: 150,
      likes: 25,
      isPublished: true,
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-15')
    },
    {
      id: '2',
      title: '창의적인 자동차 디자인 아이디어',
      content: '<h2>창의적인 자동차 디자인</h2><p>다양한 자동차 디자인 아이디어를 소개합니다.</p>',
      author: '디자인팀',
      authorEmail: 'design@boxro.com',
      authorId: 'design',
      thumbnail: '/boxro_print.png',
      summary: '아이들의 상상력을 자극하는 창의적인 자동차 디자인을 만나보세요.',
      tags: ['디자인', '창의성', '자동차'],
      views: 200,
      likes: 40,
      isPublished: true,
      createdAt: new Date('2024-01-10'),
      updatedAt: new Date('2024-01-10')
    },
    {
      id: '3',
      title: '환경을 생각하는 놀이',
      content: '<h2>환경을 생각하는 놀이</h2><p>재활용과 환경 보호에 대한 내용입니다.</p>',
      author: '환경팀',
      authorEmail: 'eco@boxro.com',
      authorId: 'eco',
      thumbnail: '/boxro_green.png',
      summary: '버려지는 박스로 멋진 자동차를 만들며 환경도 지키는 방법을 알아보세요.',
      tags: ['환경', '재활용', '놀이'],
      views: 120,
      likes: 30,
      isPublished: true,
      createdAt: new Date('2024-01-05'),
      updatedAt: new Date('2024-01-05')
    }
  ]);

  const updateArticle = (id: string, articleData: Partial<MagazineArticle>) => {
    setArticles(prevArticles => 
      prevArticles.map(article => 
        article.id === id 
          ? { ...article, ...articleData, updatedAt: new Date() }
          : article
      )
    );
  };

  const deleteArticle = (id: string) => {
    setArticles(prevArticles => 
      prevArticles.filter(article => article.id !== id)
    );
  };

  return (
    <MagazineContext.Provider value={{ articles, setArticles, updateArticle, deleteArticle }}>
      {children}
    </MagazineContext.Provider>
  );
}

export function useMagazine() {
  const context = useContext(MagazineContext);
  if (context === undefined) {
    throw new Error('useMagazine must be used within a MagazineProvider');
  }
  return context;
}
