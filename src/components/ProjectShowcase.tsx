import { Project } from '../types.ts';
import { projects } from '../data.ts';
import { Flame, Compass, Sparkles, Plus, ExternalLink } from 'lucide-react';

export default function ProjectShowcase() {
  return (
    <div id="projects-showcase-container" className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-3 border-b border-zinc-800 pb-4">
        <div>
          <span className="text-[10px] sm:text-xs font-mono text-orange-500 uppercase tracking-widest block mb-1">
            🍳 Current Stove Status
          </span>
          <h2 className="text-xl sm:text-2xl font-display font-semibold text-zinc-100">
            What's Cooking
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-zinc-500 font-sans max-w-sm md:text-right">
          A tidy list of experiments, side ventures, and actual utilities currently boiling on the stove.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {projects.map((project) => (
          <div
            key={project.id}
            className="group relative bg-zinc-950 border border-zinc-900 rounded-xl p-5 hover:border-orange-600/30 transition-all duration-300 md:hover:-translate-y-1 hover:shadow-2xl hover:shadow-orange-900/5 flex flex-col justify-between"
          >
            {/* Top Bar inside Card */}
            <div>
              <div className="flex justify-between items-center mb-4">
                {/* Tech tag or project category */}
                <div className="flex items-center gap-1.5 font-mono text-[10px] text-zinc-500">
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-700 group-hover:bg-orange-500 transition-colors"></span>
                  <span>{project.tech[0]}</span>
                </div>

                {/* Flame / Compass / Sparkle indicators based on boiling level */}
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium font-mono ${
                  project.status === 'Baked' 
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-505/20' 
                    : project.status === 'Boiling'
                    ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                    : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                }`}>
                  {project.status === 'Baked' && <Sparkles className="w-2.5 h-2.5" />}
                  {project.status === 'Boiling' && <Flame className="w-2.5 h-2.5 animate-pulse" />}
                  {project.status === 'Simmering' && <Compass className="w-2.5 h-2.5" />}
                  <span>{project.statusLabel}</span>
                </span>
              </div>

              {/* Title & Desc */}
              <h3 className="text-lg font-display text-zinc-100 font-bold group-hover:text-orange-500 transition-colors flex items-center gap-1">
                <span>{project.title}</span>
                {project.link !== '#' && (
                  <ExternalLink className="w-3.5 h-3.5 text-zinc-600 group-hover:text-orange-400 transition-colors" />
                )}
              </h3>
              
              <p className="text-sm text-zinc-400 mt-2.5 font-sans leading-relaxed">
                {project.description}
              </p>
            </div>

            {/* Tech tags and footer */}
            <div className="mt-6 pt-4 border-t border-zinc-900/60">
              <div className="flex flex-wrap gap-1.5">
                {project.tech.map((t) => (
                  <span
                    key={t}
                    className="text-[9px] font-mono text-zinc-600 bg-zinc-900/40 px-1.5 py-0.5 rounded border border-zinc-800/10 group-hover:border-zinc-800/60 group-hover:text-zinc-500 transition-colors"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
