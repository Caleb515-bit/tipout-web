// app/blog/page.tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Clock } from 'lucide-react';

export const metadata: Metadata = {
  metadataBase: new URL('https://tipout.org'),
  title: 'TipOut Blog — Practical Guides for Hospitality Workers',
  description: 'No-nonsense guides on shift math, tip pools, role weights, and closing management for servers and bartenders.',
  openGraph: {
    title: 'TipOut Blog — Practical Guides for Hospitality Workers',
    description: 'No-nonsense guides on shift math, tip pools, role weights, and closing management.',
    url: 'https://tipout.org/blog',
    siteName: 'TipOut',
  },
};

export default function BlogIndex() {
  const posts = [
    {
      slug: 'why-equal-tip-splits-fail',
      title: 'Why Equal Tip Splits Are Costing You Your Best Staff',
      description: 'Dividing tips strictly by head count ignores hours logged and job difficulty. Here is why top-performing bartenders and servers quit over flat splits.',
      date: 'Sept 2026',
      readTime: '3 min read',
    },
    {
      slug: 'how-to-calculate-role-weights',
      title: 'How to Set Fair Role Weights for Bar and Floor Staff',
      description: 'A practical framework for balancing front-of-house multipliers between servers, bussers, barbacks, and bartenders without causing team friction.',
      date: 'Sept 2026',
      readTime: '4 min read',
    },
    {
      slug: 'digital-closing-sheets-vs-paper',
      title: 'Stop Losing Paper Closing Sheets at the End of the Night',
      description: 'Why messy calculators and grease-stained notebooks lead to closing errors and staff disputes—and how digital logging protects shift managers.',
      date: 'Sept 2026',
      readTime: '3 min read',
    },
  ];

  return (
    <div className="flex flex-col min-h-screen p-5 bg-[#14171C] text-[#F2ECE4] font-sans max-w-md mx-auto relative pb-28">
      {/* Header */}
      <div className="flex items-center space-x-4 mb-8 pt-2">
        <Link href="/" className="w-10 h-10 bg-[#1D2128] border border-[#2B303A] rounded-2xl flex items-center justify-center hover:bg-[#2B303A]/50 transition">
          <ArrowLeft className="w-5 h-5 text-[#F2ECE4]" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#F2ECE4]">TipOut Blog</h1>
          <p className="text-xs text-[#8B9099]">Practical shift math & closing guides</p>
        </div>
      </div>

      {/* Posts List */}
      <div className="space-y-4">
        {posts.map((post) => (
          <Link 
            key={post.slug} 
            href={`/blog/posts/${post.slug}`}
            className="block bg-[#1D2128] border border-[#2B303A] rounded-3xl p-5 hover:border-[#C08552] transition shadow-md group"
          >
            <div className="flex items-center justify-between text-[11px] font-mono text-[#8B9099] mb-2">
              <span>{post.date}</span>
              <span className="flex items-center space-x-1">
                <Clock className="w-3 h-3" />
                <span>{post.readTime}</span>
              </span>
            </div>
            <h2 className="text-base font-bold text-[#F2ECE4] group-hover:text-[#C08552] transition mb-2">
              {post.title}
            </h2>
            <p className="text-xs text-[#8B9099] leading-relaxed mb-4">
              {post.description}
            </p>
            <div className="flex items-center space-x-1 text-xs font-bold text-[#C08552]">
              <span>Read guide</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}