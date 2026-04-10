'use client';
import { useState, useRef, useEffect } from 'react';
import { useI18n } from '@/lib/i18n-context';
import { useChatStream, ChatMessage } from '@/lib/hooks/use-chat-stream';
import { TopBar } from './top-bar';
import { ChatMessageBubble } from './chat-message';
import { ChatInput } from './chat-input';
import { ModelToggle } from './model-toggle';
import { SystemPromptPanel } from './system-prompt-panel';
import { SaveDialog } from './save-dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Save, Download, Settings, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface ChatLabProps {
  teamName: string;
  xp: number;
}

export function ChatLab({ teamName, xp }: ChatLabProps) {
  const { t } = useI18n();
  const [model, setModel] = useState<'gpt-4o' | 'claude-sonnet' | 'both'>('gpt-4o');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(1024);
  const [showSettings, setShowSettings] = useState(false);
  const [showSave, setShowSave] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    gptMessages,
    claudeMessages,
    isStreaming,
    error,
    sendMessage,
    stopStreaming,
    clearMessages,
  } = useChatStream();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, gptMessages, claudeMessages]);

  const handleSend = (content: string, image?: string) => {
    sendMessage(content, { model, systemPrompt, temperature, maxTokens }, image);
  };

  const handleModelChange = (m: 'gpt-4o' | 'claude-sonnet' | 'both') => {
    if (!isStreaming) {
      setModel(m);
      clearMessages();
    }
  };

  const getDefaultTitle = () => {
    const firstUserMsg = (model === 'both' ? gptMessages : messages).find(m => m.role === 'user');
    return firstUserMsg?.content.slice(0, 60) || 'Chat conversation';
  };

  const handleSaveToGallery = async (title: string) => {
    const data = model === 'both'
      ? { model: 'both', gptMessages, claudeMessages, systemPrompt }
      : { model, messages, systemPrompt };

    const res = await fetch('/api/gallery', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'chat', title, data }),
    });
    const result = await res.json();
    if (!result.ok) throw new Error(result.error || 'Save failed');
  };

  const handleExport = () => {
    const lines: string[] = [`# Chat — ${getDefaultTitle()}`, '', `**Team:** ${teamName}`, `**Date:** ${new Date().toLocaleDateString()}`, '', '---', ''];

    const msgs = model === 'both'
      ? [...gptMessages.map(m => ({ ...m, label: m.role === 'assistant' ? 'GPT-4o' : 'User' })),
         ...claudeMessages.filter(m => m.role === 'assistant').map(m => ({ ...m, label: 'Claude Sonnet' }))]
      : messages;

    for (const msg of msgs) {
      const label = 'label' in msg ? (msg as { label: string }).label : (msg.role === 'user' ? 'User' : (model === 'gpt-4o' ? 'GPT-4o' : 'Claude Sonnet'));
      lines.push(`## ${label}`, '', msg.content, '');
    }

    const blob = new Blob([lines.join('\n')], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const hasMessages = model === 'both' ? gptMessages.length > 0 : messages.length > 0;

  return (
    <div className="min-h-screen bg-mest-paper flex flex-col">
      <TopBar teamName={teamName} xp={xp} />

      {/* Toolbar */}
      <div className="bg-white border-b border-mest-grey-300/60 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Link href="/studio" className="text-mest-grey-500 hover:text-mest-ink">
              <ArrowLeft size={20} />
            </Link>
            <h1 className="font-serif text-xl text-mest-ink">{t('chat.title')}</h1>
          </div>

          <ModelToggle value={model} onChange={handleModelChange} disabled={isStreaming} />

          <div className="flex items-center gap-2">
            {hasMessages && (
              <>
                <Button variant="outline" size="sm" onClick={() => setShowSave(true)} className="gap-1.5">
                  <Save size={14} />
                  {t('chat.save')}
                </Button>
                <Button variant="outline" size="sm" onClick={handleExport} className="gap-1.5">
                  <Download size={14} />
                  {t('chat.export')}
                </Button>
              </>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
              aria-label="Settings"
            >
              <Settings size={16} />
            </Button>
          </div>
        </div>
      </div>

      <SystemPromptPanel value={systemPrompt} onChange={setSystemPrompt} />

      {/* Settings panel */}
      {showSettings && (
        <div className="bg-white border-b border-mest-grey-300/60 px-4 py-4">
          <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-medium text-mest-ink block mb-2">
                {t('chat.temperature')}: {temperature.toFixed(1)}
              </label>
              <Slider
                value={[temperature]}
                onValueChange={(v) => setTemperature(Array.isArray(v) ? v[0] : v)}
                min={0}
                max={2}
                step={0.1}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-mest-ink block mb-2">
                {t('chat.maxTokens')}: {maxTokens}
              </label>
              <Slider
                value={[maxTokens]}
                onValueChange={(v) => setMaxTokens(Array.isArray(v) ? v[0] : v)}
                min={256}
                max={4096}
                step={256}
              />
            </div>
          </div>
        </div>
      )}

      {/* Chat area */}
      <div className="flex-1 overflow-hidden">
        {model === 'both' ? (
          <div className="h-full grid grid-cols-1 md:grid-cols-2 divide-x divide-mest-grey-300/60">
            <MessageColumn
              label="GPT-4o"
              labelColor="text-green-700 bg-green-50"
              messages={gptMessages}
              messagesEndRef={messagesEndRef}
            />
            <MessageColumn
              label="Claude Sonnet"
              labelColor="text-purple-700 bg-purple-50"
              messages={claudeMessages}
              messagesEndRef={null}
            />
          </div>
        ) : (
          <div className="max-w-3xl mx-auto h-full overflow-y-auto px-4 py-6">
            {messages.map(msg => (
              <ChatMessageBubble key={msg.id} {...msg} />
            ))}
            {!hasMessages && (
              <div className="text-center text-mest-grey-300 mt-20 font-serif text-xl italic">
                {t('chat.placeholder')}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {error && (
        <div className="bg-mest-rust-light text-mest-rust px-4 py-2 text-sm text-center">
          {error}
        </div>
      )}

      <ChatInput
        onSend={handleSend}
        onStop={stopStreaming}
        isStreaming={isStreaming}
      />

      <SaveDialog
        open={showSave}
        onClose={() => setShowSave(false)}
        defaultTitle={getDefaultTitle()}
        onSave={handleSaveToGallery}
      />
    </div>
  );
}

function MessageColumn({
  label,
  labelColor,
  messages,
  messagesEndRef,
}: {
  label: string;
  labelColor: string;
  messages: ChatMessage[];
  messagesEndRef: React.RefObject<HTMLDivElement> | null;
}) {
  const colRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (colRef.current) {
      colRef.current.scrollTop = colRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="flex flex-col h-full">
      <div className={`px-4 py-2 text-sm font-semibold ${labelColor} border-b border-mest-grey-300/60`}>
        {label}
      </div>
      <div ref={colRef} className="flex-1 overflow-y-auto px-4 py-4" style={{ maxHeight: 'calc(100vh - 350px)' }}>
        {messages.map(msg => (
          <ChatMessageBubble key={msg.id} {...msg} />
        ))}
        {messagesEndRef && <div ref={messagesEndRef} />}
      </div>
    </div>
  );
}
