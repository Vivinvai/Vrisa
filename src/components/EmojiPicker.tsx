"use client";

import { useState, useRef, useEffect } from "react";

const emojis = [
  "😀", "😃", "😄", "😁", "😅", "😂", "🤣", "😊", "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘",
  "😗", "😙", "😚", "😋", "😛", "😝", "😜", "🤪", "🤨", "🧐", "🤓", "😎", "🤩", "🥳", "😏", "😒",
  "😞", "😔", "😟", "😕", "🙁", "😣", "😖", "😫", "😩", "🥺", "😢", "😭", "😤", "😠", "😡", "🤬",
  "🤯", "😳", "🥵", "🥶", "😱", "😨", "😰", "😥", "😓", "🤗", "🤔", "🤭", "🤫", "🤥", "😶", "😐",
  "😑", "😬", "🙄", "😯", "😦", "😧", "😮", "😲", "🥱", "😴", "🤤", "😪", "😵", "🤐", "🥴", "🤢",
  "🤮", "🤧", "😷", "🤒", "🤕", "🤑", "🤠", "👋", "🤚", "🖐", "✋", "🖖", "👌", "🤌", "🤏", "✌",
  "🤞", "🤟", "🤘", "🤙", "👈", "👉", "👆", "🖕", "👇", "☝", "👍", "👎", "✊", "👊", "🤛", "🤜",
  "👏", "🙌", "👐", "🤲", "🤝", "🙏", "💪", "❤", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎",
  "💔", "❣", "💕", "💞", "💓", "💗", "💖", "💘", "💝", "💟", "🔥", "✨", "💫", "⭐", "🌟", "💯",
  "🎉", "🎊", "🎈", "🎁", "🏆", "🥇", "🥈", "🥉", "⚽", "🏀", "🏈", "⚾", "🥎", "🎾", "🏐", "🏉",
];

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
}

export default function EmojiPicker({ onEmojiSelect }: EmojiPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'blue' | 'light'>('blue');
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem('chatTheme') as 'dark' | 'blue' | 'light';
    if (savedTheme) {
      setTheme(savedTheme);
    }
    
    const handleStorageChange = () => {
      const currentTheme = localStorage.getItem('chatTheme') as 'dark' | 'blue' | 'light';
      if (currentTheme) {
        setTheme(currentTheme);
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleEmojiClick = (emoji: string) => {
    onEmojiSelect(emoji);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={pickerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex h-10 w-10 items-center justify-center rounded-lg text-xl transition-all hover:scale-110 ${
          theme === 'light' 
            ? 'bg-blue-500 hover:bg-blue-600 border-2 border-blue-600 shadow-md' 
            : 'bg-slate-800/80 hover:bg-slate-700'
        }`}
        title="Add emoji"
      >
        😊
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className={`absolute bottom-12 right-0 z-50 w-80 rounded-xl p-3 shadow-2xl backdrop-blur-sm ${
            theme === 'light'
              ? 'border border-blue-200 bg-white'
              : 'border border-slate-700/50 bg-slate-900/95'
          }`}>
            <div className="mb-2 flex items-center justify-between">
              <span className={`text-sm font-semibold ${theme === 'light' ? 'text-black' : 'text-slate-300'}`}>Pick an emoji</span>
              <button
                onClick={() => setIsOpen(false)}
                className={theme === 'light' ? 'text-gray-700 hover:text-black' : 'text-slate-400 hover:text-white'}
              >
                ✕
              </button>
            </div>
            <div className="grid max-h-64 grid-cols-8 gap-1 overflow-y-auto">
              {emojis.map((emoji, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleEmojiClick(emoji)}
                  className={`flex h-10 w-10 items-center justify-center rounded-lg text-2xl transition-all hover:scale-125 ${
                    theme === 'light' ? 'hover:bg-blue-100' : 'hover:bg-slate-800'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
