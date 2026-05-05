
import { motion } from 'motion/react';
import { Info, HelpCircle, Heart, Users, Newspaper } from 'lucide-react';

interface StaticPageProps {
  type: 'about' | 'community' | 'contents' | 'current-events' | 'donate';
}

const PAGE_DATA = {
  about: {
    title: 'About WikiHistory',
    icon: Info,
    content: `
      WikiHistory is a non-existent, collaborative, AI-powered multiversal encyclopedia. 
      Our mission is to archive every possible historical timeline, regardless of its reality status.
      
      ### Our Vision
      We believe that history is not a single line, but a vast garden of branching paths. 
      By leveraging advanced neural architectures, we allow users to draft and document 
      these alternate realities with professional precision.
      
      ### How it works
      When you provide a prompt, our temporal AI (Gemini) generates a consistent, 
      historically-plausible (or intentionally implausible) draft. Other users can 
      then expand, edit, or challenge these entries.
    `
  },
  community: {
    title: 'Community portal',
    icon: Users,
    content: `
      Welcome to the heart of the WikiHistory movement. Here, temporal cartographers 
      and alt-history enthusiasts coordinate their efforts.
      
      ### Ongoing Projects
      * **The Great Dark Ages Expansion**: Documenting what happened if the library of Alexandria never burned.
      * **Martian Colony Logs**: Narratives from the 1960s Space Race success.
      * **Timeline Cleaning**: Ensuring all articles maintain a neutral, encyclopedic tone.
      
      ### Stats
      * **Chrononauts**: 42,000 active users
      * **Timeline Divergences**: 1,200,432
      * **Stable Realities**: 4
    `
  },
  contents: {
    title: 'Contents',
    icon: Newspaper,
    content: `
      Explore WikiHistory through our structured categorization systems.
      
      ### Browse by Type
      * **[Countries](/civilizations)**: From the Unified American Empire to the Neo-Spartan Republic.
      * **[Military Conflicts](/wars)**: Revolutions, interplanetary skirmishes, and shadow wars.
      * **[Historical Events](/events)**: Discoveries, disasters, and diplomatic summits.
      * **[Culture & Art](/culture)**: Movements that defined imaginary generations.
      
      ### Guided Tours
      New to alternate history? Try our "Introduction to Divergence" series.
    `
  },
  'current-events': {
    title: 'Current events',
    icon: Newspaper,
    content: `
      Stay informed about the latest developments across the multiversal landscape.
      
      ### Chronological Updates
      * **May 5, 2026**: Peace treaty signed in the Martian Unification War.
      * **May 3, 2026**: First contact confirmed in the "Silent 70s" timeline.
      * **April 30, 2026**: Hyper-inflation resolves in the Weimar Republic Gold Standard reality.
      
      ### Timeline Warnings
      * **Unstable Sector 7**: High probability of contradictory edits. Proceed with caution.
    `
  },
  donate: {
    title: 'Support WikiHistory',
    icon: Heart,
    content: `
      WikiHistory is hosted by the non-profit WikiHistory Foundation. 
      We rely on donations from across all timelines to keep the AI drafting 
      and the servers humming.
      
      ### Why Donate?
      Your contribution helps us pay for the compute required to simulate 
      complex historical models and keeps our site free from ads (and reality bias).
      
      ### Ways to give
      * **Digital Currency**: Bitcoin, Ethereum, or Galactic Credits.
      * **Temporal Energy**: If available in your dimension.
      * **Kindness**: Always appreciated.
    `
  }
};

export default function StaticPage({ type }: StaticPageProps) {
  const data = PAGE_DATA[type];
  const Icon = data.icon;

  // Simple markdown-to-html converter for these static bits
  const renderContent = (text: string) => {
    return text.split('\n').map((line, i) => {
      if (line.startsWith('      ### ')) {
        return <h3 key={i} className="font-serif text-xl font-bold mt-8 mb-4 border-b border-[#eaecf0] pb-2">{line.replace('      ### ', '')}</h3>;
      }
      if (line.trim().startsWith('* ')) {
        return <li key={i} className="ml-4 mb-2">{line.trim().replace('* ', '')}</li>;
      }
      if (line.trim() === '') return <br key={i} />;
      return <p key={i} className="mb-4 leading-relaxed">{line.trim()}</p>;
    });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto px-4 py-12"
    >
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-[#f8f9fa] border border-[#a2a9b1] rounded-sm text-[#3366cc]">
          <Icon className="w-8 h-8" />
        </div>
        <h1 className="font-serif text-4xl font-bold">{data.title}</h1>
      </div>

      <div className="bg-white border border-[#a2a9b1] p-8 shadow-sm text-[#202122] font-sans">
        <div className="prose prose-blue max-w-none">
          {renderContent(data.content)}
        </div>
      </div>

      <footer className="mt-12 text-center text-xs text-[#54595d]">
        <p>This page was last edited on 5 May 2026, at 14:50 (UTC).</p>
        <p className="mt-2">Text is available under the Alternate Creative Commons License.</p>
      </footer>
    </motion.div>
  );
}
