import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Clock } from 'lucide-react';

export const metadata: Metadata = {
  metadataBase: new URL('https://tipout.org'),
  title: 'Why Equal Tip Splits Are Costing You Your Best Staff',
  description: 'Dividing tips strictly by head count ignores hours logged and job difficulty. Here is why top-performing bartenders and servers quit over flat splits.',
  openGraph: {
    title: 'Why Equal Tip Splits Are Costing You Your Best Staff',
    description: 'Dividing tips strictly by head count ignores hours logged and job difficulty.',
    url: 'https://tipout.org/blog/posts/why-equal-tip-splits-fail',
    siteName: 'TipOut',
  },
};

export default function PostOne() {
  return (
    <div className="flex flex-col min-h-screen p-5 bg-[#14171C] text-[#F2ECE4] font-sans max-w-md mx-auto relative pb-28">
      <div className="flex items-center space-x-4 mb-6 pt-2">
        <Link href="/blog" className="w-10 h-10 bg-[#1D2128] border border-[#2B303A] rounded-2xl flex items-center justify-center hover:bg-[#2B303A]/50 transition">
          <ArrowLeft className="w-5 h-5 text-[#F2ECE4]" />
        </Link>
        <span className="text-xs font-mono text-[#8B9099]">Back to blog</span>
      </div>

      <article className="space-y-6">
        <div>
          <div className="flex items-center space-x-2 text-xs font-mono text-[#8B9099] mb-3">
            <span>Sept 2026</span>
            <span>•</span>
            <span className="flex items-center space-x-1"><Clock className="w-3 h-3" /><span>3 min read</span></span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#F2ECE4] leading-snug">
            Why Equal Tip Splits Are Costing You Your Best Staff
          </h1>
        </div>

        <div className="space-y-4 text-xs text-[#8B9099] leading-relaxed border-t border-[#2B303A] pt-4">
          <p className="text-sm text-[#F2ECE4] font-medium">
            If you divide total shift tips equally among every worker on the floor regardless of hours or role, you are punishing your highest producers.
          </p>
          <p>
            In busy hospitality environments, an 8-hour closer handling the bar or heavy section carries a completely different workload than a 4-hour host. When flat splits are enforced, fast and efficient workers realize their extra output subsidizes slower shifts.
          </p>
          <h3 className="text-sm font-bold text-[#F2ECE4] pt-2">The Solution: Role & Hour Weighting</h3>
          <p>
            Fair tip distribution requires accounting for two core metrics: <strong>time spent on shift (hours)</strong> and <strong>station difficulty (role weights)</strong>. Utilizing a transparent calculator like <a href="/" className="text-[#C08552] underline">TipOut</a> ensures every closing worker walks away knowing the math was exact, fair, and indisputable.
          </p>
        </div>
      </article>
    </div>
  );
}