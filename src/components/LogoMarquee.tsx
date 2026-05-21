export default function LogoMarquee() {
  const LOGOS = [
    { name: 'n8n', slug: 'n8n' },
    { name: 'Meta', slug: 'meta' },
    { name: 'Bubble', slug: 'bubble' },
    { name: 'Gemini', slug: 'googlegemini' },
    { name: 'ChatGPT', slug: 'openai' },
    { name: 'Claude', slug: 'anthropic' },
    { name: 'Make', slug: 'make' },
    { name: 'Brevo', slug: 'brevo' },
    { name: 'Cursor', slug: 'cursor' },
    { name: 'React', slug: 'react' },
    { name: 'JavaScript', slug: 'javascript' },
    { name: 'Astro', slug: 'astro' },
    { name: 'Tailwind CSS', slug: 'tailwindcss' },
    { name: 'Figma', slug: 'figma' },
    { name: 'Notion', slug: 'notion' },
    { name: 'Tally', slug: 'tally' },
    { name: 'Amazon S3', slug: 'amazons3' },
    { name: 'Apify', slug: 'apify' },
    { name: 'Airtable', slug: 'airtable' },
    { name: 'Zoho', slug: 'zoho' },
    { name: 'Firebase', slug: 'firebase' },
    { name: 'Supabase', slug: 'supabase' },
    { name: 'Vercel', slug: 'vercel' },
    { name: 'Typeform', slug: 'typeform' },
    { name: 'Loom', slug: 'loom' },
    { name: 'GitHub', slug: 'github' },
    { name: 'Apollo.io', slug: 'apollo' },
    { name: 'ElevenLabs', slug: 'elevenlabs' },
  ];

  return (
    <div className="relative w-full overflow-hidden py-12 select-none">
      {/* Gradient Overlays */}
      <div className="absolute left-0 top-0 z-10 h-full w-24 bg-gradient-to-r from-black to-transparent pointer-events-none" />
      <div className="absolute right-0 top-0 z-10 h-full w-24 bg-gradient-to-l from-black to-transparent pointer-events-none" />

      {/* Animation Container */}
      <div className="group flex w-max gap-16 animate-marquee hover:[animation-play-state:paused]">
        {/* First set of logos */}
        <div className="flex items-center gap-16">
          {LOGOS.map((logo, idx) => (
            <div
              key={`${logo.slug}-${idx}`}
              className="flex items-center gap-3 grayscale opacity-40 hover:grayscale-0 hover:opacity-100 transition-all duration-300 cursor-pointer"
            >
              <img
                src={`https://cdn.simpleicons.org/${logo.slug}/white`}
                alt={logo.name}
                className="h-5 w-auto"
                loading="lazy"
              />
              <span className="text-zinc-500 text-[10px] font-mono font-medium tracking-widest whitespace-nowrap uppercase">
                {logo.name}
              </span>
            </div>
          ))}
        </div>

        {/* Identical second set for seamless loop */}
        <div className="flex items-center gap-16" aria-hidden="true">
          {LOGOS.map((logo, idx) => (
            <div
              key={`${logo.slug}-dup-${idx}`}
              className="flex items-center gap-3 grayscale opacity-40 hover:grayscale-0 hover:opacity-100 transition-all duration-300 cursor-pointer"
            >
              <img
                src={`https://cdn.simpleicons.org/${logo.slug}/white`}
                alt={logo.name}
                className="h-5 w-auto"
                loading="lazy"
              />
              <span className="text-zinc-500 text-[10px] font-mono font-medium tracking-widest whitespace-nowrap uppercase">
                {logo.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(calc(-50% - 2rem)); }
        }
        .animate-marquee {
          animation: marquee 60s linear infinite;
        }
      `}</style>
    </div>
  );
}
