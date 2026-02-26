import { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Bot, User, Minimize2, Maximize2, Loader2, RefreshCw } from 'lucide-react';
import { apiClient } from '../../api/client';
import type { ChatMessage } from '../../types';
import clsx from 'clsx';

const FloatingWidget = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [sessionId, setSessionId] = useState<number | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Load history on mount or when opening
    useEffect(() => {
        if (isOpen && !sessionId) {
            // Fetch history or start new? For now, let's just start clean or fetch last session
            // logic can be improved to list sessions
        }
    }, [isOpen]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMsg: ChatMessage = { role: 'user', content: input, timestamp: new Date().toISOString() };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        // Add a placeholder AI message that we will stream into
        const aiMsgId = Date.now();
        setMessages(prev => [...prev, {
            role: 'ai',
            content: '',
            timestamp: new Date().toISOString()
        }]);

        try {
            const response = await fetch('http://localhost:8000/api/ai/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    query: input,
                    session_id: sessionId
                }),
            });

            if (!response.body) throw new Error('No response body');

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let aiResponse = '';

            // Check for session ID in headers
            const newSessionId = response.headers.get('X-Session-Id');
            if (newSessionId) setSessionId(parseInt(newSessionId));

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                aiResponse += chunk;

                setMessages(prev => {
                    const newMessages = [...prev];
                    const lastMsg = newMessages[newMessages.length - 1];
                    if (lastMsg.role === 'ai') {
                        lastMsg.content = aiResponse;
                    }
                    return newMessages;
                });
            }

        } catch (error) {
            console.error("Chat error", error);
            setMessages(prev => {
                // Remove the empty/partial AI message if failed, or append error
                const newMessages = [...prev];
                const lastMsg = newMessages[newMessages.length - 1];
                if (lastMsg.role === 'ai') {
                    lastMsg.content += "\n[Connection Failed]";
                }
                return newMessages;
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            {/* Chat Window */}
            {isOpen && (
                <div className="mb-4 w-96 h-[500px] bg-white dark:bg-[#151b29] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-200">
                    {/* Header */}
                    <div className="bg-slate-900 p-4 flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white">
                                <Bot className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-white font-bold text-sm">Master AI</h3>
                                <div className="flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                                    <span className="text-xs text-slate-400">Online & Ready</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <button onClick={() => setMessages([])} className="p-1.5 text-slate-400 hover:text-white rounded transition-colors" title="Clear Chat">
                                <RefreshCw className="w-4 h-4" />
                            </button>
                            <button onClick={() => setIsOpen(false)} className="p-1.5 text-slate-400 hover:text-white rounded transition-colors">
                                <Maximize2 className="w-4 h-4" /> {/* Actually minimize */}
                            </button>
                        </div>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-[#0b1019] scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
                        {messages.length === 0 && (
                            <div className="h-full flex flex-col items-center justify-center text-center p-6 opacity-50">
                                <Bot className="w-12 h-12 text-slate-400 mb-4" />
                                <p className="text-slate-500 text-sm">
                                    Hello! I'm your security assistant.
                                    Ask me about traffic, incidents, or to analyze a specific IP.
                                </p>
                            </div>
                        )}

                        {messages.map((msg, idx) => (
                            <div key={idx} className={clsx("flex gap-3", msg.role === 'user' ? "flex-row-reverse" : "flex-row")}>
                                <div className={clsx(
                                    "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                                    msg.role === 'user' ? "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300" : "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400"
                                )}>
                                    {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                                </div>
                                <div className={clsx(
                                    "max-w-[80%] rounded-2xl p-3 text-sm leading-relaxed",
                                    msg.role === 'user'
                                        ? "bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white rounded-tr-sm"
                                        : "bg-white dark:bg-[#151b29] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-tl-sm shadow-sm"
                                )}>
                                    {msg.content.split('\n').map((line, i) => (
                                        <p key={i} className="mb-1 last:mb-0">
                                            {line.split(/(\*\*.*?\*\*)/).map((part, index) =>
                                                part.startsWith('**') && part.endsWith('**') ? (
                                                    <strong key={index} className="font-bold text-indigo-700 dark:text-indigo-300">
                                                        {part.slice(2, -2)}
                                                    </strong>
                                                ) : (
                                                    part
                                                )
                                            )}
                                        </p>
                                    ))}
                                    <span className="text-[10px] opacity-40 block mt-1 text-right">
                                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </div>
                        ))}

                        {isLoading && (
                            <div className="flex gap-3">
                                <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                                    <Bot className="w-4 h-4" />
                                </div>
                                <div className="bg-white dark:bg-[#151b29] border border-slate-200 dark:border-slate-800 rounded-2xl rounded-tl-sm p-3 shadow-sm flex items-center gap-2">
                                    <span className="flex gap-1">
                                        <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce delay-0"></span>
                                        <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce delay-150"></span>
                                        <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce delay-300"></span>
                                    </span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-3 bg-white dark:bg-[#151b29] border-t border-slate-200 dark:border-slate-800">
                        <div className="relative flex items-center">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Ask about threats, logs, or IPs..."
                                className="w-full pl-4 pr-12 py-3 rounded-xl bg-slate-100 dark:bg-slate-900 border-none focus:ring-2 focus:ring-indigo-500 dark:text-white placeholder-slate-400 resize-none text-sm shadow-inner"
                                disabled={isLoading}
                                autoFocus
                            />
                            <button
                                onClick={handleSend}
                                disabled={!input.trim() || isLoading}
                                className="absolute right-2 p-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white rounded-lg transition-colors shadow-lg shadow-indigo-500/20"
                            >
                                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={clsx(
                    "w-14 h-14 rounded-full shadow-2xl flex items-center justify-center text-white transition-all transform hover:scale-110 active:scale-95",
                    isOpen ? "bg-slate-700 rotate-90" : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:shadow-indigo-500/50"
                )}
            >
                {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-7 h-7" />}
            </button>
        </div>
    );
};

export default FloatingWidget;
