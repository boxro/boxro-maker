import type { Metadata } from 'next'

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://boxro.kr'
  return {
    alternates: {
      canonical: `${baseUrl}/store/${params.id}`,
    },
  }
}

export default function StoreDetailLayout({ children }: { children: React.ReactNode }) {
  return children;
}


