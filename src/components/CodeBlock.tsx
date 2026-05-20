import { useState } from 'react';
import { Check, Copy, ChevronDown, ChevronUp } from 'lucide-react';

interface CodeBlockProps {
  code: string;
}

export default function CodeBlock({ code }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(true);

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="group relative bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden my-6">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-zinc-900/50 border-b border-zinc-800">
        <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Code</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded-md transition-all flex items-center gap-1.5 text-[10px] font-mono"
          >
            {isCollapsed ? (
              <>
                <ChevronDown className="w-3 h-3" />
                Expand
              </>
            ) : (
              <>
                <ChevronUp className="w-3 h-3" />
                Collapse
              </>
            )}
          </button>
          <button
            onClick={copyToClipboard}
            className="p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded-md transition-all"
            title="Copy to clipboard"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Code Area */}
      <div 
        className={`relative transition-all duration-300 ease-in-out ${isCollapsed ? 'max-h-32 overflow-hidden' : 'max-h-[1000px] overflow-auto'}`}
      >
        <pre className="p-4 text-sm text-zinc-300 font-mono leading-relaxed overflow-x-auto">
          <code>{code}</code>
        </pre>
        
        {isCollapsed && (
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-zinc-950 to-transparent pointer-events-none" />
        )}
      </div>
    </div>
  );
}
