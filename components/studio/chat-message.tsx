'use client';

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  image?: string;
  source?: 'gpt' | 'claude';
}

export function ChatMessageBubble({ role, content, image, source }: ChatMessageProps) {
  const isUser = role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-[85%] rounded-xl px-4 py-3 ${
        isUser
          ? 'bg-mest-blue text-white'
          : 'bg-white border border-mest-grey-300/60'
      }`}>
        {source && (
          <div className={`text-xs font-semibold mb-1 ${
            source === 'gpt' ? 'text-green-600' : 'text-purple-600'
          }`}>
            {source === 'gpt' ? 'GPT-4o' : 'Claude Sonnet'}
          </div>
        )}
        {image && isUser && (
          <img src={image} alt="Attached" className="max-w-[200px] rounded-lg mb-2" />
        )}
        <div className="text-sm whitespace-pre-wrap break-words">
          {content || <span className="animate-pulse">●●●</span>}
        </div>
      </div>
    </div>
  );
}
