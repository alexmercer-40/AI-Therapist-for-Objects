
import React, { useState, useRef } from 'react';

const UploadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

const SparklesIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 3-1.9 4.8-4.8 1.9 4.8 1.9L12 21l1.9-4.8 4.8-1.9-4.8-1.9L12 3z"/>
    <path d="M5 8.5 3.5 5 2 8.5l-3.5 1.5L2 11.5l1.5 3.5L5 11.5l3.5-1.5L5 8.5z"/>
    <path d="M22 15.5 20.5 12 19 15.5l-3.5 1.5L19 18.5l1.5 3.5L22 18.5l3.5-1.5L22 15.5z"/>
  </svg>
);

interface InputPanelProps {
    onGenerate: (image: File | null, description: string, controls: string) => void;
    isLoading: boolean;
}

const defaultControls = {
  "controls": {
    "mode": "monologue",
    "tone": "warm",
    "length": "short",
    "reading_level": "plain",
    "language": "en",
    "nudge_style": "wellness",
    "allow_gentle_humor": true,
    "cultural_context": "auto"
  }
};

const InputPanel: React.FC<InputPanelProps> = ({ onGenerate, isLoading }) => {
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [description, setDescription] = useState<string>('');
    const [controls, setControls] = useState<string>(JSON.stringify(defaultControls, null, 2));
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();
      const file = event.dataTransfer.files?.[0];
      if (file && file.type.startsWith('image/')) {
        setImageFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    };
    
    const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();
    };


    const handleSubmit = () => {
        onGenerate(imageFile, description, controls);
    };

    return (
        <div className="bg-brand-muted/50 rounded-lg p-6 space-y-6 border border-white/10 shadow-lg">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Upload an Image</label>
              <div 
                className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-600 border-dashed rounded-md cursor-pointer hover:border-gray-500 transition-colors"
                onClick={() => fileInputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
              >
                <div className="space-y-1 text-center">
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className="mx-auto h-48 w-auto rounded-md object-contain" />
                  ) : (
                    <>
                      <div className="mx-auto h-12 w-12 text-gray-500">
                        <UploadIcon />
                      </div>
                      <div className="flex text-sm text-gray-400">
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                    </>
                  )}
                </div>
              </div>
              <input ref={fileInputRef} id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleImageChange} accept="image/*" />
            </div>

            <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-300">
                    Or Describe the Object
                </label>
                <textarea
                    id="description"
                    rows={3}
                    className="mt-1 block w-full bg-brand-muted border border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-brand-text placeholder-gray-500"
                    placeholder="e.g., scuffed running shoe on a doormat, city apartment, looks worn"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                />
            </div>

            <div>
                <label htmlFor="controls" className="block text-sm font-medium text-gray-300">
                    Generation Controls (optional JSON)
                </label>
                <textarea
                    id="controls"
                    rows={8}
                    className="mt-1 block w-full bg-brand-muted border border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm font-mono text-brand-text placeholder-gray-500"
                    value={controls}
                    onChange={(e) => setControls(e.target.value)}
                />
            </div>

            <button
                type="button"
                onClick={handleSubmit}
                disabled={isLoading}
                className="w-full inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-brand-bg bg-brand-accent hover:bg-white/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-brand-bg focus:ring-white disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
            >
                {isLoading ? 'Generating...' : 'Generate Monologue'}
                {!isLoading && <span className="ml-2"><SparklesIcon/></span>}
            </button>
        </div>
    );
};

export default InputPanel;
