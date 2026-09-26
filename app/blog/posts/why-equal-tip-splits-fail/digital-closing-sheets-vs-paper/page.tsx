import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Clock } from 'lucide-react';

export const metadata: Metadata = {
  metadataBase: new URL('https://tipout.org'),
  title: 'Stop Losing Paper Closing Sheets at the End of the Night',
  description: 'Why messy calculators and grease-stained notebooks lead to closing errors and staff disputes—and how digital logging protects shift managers.',
  openGraph: {
    title: 'Stop Losing Paper Closing Sheets at the End of the Night',
    description: 'Why messy calculators and grease-stained notebooks lead to closing errors.',
    url: 'https://tipout.org/blog/posts/digital-closing-sheets-vs-paper',
    siteName: 'TipOut',
  },
};

export default function PostThree() {
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
            Stop Losing Paper Closing Sheets at the End of the Night
          </h1>
        </div>

        <div className="space-y-4 text-xs text-[#8B9099] leading-relaxed border-t border-[#2B303A] pt-4">
          <p className="text-sm text-[#F2ECE4] font-medium">
            At 2:00 AM after a double shift, nobody wants to squint at handwritten math on a greasy napkin or a lost clipboard sheet.
          </p>
          <p>
            Paper logs disappear, rounding errors cause friction over cents, and managers have zero historical record when staff questions past payouts days later.
          </p>
          <h3 className="text-sm font-bold text-[#F2ECE4] pt-2">Instant Digital Receipts</h3>
          <p>
            Moving to a mobile web app lets you calculate exact match tip pools, save shift records locally or in the cloud, and export clean PNG receipt images right to your group chat.
          </p>
        </div>
      </article>
    </div>
  );
}