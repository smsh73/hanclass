'use client';

import dynamic from 'next/dynamic';

const ConversationContent = dynamic(() => import('./ConversationContent'), {
  ssr: false,
  loading: () => <div className="p-8">로딩 중...</div>,
});

export default ConversationContent;
