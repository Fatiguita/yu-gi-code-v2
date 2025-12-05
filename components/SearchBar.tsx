
import React, { useState } from 'react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  isLoading: boolean;
  disabled?: boolean;
  placeholder?: string;
  buttonText?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch, isLoading, disabled, placeholder, buttonText }) => {
  const [query, setQuery] = useState('');
  const isDisabled = isLoading || disabled;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && !isDisabled) {
      onSearch(query.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto">
      <div className="flex items-center bg-surface-2 border-2 border-accent rounded-full shadow-lg overflow-hidden">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder || "Enter a library name (e.g., React, D3, Express)..."}
          className="w-full py-3 px-6 text-main bg-surface-2 focus:outline-none placeholder-gray-500"
          disabled={isDisabled}
        />
        <button
          type="submit"
          disabled={isDisabled}
          className="bg-primary hover:brightness-110 text-main font-bold py-3 px-4 sm:px-8 transition duration-300 ease-in-out disabled:bg-gray-600 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Summoning...' : (buttonText || 'Generate')}
        </button>
      </div>
    </form>
  );
};

export default SearchBar;