"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Car, 
  Heart, 
  Download, 
  Search,
  Filter,
  Star,
  Crown,
  Smartphone,
  ShoppingBag,
  ShoppingCart,
  Gift,
  Users
} from "lucide-react";
import { useAuth } from '@/contexts/AuthContext';
import CommonHeader from '@/components/CommonHeader';
import PageHeader from '@/components/PageHeader';

interface StoreItem {
  id: string;
  name: string;
  category: string;
  type: string;
  price: number;
  rating: number;
  downloads: number;
  isPremium: boolean;
  isPurchased: boolean;
  thumbnail: string;
}


export default function StorePage() {
  const { user, logout } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("popular");
  const [cartCount, setCartCount] = useState(0);

  const handleLogout = async () => {
    try {
      await logout();
      console.log('로그아웃 성공');
    } catch (error) {
      console.error('로그아웃 실패:', error);
    }
  };

  // Mock data - replace with Firebase data
  const storeItems: StoreItem[] = [
    {
      id: "1",
      name: "Sports Car Collection",
      category: "templates",
      type: "premium",
      price: 9.99,
      rating: 4.8,
      downloads: 1234,
      isPremium: true,
      isPurchased: false,
      thumbnail: "/api/placeholder/300/200"
    },
    {
      id: "2",
      name: "Monster Truck Pack",
      category: "templates",
      type: "premium",
      price: 7.99,
      rating: 4.6,
      downloads: 987,
      isPremium: true,
      isPurchased: false,
      thumbnail: "/api/placeholder/300/200"
    },
    {
      id: "3",
      name: "Free Basic Templates",
      category: "templates",
      type: "free",
      price: 0,
      rating: 4.2,
      downloads: 2156,
      isPremium: false,
      isPurchased: true,
      thumbnail: "/api/placeholder/300/200"
    },
    {
      id: "4",
      name: "Window Decorations",
      category: "decorations",
      type: "premium",
      price: 4.99,
      rating: 4.7,
      downloads: 756,
      isPremium: true,
      isPurchased: false,
      thumbnail: "/api/placeholder/300/200"
    },
    {
      id: "5",
      name: "Wheel Collection",
      category: "decorations",
      type: "premium",
      price: 3.99,
      rating: 4.5,
      downloads: 634,
      isPremium: true,
      isPurchased: false,
      thumbnail: "/api/placeholder/300/200"
    },
    {
      id: "6",
      name: "Holiday Special Pack",
      category: "decorations",
      type: "premium",
      price: 12.99,
      rating: 4.9,
      downloads: 432,
      isPremium: true,
      isPurchased: false,
      thumbnail: "/api/placeholder/300/200"
    }
  ];

  const filteredAndSortedItems = storeItems
    .filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = filterCategory === "all" || item.category === filterCategory;
      const matchesType = filterType === "all" || item.type === filterType;
      return matchesSearch && matchesCategory && matchesType;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "popular":
          return b.downloads - a.downloads;
        case "rating":
          return b.rating - a.rating;
        case "price-low":
          return a.price - b.price;
        case "price-high":
          return b.price - a.price;
        default:
          return 0;
      }
    });

  const addToCart = (itemId: string) => {
    setCartCount(prev => prev + 1);
    // Mock cart functionality
    console.log('Added to cart:', itemId);
  };

  const purchaseItem = (itemId: string) => {
    // Mock purchase functionality
    console.log('Purchased:', itemId);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'templates': return 'bg-blue-100 text-blue-800';
      case 'decorations': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'premium': return 'bg-yellow-100 text-yellow-800';
      case 'free': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div 
      className="min-h-screen py-16 md:py-24"
      style={{
        background: 'linear-gradient(100deg, #2563eb, #7c3aed, #ec4899)',
        touchAction: 'pan-y',
        overscrollBehavior: 'none'
      }}
    >
      <CommonHeader />
      
      <div className="max-w-7xl mx-auto px-0 md:px-8">
        <div className="mb-6 mt-10 px-4 md:px-0">
          <PageHeader 
            title="박스로 스토어"
            description="새로운 박스카 도안을 만나보세요. 더 많은 디자인으로 업그레이드할 수 있어요!"
          />
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 px-4 md:px-0">
          <div className="flex items-center gap-4">
            <Button variant="outline" className="bg-transparent border-white/30 text-white hover:bg-white/10">
              <ShoppingCart className="w-4 h-4 mr-2" />
              장바구니 ({cartCount})
            </Button>
            <Link href="/draw">
              <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 rounded-full px-6 py-3">
                <Car className="w-4 h-4 mr-2" />
                무료로 시작하기
              </Button>
            </Link>
          </div>
        </div>

        {/* Search and Filter */}
        <Card className="bg-white border-2 border-white/30 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden py-5 w-full rounded-2xl mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="템플릿과 장식 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex gap-2">
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">모든 카테고리</option>
                  <option value="templates">템플릿</option>
                  <option value="decorations">장식</option>
                </select>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">모든 유형</option>
                  <option value="premium">프리미엄</option>
                  <option value="free">무료</option>
                </select>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="popular">인기순</option>
                  <option value="rating">평점순</option>
                  <option value="price-low">가격: 낮음→높음</option>
                  <option value="price-high">가격: 높음→낮음</option>
                </select>
              </div>
            </div>
        </Card>

        {/* Premium Banner */}
        <Card className="bg-gradient-to-r from-yellow-400 to-orange-500 border-2 border-yellow-300 shadow-xl hover:shadow-2xl transition-all duration-300 rounded-2xl overflow-hidden mb-6 w-full">
            <div className="flex items-center justify-center mb-4">
              <Crown className="w-8 h-8 text-white mr-3" />
              <h2 className="text-2xl font-bold text-white">프리미엄으로 업그레이드</h2>
            </div>
            <p className="text-white/90 mb-4">모든 템플릿과 장식을 무제한으로 사용하고, 새로운 기능을 먼저 경험해보세요!</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button className="bg-white text-orange-600 hover:bg-gray-100">
                <Star className="w-4 h-4 mr-2" />
                무료 체험
              </Button>
              <Button className="bg-orange-600 text-white hover:bg-orange-700">
                <Crown className="w-4 h-4 mr-2" />
                프리미엄으로 업그레이드
              </Button>
            </div>
        </Card>

        {/* Items Grid */}
        {filteredAndSortedItems.length === 0 ? (
          <Card className="bg-white border-2 border-white/30 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden py-5 w-full rounded-2xl">
            <CardContent className="py-12">
              <div className="flex flex-col items-center justify-center text-center">
                <ShoppingBag className="w-16 h-16 text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold text-gray-800 mb-2">상품이 없습니다</h3>
                <p className="text-gray-600">
                  {searchTerm || filterCategory !== "all" || filterType !== "all"
                    ? "검색어나 필터 조건을 조정해보세요"
                    : "곧 새로운 상품이 추가될 예정입니다!"
                  }
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSortedItems.map((item) => (
              <Card key={item.id} className="bg-white border-2 border-white/30 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden py-5 w-full rounded-2xl">
                <div className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="text-lg font-semibold">{item.name}</div>
                    <div className="flex gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(item.category)}`}>
                        {item.category === 'templates' ? '템플릿' : item.category === 'decorations' ? '장식' : item.category}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(item.type)}`}>
                        {item.type === 'premium' ? '프리미엄' : item.type === 'free' ? '무료' : item.type}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={`w-4 h-4 ${i < Math.floor(item.rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-500">({item.rating})</span>
                  </div>
                </div>
                  <div className="mb-4">
                    <div className="w-full h-48 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center relative">
                      <Car className="w-16 h-16 text-gray-400" />
                      {item.isPremium && (
                        <div className="absolute top-2 right-2 bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full text-xs font-bold">
                          SALE!
                        </div>
                      )}
                      {item.type === 'free' && (
                        <div className="absolute top-2 right-2 bg-green-400 text-green-900 px-2 py-1 rounded-full text-xs font-bold">
                          FREE
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center text-sm text-gray-500 mb-4">
                    <div className="flex items-center gap-1">
                      <Download className="w-4 h-4" />
                      {item.downloads} 다운로드
                    </div>
                    {item.isPremium && (
                      <span className="font-semibold text-yellow-600">${item.price}</span>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    {item.isPurchased ? (
                      <Button className="flex-1 bg-green-600 hover:bg-green-700">
                        <Download className="w-4 h-4 mr-1" />
                        구매완료
                      </Button>
                    ) : item.type === 'free' ? (
                      <Button className="flex-1">
                        <Download className="w-4 h-4 mr-1" />
                        무료 받기
                      </Button>
                    ) : (
                      <>
                        <Button 
                          variant="outline" 
                          className="flex-1"
                          onClick={() => addToCart(item.id)}
                        >
                          <ShoppingCart className="w-4 h-4 mr-1" />
                          장바구니
                        </Button>
                        <Button 
                          className="flex-1"
                          onClick={() => purchaseItem(item.id)}
                        >
                          <Gift className="w-4 h-4 mr-1" />
                          ${item.price} 구매
                        </Button>
                      </>
                    )}
                  </div>
              </Card>
            ))}
          </div>
        )}

        {/* Featured Collections */}
        <Card className="bg-white border-2 border-white/30 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden py-5 w-full rounded-2xl mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-yellow-500" />
              인기 컬렉션
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { name: '스포츠카 컬렉션', count: 15, price: '$19.99' },
                { name: '트럭 & 버스 팩', count: 12, price: '$14.99' },
                { name: '휴일 특별 팩', count: 8, price: '$9.99' }
              ].map((collection, index) => (
                <div key={index} className="p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                  <div className="font-medium text-gray-900">{collection.name}</div>
                  <div className="text-sm text-gray-600">{collection.count}개 아이템</div>
                  <div className="text-lg font-bold text-blue-600">{collection.price}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

