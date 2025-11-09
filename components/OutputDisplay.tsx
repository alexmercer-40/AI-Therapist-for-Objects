import React, { useState, useEffect, useRef } from 'react';
import type { MonologueResponse, DisplayMessage } from '../types';

const LoadingSpinner = () => (
    <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-brand-accent"></div>
    </div>
);

const SendIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="22" y1="2" x2="11" y2="13" />
        <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
);

const ChatInput: React.FC<{ onSend: (message: string) => void, isLoading: boolean }> = ({ onSend, isLoading }) => {
    const [input, setInput] = useState('');
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim() && !isLoading) {
            onSend(input);
            setInput('');
        }
    };
    return (
        <form onSubmit={handleSubmit} className="mt-auto flex gap-2 border-t border-white/10 pt-4">
            <input 
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="flex-grow bg-brand-muted border border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-brand-text placeholder-gray-500"
                placeholder={isLoading ? "Object is thinking..." : "Talk to your object..."}
                disabled={isLoading}
                aria-label="Chat input"
            />
            <button 
                type="submit" 
                disabled={isLoading || !input.trim()} 
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-brand-bg bg-brand-accent hover:bg-white/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-brand-bg focus:ring-white disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
                aria-label="Send message"
            >
                <SendIcon />
            </button>
        </form>
    );
};

const ActionButton: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isAcknowledged, setIsAcknowledged] = useState(false);

    const handleClick = () => {
        setIsAcknowledged(true);
        setTimeout(() => {
            setIsAcknowledged(false);
        }, 2000); // Revert back after 2 seconds
    };

    return (
        <button
            onClick={handleClick}
            disabled={isAcknowledged}
            className="bg-transparent border border-gray-500 hover:border-brand-accent hover:bg-brand-muted/60 text-gray-400 hover:text-brand-accent text-sm font-medium py-1 px-3 rounded-full transition-colors focus:outline-none focus:border-brand-accent focus:text-brand-accent disabled:cursor-not-allowed disabled:opacity-70 disabled:bg-brand-muted/50"
        >
            {isAcknowledged ? '✓ Acknowledged' : children}
        </button>
    );
};

const useTypewriter = (text: string, speed = 20) => {
  const [displayText, setDisplayText] = useState('');

  useEffect(() => {
    setDisplayText('');
    if (text) {
      let i = 0;
      const typingInterval = setInterval(() => {
        if (i < text.length) {
          setDisplayText(prevText => prevText + text.charAt(i));
          i++;
        } else {
          clearInterval(typingInterval);
        }
      }, speed);
      
      return () => {
        clearInterval(typingInterval);
      };
    }
  }, [text, speed]);

  return displayText;
};

interface OutputDisplayProps {
    messages: DisplayMessage[];
    isLoading: boolean;
    error: string | null;
    onSendMessage: (message: string) => void;
}

const OutputDisplay: React.FC<OutputDisplayProps> = ({ messages, isLoading, error, onSendMessage }) => {
    const chatEndRef = useRef<HTMLDivElement>(null);
    const lastMessage = messages[messages.length - 1];
    const isLastMessageFromObject = lastMessage?.sender === 'object';
    const typedText = useTypewriter(isLastMessageFromObject ? lastMessage.text : '');

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, typedText]);

    const renderContent = () => {
        if (isLoading && messages.length === 0) {
            return <LoadingSpinner />;
        }
        if (error) {
            return (
                <div className="text-center text-red-400 p-4 bg-red-900/50 rounded-lg">
                    <h3 className="font-bold text-lg">An Error Occurred</h3>
                    <p>{error}</p>
                </div>
            );
        }
        if (messages.length > 0) {
            const firstResponseDetails = messages.find(m => m.responseDetails)?.responseDetails;
            return (
                <>
                    <div className="flex-grow overflow-y-auto pr-2 -mr-2 space-y-4">
                        {firstResponseDetails && (
                            <div className="pb-4 border-b border-white/10 mb-4 animate-fade-in">
                                <h2 className="text-3xl font-bold text-brand-accent capitalize">{firstResponseDetails.object_name}</h2>
                                <p className="text-sm text-gray-400 font-mono mt-1">{firstResponseDetails.setting}</p>
                            </div>
                        )}
                        {messages.map((msg, index) => (
                            <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-prose p-3 rounded-lg prose prose-invert leading-relaxed whitespace-pre-wrap ${msg.sender === 'user' ? 'bg-indigo-600/50' : 'bg-brand-muted'}`}>
                                    {isLastMessageFromObject && index === messages.length - 1 ? typedText : msg.text}
                                </div>
                            </div>
                        ))}
                        {isLoading && messages.length > 0 && (
                            <div className="flex justify-start">
                                <div className="max-w-prose p-3 rounded-lg bg-brand-muted">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75"></div>
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></div>
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-300"></div>
                                    </div>
                                </div>
                            </div>
                        )}
                         {firstResponseDetails && firstResponseDetails.actions.length > 0 && messages.length === 1 && (
                            <div className="animate-fade-in pt-2">
                                <h4 className="text-sm font-semibold text-gray-400 mb-2">Gentle Nudges:</h4>
                                <div className="flex flex-wrap gap-2">
                                    {firstResponseDetails.actions.map((action, index) => (
                                        <ActionButton key={index}>{action}</ActionButton>
                                    ))}
                                </div>
                            </div>
                        )}
                        <div ref={chatEndRef} />
                    </div>
                    <ChatInput onSend={onSendMessage} isLoading={isLoading} />
                </>
            );
        }
        return (
            <div className="text-center text-gray-500 flex flex-col items-center justify-center h-full">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="opacity-50 mb-4"><path d="M12 2a10 10 0 1 0 10 10c0-2.2-1-4-2-4"/><path d="m14 10-2-2-2 2"/><path d="M12 12v4"/></svg>
                <p>Your object's inner thoughts will appear here.</p>
            </div>
        );
    };

    return (
        <div className="bg-brand-muted/50 rounded-lg p-6 lg:p-8 border border-white/10 shadow-lg min-h-[400px] lg:min-h-0 flex flex-col justify-between">
          {renderContent()}
        </div>
    );
};

export default OutputDisplay;
