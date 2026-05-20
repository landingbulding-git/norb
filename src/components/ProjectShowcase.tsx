import { Article } from '../types.ts';
import { Flame, Compass, Sparkles, Plus, ExternalLink, Pin, Circle, CheckCircle, PauseCircle } from 'lucide-react';

interface ProjectShowcaseProps {
  articles: Article[];
}

export default function ProjectShowcase({ articles }: ProjectShowcaseProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pinned':
        return <Pin className="w-2.5 h-2.5" />;
      case 'ongoing':
        return <Flame className="w-2.5 h-2.5 animate-pulse" />;
      case 'ended':
        return <CheckCircle className="w-2.5 h-2.5" />;
      case 'in hold':
        return <PauseCircle className="w-2.5 h-2.5" />;
      default:
        return <Circle className="w-2.5 h-2.5" />;
    }
  };

  const getStatusClasses = (status: string) => {
    switch (status) {
      case 'pinned':
        return 'bg-orange-500/10 text-orange-400 border border-orange-500/20';
      case 'ongoing':
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      case 'ended':
        return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
      case 'in hold':
        return 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20';
      default:
        return 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20';
    }
  };

  return (
    <div id="projects-showcase-container" className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-3 border-b border-zinc-800 pb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-display font-semibold text-zinc-100">
            things I'm hacking on...
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {articles.map((article) => (
          <a
            key={article.id}
            href={`/article/${article.id}`}
            className="group relative bg-zinc-950 border border-zinc-900 rounded-xl overflow-hidden hover:border-orange-600/30 transition-all duration-300 md:hover:-translate-y-1 hover:shadow-2xl hover:shadow-orange-900/5 flex flex-col cursor-pointer block"
          >
            {/* Image Cover */}
            <div className="w-full h-36 bg-zinc-900/50 border-b border-zinc-900 overflow-hidden relative flex-shrink-0">
              {article.cover ? (
                <img 
                  src={article.cover} 
                  alt={article.title} 
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-zinc-800 bg-zinc-900/20">
                  <span className="font-mono text-xs font-semibold uppercase tracking-widest">{article.title.substring(0, 2)}</span>
                </div>
              )}
              {/* Floating Status Badge */}
              <div className="absolute top-3 right-3 z-10">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded backdrop-blur-md text-[10px] font-medium font-mono shadow-sm ${getStatusClasses(article.status)}`}>
                  {getStatusIcon(article.status)}
                  <span className="capitalize">{article.status}</span>
                </span>
              </div>
            </div>

            {/* Content inside Card */}
            <div className="p-5 flex flex-col flex-grow justify-between">
              <div>
                {/* Title */}
                <h3 className="text-base font-display text-zinc-100 font-bold group-hover:text-orange-500 transition-colors flex items-center gap-1">
                  <span>{article.title}</span>
                </h3>
              </div>
              
              {/* Footer */}
              <div className="mt-4 pt-3 border-t border-zinc-900/60 flex justify-between items-center text-zinc-600 text-[10px] font-mono">
                <span>{new Date(article.created).toLocaleDateString()}</span>
                <span className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-orange-500">
                  Read <ExternalLink className="w-3 h-3" />
                </span>
              </div>
            </div>
          </a>
        ))}
        {articles.length === 0 && (
          <div className="col-span-full py-10 text-center text-zinc-500 text-sm font-mono border border-dashed border-zinc-800 rounded-xl">
            No projects in the kitchen yet.
          </div>
        )}
      </div>
    </div>
  );
}
