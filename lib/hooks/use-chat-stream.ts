'use client';
import { useState, useCallback, useRef } from 'react';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  image?: string;
  source?: 'gpt' | 'claude';
  timestamp: number;
}

interface UseChatStreamOptions {
  model: 'gpt-4o' | 'claude-sonnet' | 'both';
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
}

export function useChatStream() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [gptMessages, setGptMessages] = useState<ChatMessage[]>([]);
  const [claudeMessages, setClaudeMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (
    content: string,
    options: UseChatStreamOptions,
    image?: string
  ) => {
    setError(null);
    setIsStreaming(true);

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      image,
      timestamp: Date.now(),
    };

    // Build message history for the API
    const allMessages: Array<{ role: string; content: string; image?: string }> = [];

    if (options.systemPrompt) {
      allMessages.push({ role: 'system', content: options.systemPrompt });
    }

    if (options.model === 'both') {
      // Use gptMessages as the conversation history (both share same user messages)
      setGptMessages(prev => [...prev, userMsg]);
      setClaudeMessages(prev => [...prev, userMsg]);

      for (const msg of gptMessages) {
        if (msg.role === 'user') {
          allMessages.push({ role: 'user', content: msg.content, image: msg.image });
        } else {
          allMessages.push({ role: 'assistant', content: msg.content });
        }
      }
    } else {
      setMessages(prev => [...prev, userMsg]);
      for (const msg of messages) {
        allMessages.push({ role: msg.role, content: msg.content, image: msg.image });
      }
    }

    allMessages.push({ role: 'user', content, image });

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: options.model,
          messages: allMessages,
          temperature: options.temperature,
          maxTokens: options.maxTokens,
        }),
        signal: controller.signal,
      });

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No reader');

      const decoder = new TextDecoder();
      let gptContent = '';
      let claudeContent = '';
      let singleContent = '';

      const gptId = crypto.randomUUID();
      const claudeId = crypto.randomUUID();
      const singleId = crypto.randomUUID();

      if (options.model === 'both') {
        setGptMessages(prev => [...prev, { id: gptId, role: 'assistant', content: '', source: 'gpt', timestamp: Date.now() }]);
        setClaudeMessages(prev => [...prev, { id: claudeId, role: 'assistant', content: '', source: 'claude', timestamp: Date.now() }]);
      } else {
        setMessages(prev => [...prev, { id: singleId, role: 'assistant', content: '', timestamp: Date.now() }]);
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value, { stream: true });
        const lines = text.split('\n');

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const data = JSON.parse(line.slice(6));

            if (data.done) continue;
            if (data.error) {
              if (data.source === 'gpt') {
                setGptMessages(prev => prev.map(m => m.id === gptId ? { ...m, content: `⚠️ ${data.error}` } : m));
              } else if (data.source === 'claude') {
                setClaudeMessages(prev => prev.map(m => m.id === claudeId ? { ...m, content: `⚠️ ${data.error}` } : m));
              } else {
                setError(data.error);
              }
              continue;
            }

            if (options.model === 'both') {
              if (data.source === 'gpt') {
                gptContent += data.chunk;
                const c = gptContent;
                setGptMessages(prev => prev.map(m => m.id === gptId ? { ...m, content: c } : m));
              } else if (data.source === 'claude') {
                claudeContent += data.chunk;
                const c = claudeContent;
                setClaudeMessages(prev => prev.map(m => m.id === claudeId ? { ...m, content: c } : m));
              }
            } else if (data.chunk) {
              singleContent += data.chunk;
              const c = singleContent;
              setMessages(prev => prev.map(m => m.id === singleId ? { ...m, content: c } : m));
            }
          } catch {}
        }
      }
    } catch (err: unknown) {
      if ((err as Error).name !== 'AbortError') {
        setError('Something went wrong. Try again.');
      }
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  }, [messages, gptMessages]);

  const stopStreaming = useCallback(() => {
    abortRef.current?.abort();
    setIsStreaming(false);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setGptMessages([]);
    setClaudeMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    gptMessages,
    claudeMessages,
    isStreaming,
    error,
    sendMessage,
    stopStreaming,
    clearMessages,
  };
}
