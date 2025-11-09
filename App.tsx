import React, { useState, useCallback } from 'react';
import InputPanel from './components/InputPanel';
import OutputDisplay from './components/OutputDisplay';
import { generateChatResponse } from './services/geminiService';
import type { Controls, MonologueResponse, ApiChatMessage, DisplayMessage } from './types';

const Header = () => (
    <header className="text-center py-8 border-b border-white/10">
      <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-brand-accent">
        AI Therapist for Objects
      </h1>
      <p className="mt-3 text-lg text-gray-400 max-w-2xl mx-auto">
        Give a voice to your everyday items. What would your coffee mug say if it could talk?
      </p>
    </header>
);

const App: React.FC = () => {
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [apiHistory, setApiHistory] = useState<ApiChatMessage[]>([]);
    const [displayMessages, setDisplayMessages] = useState<DisplayMessage[]>([]);

    const handleStartChat = useCallback(async (
      image: File | null,
      description: string,
      controls: string
    ) => {
        setIsLoading(true);
        setError(null);
        setApiHistory([]);
        setDisplayMessages([]);

        try {
            let parsedControls: Controls = {};
            if (controls) {
              try {
                parsedControls = JSON.parse(controls);
              } catch (e) {
                throw new Error("Invalid controls JSON. Please check the syntax.");
              }
            }
            const { response, newHistory } = await generateChatResponse(image, description, parsedControls, []);
            const monologueResponse = response as MonologueResponse;
            
            setApiHistory(newHistory);
            setDisplayMessages([
                { 
                    sender: 'object', 
                    text: monologueResponse.monologue, 
                    responseDetails: monologueResponse 
                }
            ]);

        } catch (e: any) {
            setError(e.message || 'An unexpected error occurred.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    const handleSendMessage = useCallback(async (message: string) => {
        setIsLoading(true);
        setError(null);
        setDisplayMessages(prev => [...prev, { sender: 'user', text: message }]);

        try {
            const { response, newHistory } = await generateChatResponse(null, '', {}, apiHistory, message);
            const textResponse = response as string;
            setApiHistory(newHistory);
            setDisplayMessages(prev => [...prev, { sender: 'object', text: textResponse }]);
        } catch (e: any) {
            setError(e.message || 'An unexpected error occurred.');
            // remove the user's message if the API call fails
            setDisplayMessages(prev => prev.slice(0, -1));
        } finally {
            setIsLoading(false);
        }
    }, [apiHistory]);


    return (
        <div className="min-h-screen bg-brand-bg text-brand-text">
            <Header />
            <main className="p-4 md:p-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
                    <InputPanel onGenerate={handleStartChat} isLoading={isLoading} />
                    <OutputDisplay 
                      messages={displayMessages} 
                      isLoading={isLoading} 
                      error={error} 
                      onSendMessage={handleSendMessage}
                    />
                </div>
            </main>
            <footer className="text-center p-6 text-sm text-gray-500 border-t border-white/10 mt-8">
              Built with React, Tailwind CSS, and the Gemini API.
            </footer>
        </div>
    );
};

export default App;
