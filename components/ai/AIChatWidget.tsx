'use client';

import { useState, useRef, useEffect } from 'react';
import { useAI } from './AIContext';
import { AIChatMessage } from './AIChatMessage';
import {
  MessageCircle, X, Expand, Minimize2, Maximize2,
  Send, Loader2, Sparkles, Bot,
} from 'lucide-react';

export function AIChatWidget() {
  const {
    messages, isOpen, isExpanded, isFullScreen, isLoading,
    sendMessage, toggleOpen, toggleExpand, toggleFullScreen, closeWidget,
  } = useAI();

  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || isLoading) return;
    setInput('');
    sendMessage(text);
  };

  const widgetWidth = isFullScreen ? '100vw' : isExpanded ? '480px' : '360px';
  const widgetHeight = isFullScreen ? '100vh' : isExpanded ? '600px' : '480px';

  if (!isOpen) {
    return (
      <button
        onClick={toggleOpen}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-2xl hover:shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center group"
      >
        <MessageCircle className="h-6 w-6 group-hover:scale-110 transition-transform" />
      </button>
    );
  }

  return (
    <div
      className="fixed z-50 bottom-6 right-6 flex flex-col bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden transition-all duration-300"
      style={{ width: widgetWidth, height: widgetHeight, maxWidth: 'calc(100vw - 32px)', maxHeight: 'calc(100vh - 32px)' }}
    >
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
            <Bot className="h-4 w-4 text-white" />
          </div>
          <div>
            <h3 className="text-white text-sm font-semibold">Ilmify AI</h3>
            <p className="text-blue-200 text-[10px]">{isLoading ? 'Tahlil qilmoqda...' : 'So\'rovingizni yozing'}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={toggleExpand} className="p-1.5 rounded-lg hover:bg-white/20 text-white/80 hover:text-white transition-colors">
            {isExpanded ? <Minimize2 className="h-3.5 w-3.5" /> : <Expand className="h-3.5 w-3.5" />}
          </button>
          <button onClick={toggleFullScreen} className="p-1.5 rounded-lg hover:bg-white/20 text-white/80 hover:text-white transition-colors">
            {isFullScreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </button>
          <button onClick={closeWidget} className="p-1.5 rounded-lg hover:bg-white/20 text-white/80 hover:text-white transition-colors">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 bg-gray-50/50 space-y-1">
        {messages.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <Sparkles className="h-10 w-10 text-blue-300 mb-3" />
            <h4 className="text-gray-700 font-medium mb-1">Ilmify AI yordamchiga xush kelibsiz!</h4>
            <p className="text-gray-400 text-xs mb-4">
              CRM tizimingiz haqida istalgan savolni bering. Men ma'lumotlar bazasidan real vaqtda javob beraman.
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {[
                "Bugun nechta o'quvchi qo'shildi?",
                "Qaysi guruhlarda davomat past?",
                "Qarzdor o'quvchilar ro'yxati",
                "Eng yaxshi davomatli o'qituvchi",
              ].map((hint, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(hint)}
                  className="px-3 py-1.5 text-xs bg-white border border-gray-200 hover:border-blue-300 hover:text-blue-600 text-gray-600 rounded-lg transition-all shadow-sm"
                >
                  {hint}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map(msg => (
          <AIChatMessage key={msg.id} message={msg} />
        ))}
        {isLoading && (
          <div className="flex justify-start mb-3">
            <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
                <span className="text-sm text-gray-500">Tahlil qilmoqda...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-3 border-t border-gray-200 bg-white shrink-0">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            data-ai-input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Savolingizni yozing..."
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 bg-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/30 focus:bg-white border border-transparent focus:border-blue-300 transition-all disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="p-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
