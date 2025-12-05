import React from 'react';

const KEYWORDS = new Set([
  'const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'import', 'from', 'export', 'default',
  '#include', 'int', 'char', 'void', 'struct', 'typedef', 'printf', 'scanf', 'malloc', 'free', 'strcpy', 'strlen', 'memcpy', 'sizeof',
  'def', 'class', 'lambda', 'True', 'False', 'None', 'and', 'or', 'not', 'in', 'is', 'async', 'await', 'new', 'this', 'try', 'catch', 'finally', 'public', 'private', 'protected', 'static'
]);

const OPERATORS = /[=+\-*\/\%<>!&|~^?:.]+/;

const highlightChunk = (chunk: string, keyPrefix: string): (React.ReactNode | null)[] => {
  const parts = chunk.split(/(\s+|[(),;.{}[\]=+\-*\/\%<>!&|~^?:.]+)/); // Split by whitespace and punctuation, keeping them
  return parts.map((part, index) => {
    const key = `${keyPrefix}-${index}`;
    if (!part) return null;

    if (KEYWORDS.has(part)) {
      return <span key={key} className="token-keyword">{part}</span>;
    }
    if (!isNaN(Number(part)) && part.trim() !== '') {
      return <span key={key} className="token-number">{part}</span>;
    }
    // Simple function call check: is it a word-like string followed by an opening parenthesis?
    if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(part) && parts[index + 1]?.trim() === '(') {
        return <span key={key} className="token-function">{part}</span>;
    }
    if (OPERATORS.test(part)) {
        return <span key={key} className="token-operator">{part}</span>
    }
    return <React.Fragment key={key}>{part}</React.Fragment>;
  }).filter(Boolean);
};

const highlightLine = (line: string, lineIndex: number): React.ReactNode[] => {
  // Regex to find strings (double and single quoted) and comments
  const mainRegex = /(".*?")|('.*?')|(\/\/.*)/g;
  const parts = line.split(mainRegex).filter(Boolean);

  return parts.map((part, index) => {
    const partKey = `${lineIndex}-${index}`;
    if ((part.startsWith('"') && part.endsWith('"')) || (part.startsWith("'") && part.endsWith("'"))) {
      return <span key={partKey} className="token-string">{part}</span>;
    }
    if (part.startsWith('//')) {
      return <span key={partKey} className="token-comment">{part}</span>;
    }
    // It's a code chunk, so highlight it further
    return highlightChunk(part, partKey);
  });
};

interface CodeSnippetViewerProps {
  code: string;
  className?: string;
}

const CodeSnippetViewer: React.FC<CodeSnippetViewerProps> = ({ code, className = '' }) => {
  const lines = code.split('\n');

  return (
    <pre className={`bg-surface-2 p-4 rounded text-left text-lg whitespace-pre-wrap font-mono custom-scrollbar overflow-x-auto ${className}`}>
      <code>
        {lines.map((line, index) => {
          const isPlaceholderLine = line.includes('___');
          if (isPlaceholderLine) {
            return (
              <div key={index} className="token-placeholder -mx-4 px-4">
                {line}
              </div>
            );
          }
          return (
            <div key={index}>
              {highlightLine(line, index)}
            </div>
          );
        })}
      </code>
    </pre>
  );
};

export default CodeSnippetViewer;
