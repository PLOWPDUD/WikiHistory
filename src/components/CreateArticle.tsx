
import { useState } from 'react';
import { ArticleType, Article } from '../types';
import { generateArticle, generateArticleImage } from '../services/geminiService';
import { Loader2, Sparkles, Wand2, Info, Image as ImageIcon, Flag, Shield } from 'lucide-react';
import Infobox from './Infobox';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { collection, addDoc, serverTimestamp, setDoc, doc } from 'firebase/firestore';
import { cn } from '../lib/utils';

interface CreateArticleProps {
  onCreated: (article: Article) => void;
  initialArticle?: Article;
}

import { resizeImage } from '../lib/imageUtils';

const COUNTRY_TEMPLATE: Partial<Article> = {
  title: '',
  summary: '',
  type: 'country',
  infobox: [
    { label: 'Capital', value: '' },
    { label: 'Largest City', value: '' },
    { label: 'Demonym', value: '' },
    { label: 'Government', value: '' },
    { label: 'Currency', value: '' },
    { label: 'Population', value: '' }
  ],
  sections: [
    { title: 'History', content: '' },
    { title: 'Geography', content: '' },
    { title: 'Government and politics', content: '' },
    { title: 'Economy', content: '' },
    { title: 'Demographics', content: '' },
    { title: 'Culture', content: '' },
  ],
  flags: [],
  coatsOfArms: []
};

const WAR_TEMPLATE: Partial<Article> = {
  title: '',
  summary: '',
  type: 'war',
  infobox: [
    { label: 'Date', value: '' },
    { label: 'Location', value: '' },
    { label: 'Result', value: '' },
    { label: 'Territorial changes', value: '' },
    { label: '!HEADER!', value: 'Belligerents' },
    { label: '!COLS!', value: 'Combatant 1 || Combatant 2' },
    { label: '!HEADER!', value: 'Commanders and leaders' },
    { label: '!COLS!', value: 'Commander 1 || Commander 2' },
    { label: '!HEADER!', value: 'Strength' },
    { label: '!COLS!', value: 'Strength 1 || Strength 2' },
    { label: '!HEADER!', value: 'Casualties and losses' },
    { label: '!COLS!', value: 'Casualties 1 || Casualties 2' }
  ],
  sections: [
    { title: 'Background', content: '' },
    { title: 'Course of the war', content: '' },
    { title: 'Aftermath', content: '' }
  ],
  flags: [],
  coatsOfArms: []
};

export default function CreateArticle({ onCreated, initialArticle }: CreateArticleProps) {
  const { user } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);
  const [shouldGenerateImage, setShouldGenerateImage] = useState(true);
  const [isManualMode, setIsManualMode] = useState(!!initialArticle);
  const [formData, setFormData] = useState({
    name: initialArticle?.title || '',
    type: (initialArticle?.type || 'country') as ArticleType,
    details: '',
    flagDetails: '',
    capitals: initialArticle?.infobox?.find(i => i.label.includes('Capital'))?.value || '',
    leaders: initialArticle?.infobox?.find(i => i.label.includes('Leader') || i.label.includes('Founder'))?.value || '',
    keyEvents: initialArticle?.infobox?.find(i => i.label === 'Existed')?.value || ''
  });
  const [manualData, setManualData] = useState<Partial<Article>>(initialArticle || COUNTRY_TEMPLATE);
  const [preview, setPreview] = useState<Partial<Article> | null>(initialArticle || null);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleAdvancedFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>, 
    target: 'flag' | 'arms' | 'section', 
    index?: number,
    subIndex?: number
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const base64String = await resizeImage(file, 800, 800);
      setManualData(p => {
        const next = { ...p };
        if (target === 'flag' && typeof index === 'number') {
          const newFlags = [...(p.flags || [])];
          newFlags[index] = base64String;
          next.flags = newFlags;
          if (index === 0) next.flagUrl = base64String;
        } else if (target === 'arms' && typeof index === 'number') {
          const newArms = [...(p.coatsOfArms || [])];
          newArms[index] = base64String;
          next.coatsOfArms = newArms;
        } else if (target === 'section' && typeof index === 'number') {
          const newSecs = [...(p.sections || [])];
          const section = { ...newSecs[index] };
          const images = [...(section.images || [])];
          
          if (typeof subIndex === 'number') {
            images[subIndex] = { ...images[subIndex], url: base64String };
          } else {
            images.push({ url: base64String });
          }
          
          section.images = images;
          // Sync with legacy for now if it's the first image
          if (images.length > 0) {
            section.imageUrl = images[0].url;
            section.imageCaption = images[0].caption;
          }
          
          newSecs[index] = section;
          next.sections = newSecs;
        }
        return next;
      });
    } catch (err) {
      console.error("Image upload failed", err);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const base64String = await resizeImage(file, 800, 800);
        if (isManualMode) {
          setManualData(p => ({ ...p, flagUrl: base64String }));
        } else {
          setPreview(p => p ? { ...p, flagUrl: base64String } : { title: formData.name, flagUrl: base64String });
        }
      } catch (err) {
        console.error("Image upload failed", err);
      }
    }
  };

  const removeImage = (target: 'flag' | 'arms' | 'section', index?: number, subIndex?: number) => {
    setManualData(p => {
      const next = { ...p };
      if (target === 'flag' && typeof index === 'number') {
        const newFlags = [...(p.flags || [])];
        newFlags[index] = '';
        next.flags = newFlags;
        if (index === 0) {
          next.flagUrl = newFlags[0] || newFlags[1] || newFlags[2] || undefined;
        }
      } else if (target === 'arms' && typeof index === 'number') {
        const newArms = [...(p.coatsOfArms || [])];
        newArms[index] = '';
        next.coatsOfArms = newArms;
      } else if (target === 'section' && typeof index === 'number') {
        const newSecs = [...(p.sections || [])];
        if (newSecs[index]) {
          const section = { ...newSecs[index] };
          if (typeof subIndex === 'number') {
            const images = section.images?.filter((_, i) => i !== subIndex) || [];
            section.images = images;
            section.imageUrl = images[0]?.url;
            section.imageCaption = images[0]?.caption;
          } else {
            section.images = [];
            section.imageUrl = undefined;
            section.imageCaption = undefined;
          }
          newSecs[index] = section;
        }
        next.sections = newSecs;
      } else if (target === 'flag' && typeof index === 'undefined') {
        next.flagUrl = undefined;
      }
      return next;
    });
  };

  const addManualSection = () => {
    setManualData(p => ({
      ...p,
      sections: [...(p.sections || []), { title: 'New Section', content: '' }]
    }));
  };

  const addInfoboxRow = () => {
    setManualData(p => ({
      ...p,
      infobox: [...(p.infobox || []), { label: '', value: '' }]
    }));
  };

  const applyTemplate = (type: ArticleType) => {
    if (type === 'country') {
      setManualData(p => ({
        ...p,
        ...COUNTRY_TEMPLATE,
        title: p.title || '',
        summary: p.summary || ''
      }));
    } else if (type === 'war') {
      setManualData(p => ({
        ...p,
        ...WAR_TEMPLATE,
        title: p.title || '',
        summary: p.summary || ''
      }));
    }
  };

  const handleGenerate = async () => {
    if (!formData.name) {
      setErrorMsg('At least a name is required');
      return;
    }
    setErrorMsg('');
    setIsGenerating(true);
    try {
      const [articleData, flagUrl] = await Promise.all([
        generateArticle(
          formData.details,
          formData.type,
          {
            name: formData.name,
            flagDetails: formData.flagDetails,
            capitals: formData.capitals,
            leaders: formData.leaders,
            keyEvents: formData.keyEvents
          }
        ),
        shouldGenerateImage 
          ? generateArticleImage(formData.flagDetails || formData.name).then(res => res ? resizeImage(res, 800, 800) : undefined)
          : Promise.resolve(undefined)
      ]);
      
      setPreview({ ...articleData, flagUrl, type: formData.type });
      setManualData({ ...articleData, flagUrl, type: formData.type });
    } catch (err) {
      console.error(err);
      setErrorMsg('Generation failed. Please check your AI Studio settings.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async (isFromManual: boolean = false) => {
    const dataToSave = isFromManual ? manualData : preview;
    if (!dataToSave || !user) return;
    
    const path = 'articles';
    setLoading(true);
    try {
      const payload: any = {
        title: dataToSave.title || 'Untitled',
        summary: dataToSave.summary || '',
        type: dataToSave.type || formData.type || 'country',
        infobox: dataToSave.infobox || [],
        sections: dataToSave.sections || [],
        flagUrl: dataToSave.flagUrl || null,
        flags: dataToSave.flags || [],
        coatsOfArms: dataToSave.coatsOfArms || [],
        authorId: user.uid,
      };

      if (initialArticle?.id) {
        // Update mode
        payload.createdAt = initialArticle.createdAt;
        payload.updatedAt = serverTimestamp();
        await setDoc(doc(db, path, initialArticle.id), payload);
        onCreated({ id: initialArticle.id, ...payload } as Article);
      } else {
        // Create mode
        payload.createdAt = serverTimestamp();
        const docRef = await addDoc(collection(db, path), payload);
        onCreated({ id: docRef.id, ...payload } as Article);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center gap-2 mb-8">
        <div className="w-10 h-10 bg-[#3366cc] rounded-sm flex items-center justify-center">
          <Sparkles className="text-white w-6 h-6" />
        </div>
        <div>
          <h1 className="font-serif text-3xl text-[#202122]">Create New Entry</h1>
          <p className="text-sm text-[#54595d]">Describe your alternate history idea and our AI will build the Wiki page.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="space-y-6">
          <div className="flex gap-1 p-1 bg-[#eaecf0] rounded-sm mb-4">
            <button 
              onClick={() => setIsManualMode(false)}
              className={cn(
                "flex-1 py-1.5 text-xs font-bold rounded-sm transition-all",
                !isManualMode ? "bg-white shadow-sm text-[#3366cc]" : "text-[#54595d] hover:bg-white/50"
              )}
            >
              AI Draft (Wizard)
            </button>
            <button 
              onClick={() => {
                setIsManualMode(true);
                if (!manualData.title) setManualData(p => ({ ...p, title: formData.name }));
              }}
              className={cn(
                "flex-1 py-1.5 text-xs font-bold rounded-sm transition-all",
                isManualMode ? "bg-white shadow-sm text-[#3366cc]" : "text-[#54595d] hover:bg-white/50"
              )}
            >
              Manual Editor
            </button>
          </div>

          <div className="space-y-4 bg-white p-6 border border-[#a2a9b1] rounded-sm shadow-sm">
            {!isManualMode ? (
              <>
                <div>
                  <label className="block text-sm font-bold text-[#202122] mb-1">Subject Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                    placeholder="e.g. The Second Roman Empire, Galactic War III"
                    className="w-full border border-[#a2a9b1] px-3 py-2 text-sm rounded-sm focus:border-[#3366cc] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-[#202122] mb-1">Type</label>
                  <select
                    value={formData.type}
                    onChange={e => {
                      const type = e.target.value as ArticleType;
                      setFormData(p => ({ ...p, type }));
                      setManualData(p => ({ ...p, type }));
                    }}
                    className="w-full border border-[#a2a9b1] px-3 py-2 text-sm rounded-sm focus:border-[#3366cc] outline-none"
                  >
                    <option value="country">Country / Civilization</option>
                    <option value="war">War / Conflict</option>
                    <option value="event">Historical Event</option>
                    <option value="person">Significant Figure</option>
                    <option value="culture">Culture / Ideology</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-[#202122] mb-1">Core Description</label>
                  <textarea
                    value={formData.details}
                    onChange={e => setFormData(p => ({ ...p, details: e.target.value }))}
                    placeholder="What is this about? Give some broad strokes..."
                    rows={4}
                    className="w-full border border-[#a2a9b1] px-3 py-2 text-sm rounded-sm focus:border-[#3366cc] outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-[#202122] mb-1">Capital(s) / Seat</label>
                    <input
                      type="text"
                      value={formData.capitals}
                      onChange={e => setFormData(p => ({ ...p, capitals: e.target.value }))}
                      className="w-full border border-[#a2a9b1] px-3 py-2 text-sm rounded-sm focus:border-[#3366cc] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-[#202122] mb-1">Founders / Leaders</label>
                    <input
                      type="text"
                      value={formData.leaders}
                      onChange={e => setFormData(p => ({ ...p, leaders: e.target.value }))}
                      className="w-full border border-[#a2a9b1] px-3 py-2 text-sm rounded-sm focus:border-[#3366cc] outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-[#202122] mb-1">Starts (Year)</label>
                    <input
                      type="text"
                      placeholder="e.g. 1776"
                      value={formData.keyEvents.split(';').find(s => s.trim().startsWith('START:'))?.split(':')[1] || ''}
                      onChange={e => {
                        const val = e.target.value;
                        setFormData(p => {
                          const parts = p.keyEvents.split(';').map(s => s.trim()).filter(s => !s.startsWith('START:'));
                          return { ...p, keyEvents: [...parts, `START:${val}`].join('; ') };
                        });
                      }}
                      className="w-full border border-[#a2a9b1] px-3 py-2 text-sm rounded-sm focus:border-[#3366cc] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-[#202122] mb-1">Ends (Year)</label>
                    <input
                      type="text"
                      placeholder="e.g. 1945 or Present"
                      value={formData.keyEvents.split(';').find(s => s.trim().startsWith('END:'))?.split(':')[1] || ''}
                      onChange={e => {
                        const val = e.target.value;
                        setFormData(p => {
                          const parts = p.keyEvents.split(';').map(s => s.trim()).filter(s => !s.startsWith('END:'));
                          return { ...p, keyEvents: [...parts, `END:${val}`].join('; ') };
                        });
                      }}
                      className="w-full border border-[#a2a9b1] px-3 py-2 text-sm rounded-sm focus:border-[#3366cc] outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-[#202122] mb-1 text-[11px] uppercase tracking-wider opacity-60">Flag / Icon Description</label>
                  <textarea
                    value={formData.flagDetails}
                    onChange={e => setFormData(p => ({ ...p, flagDetails: e.target.value }))}
                    placeholder="e.g. A black eagle on a red field with golden borders..."
                    className="w-full border border-[#a2a9b1] px-3 py-2 text-sm rounded-sm focus:border-[#3366cc] outline-none"
                    rows={2}
                  />
                  <div className="flex flex-col gap-2 mt-2">
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input 
                        type="checkbox" 
                        checked={shouldGenerateImage}
                        onChange={e => setShouldGenerateImage(e.target.checked)}
                        className="w-4 h-4 rounded border-[#a2a9b1] text-[#3366cc] focus:ring-[#3366cc]" 
                      />
                      <span className="text-xs text-[#54595d] group-hover:text-[#202122] transition-colors flex items-center gap-1">
                        <ImageIcon className="w-3 h-3" />
                        Generate AI flag illustration
                      </span>
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase font-bold text-[#a2a9b1]">OR</span>
                      <label className="text-xs text-[#3366cc] hover:underline cursor-pointer flex items-center gap-1">
                        <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                        Upload custom image
                      </label>
                    </div>
                  </div>
                </div>

                {errorMsg && (
                  <div className="bg-[#fee7e6] border border-[#d33] text-[#d33] p-3 rounded-sm text-sm font-bold">
                    {errorMsg}
                  </div>
                )}

                <button
                  onClick={handleGenerate}
                  disabled={isGenerating || !formData.name}
                  className="w-full bg-[#f8f9fa] border border-[#a2a9b1] py-3 rounded-sm font-bold text-[#202122] hover:bg-[#eaecf0] disabled:opacity-50 flex items-center justify-center gap-2 transition-colors group"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Rewriting History...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-5 h-5 group-hover:text-[#3366cc]" />
                      Generate Draft
                    </>
                  )}
                </button>
              </>
            ) : (
              <div className="space-y-6">
                <div className="bg-[#f8f9fa] border border-[#a2a9b1] p-1 mb-4 flex items-center gap-1 overflow-x-auto">
                  <div className="flex items-center border-r border-[#a2a9b1] pr-1 mr-1">
                    <button className="px-2 py-1 text-xs font-bold hover:bg-[#eaecf0] border border-transparent hover:border-[#a2a9b1]">B</button>
                    <button className="px-2 py-1 text-xs italic hover:bg-[#eaecf0] border border-transparent hover:border-[#a2a9b1]">I</button>
                    <button className="px-2 py-1 text-xs hover:bg-[#eaecf0] border border-transparent hover:border-[#a2a9b1] text-[#3366cc] underline">Link</button>
                  </div>
                  <div className="flex items-center gap-1">
                    <button type="button" onClick={addManualSection} className="px-2 py-1 text-[10px] uppercase font-bold hover:bg-[#eaecf0] border border-transparent hover:border-[#a2a9b1] text-[#202122]">Add Section</button>
                    <button type="button" onClick={addInfoboxRow} className="px-2 py-1 text-[10px] uppercase font-bold hover:bg-[#eaecf0] border border-transparent hover:border-[#a2a9b1] text-[#202122]">Add Info Row</button>
                    <button type="button" onClick={() => setManualData(p => ({ ...p, infobox: [...(p.infobox || []), { label: '!HEADER!', value: 'Header Text' }] }))} className="px-2 py-1 text-[10px] uppercase font-bold hover:bg-[#eaecf0] border border-transparent hover:border-[#a2a9b1] text-[#202122]">Add Header</button>
                    <button type="button" onClick={() => setManualData(p => ({ ...p, infobox: [...(p.infobox || []), { label: '!COLS!', value: 'Column 1 || Column 2' }] }))} className="px-2 py-1 text-[10px] uppercase font-bold hover:bg-[#eaecf0] border border-transparent hover:border-[#a2a9b1] text-[#202122]">Add Columns</button>
                    <div className="border-l border-[#a2a9b1] h-4 mx-1"></div>
                    <button type="button" onClick={() => applyTemplate('country')} className="px-2 py-1 text-[10px] uppercase font-bold hover:bg-[#eaecf0] border border-transparent hover:border-[#a2a9b1] text-[#3366cc]">Country Template</button>
                    <button type="button" onClick={() => applyTemplate('war')} className="px-2 py-1 text-[10px] uppercase font-bold hover:bg-[#eaecf0] border border-transparent hover:border-[#a2a9b1] text-[#3366cc]">War Template</button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold text-[#54595d] uppercase mb-1">Page Title</label>
                    <input
                      type="text"
                      value={manualData.title}
                      onChange={e => setManualData(p => ({ ...p, title: e.target.value }))}
                      className="w-full border border-[#a2a9b1] px-3 py-2 text-xl font-serif bg-white rounded-sm focus:border-[#3366cc] outline-none mb-4"
                      placeholder="Article title..."
                    />
                    
                    <label className="block text-[11px] font-bold text-[#54595d] uppercase mb-1">Article Type</label>
                    <select
                      value={manualData.type}
                      onChange={e => setManualData(p => ({ ...p, type: e.target.value as ArticleType }))}
                      className="w-full border border-[#a2a9b1] px-3 py-2 text-sm bg-white rounded-sm focus:border-[#3366cc] outline-none"
                    >
                      <option value="country">Country / Civilization</option>
                      <option value="war">War / Conflict</option>
                      <option value="event">Historical Event</option>
                      <option value="person">Significant Figure</option>
                      <option value="culture">Culture / Ideology</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-[#54595d] uppercase mb-1">Start Year</label>
                      <input
                        type="text"
                        placeholder="e.g. 1453"
                        onChange={e => {
                          const val = e.target.value;
                          setManualData(p => {
                            const newInfo = [...(p.infobox || [])];
                            const labelStr = p.type === 'war' ? 'Date' : 'Existed';
                            let existing = newInfo.find(i => i.label === labelStr);
                            if (!existing) {
                              existing = { label: labelStr, value: '' };
                              newInfo.unshift(existing);
                            }
                            existing.value = `${val} – ${existing.value.split(' – ')[1] || 'Present'}`;
                            return { ...p, infobox: newInfo };
                          });
                        }}
                        className="w-full border border-[#a2a9b1] px-3 py-2 text-sm bg-white rounded-sm focus:border-[#3366cc] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#54595d] uppercase mb-1">End Year</label>
                      <input
                        type="text"
                        placeholder="Present"
                        onChange={e => {
                          const val = e.target.value;
                          setManualData(p => {
                            const newInfo = [...(p.infobox || [])];
                            const labelStr = p.type === 'war' ? 'Date' : 'Existed';
                            let existing = newInfo.find(i => i.label === labelStr);
                            if (!existing) {
                              existing = { label: labelStr, value: '' };
                              newInfo.unshift(existing);
                            }
                            existing.value = `${existing.value.split(' – ')[0] || '?'} – ${val || 'Present'}`;
                            return { ...p, infobox: newInfo };
                          });
                        }}
                        className="w-full border border-[#a2a9b1] px-3 py-2 text-sm bg-white rounded-sm focus:border-[#3366cc] outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#54595d] uppercase mb-1">Leads / Summary</label>
                    <textarea
                      value={manualData.summary}
                      onChange={e => setManualData(p => ({ ...p, summary: e.target.value }))}
                      rows={4}
                      className="w-full border border-[#a2a9b1] px-3 py-2 text-[13px] bg-white rounded-sm focus:border-[#3366cc] outline-none font-sans leading-relaxed"
                      placeholder="Write a concise introduction paragraph..."
                    />
                  </div>

                  <div className="bg-[#f8f9fa] border border-[#a2a9b1] p-3 space-y-6">
                    {manualData.sections?.map((sec, idx) => (
                      <div key={idx} className="space-y-3 bg-white p-3 border border-[#eaecf0] rounded-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-[#54595d] px-2 bg-[#eaecf0] rounded-full">{idx + 1}</span>
                          <input 
                            placeholder="Section Title" 
                            value={sec.title}
                            onChange={e => {
                              const newSecs = [...(manualData.sections || [])];
                              newSecs[idx].title = e.target.value;
                              setManualData(p => ({ ...p, sections: newSecs }));
                            }}
                            className="flex-1 border-b border-[#a2a9b1] px-1 py-1 text-sm font-bold bg-transparent outline-none focus:border-[#3366cc]"
                          />
                          <button 
                            onClick={() => {
                              const newSecs = manualData.sections?.filter((_, i) => i !== idx);
                              setManualData(p => ({ ...p, sections: newSecs }));
                            }}
                            className="text-[#d33] text-[10px] hover:underline"
                          >
                            Remove
                          </button>
                        </div>

                        <div className="flex gap-4">
                          <div className="flex-1">
                            <textarea 
                              placeholder={`Content for ${sec.title}...`}
                              value={sec.content}
                              onChange={e => {
                                const newSecs = [...(manualData.sections || [])];
                                newSecs[idx].content = e.target.value;
                                setManualData(p => ({ ...p, sections: newSecs }));
                              }}
                              className="w-full border border-[#eaecf0] p-2 text-[12px] h-32 bg-[#fcfcfc] rounded-sm outline-none focus:border-[#3366cc] font-sans"
                            />
                          </div>
                          <div className="w-48 flex flex-col gap-4">
                            <label className="text-[10px] font-bold text-[#54595d] uppercase">Section Images</label>
                            
                            <div className="space-y-3">
                              {(sec.images && sec.images.length > 0) ? sec.images.map((img, sIdx) => (
                                <div key={sIdx} className="space-y-1">
                                  <div className="aspect-square bg-[#f8f9fa] border border-[#eaecf0] flex items-center justify-center relative overflow-hidden group">
                                    <img src={img.url} className="w-full h-full object-cover" />
                                    <button
                                      onClick={(e) => { e.preventDefault(); removeImage('section', idx, sIdx); }}
                                      className="absolute top-1 right-1 bg-white border border-[#a2a9b1] text-[#d33] rounded-sm w-4 h-4 flex items-center justify-center z-10 hover:bg-[#eaecf0]"
                                      title="Remove image"
                                    >
                                      &times;
                                    </button>
                                  </div>
                                  <input 
                                    placeholder="Caption..." 
                                    value={img.caption || ''}
                                    onChange={e => {
                                      const newSecs = [...(manualData.sections || [])];
                                      const images = [...(newSecs[idx].images || [])];
                                      images[sIdx].caption = e.target.value;
                                      newSecs[idx] = { ...newSecs[idx], images };
                                      setManualData(p => ({ ...p, sections: newSecs }));
                                    }}
                                    className="w-full text-[10px] border border-[#eaecf0] px-1 py-0.5 outline-none focus:border-[#3366cc] bg-white"
                                  />
                                </div>
                              )) : (
                                <div className="text-[10px] text-[#a2a9b1] italic border border-dashed border-[#eaecf0] p-4 text-center">
                                  No images added
                                </div>
                              )}
                              
                              <label className="flex items-center justify-center gap-2 border border-[#a2a9b1] border-dashed p-3 hover:bg-[#f8f9fa] cursor-pointer transition-colors text-[#3366cc]">
                                <ImageIcon className="w-4 h-4" />
                                <span className="text-[10px] font-bold uppercase tracking-wider">Add Image</span>
                                <input 
                                  type="file" 
                                  className="hidden" 
                                  accept="image/*"
                                  onChange={(e) => handleAdvancedFileUpload(e, 'section', idx)}
                                />
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="bg-white border border-[#a2a9b1] p-4 rounded-sm space-y-6">
                    <div>
                      {manualData.type === 'country' ? (
                        <>
                          <label className="block text-xs font-bold text-[#54595d] uppercase mb-3 underline decoration-[#3366cc]">Infobox Symbols</label>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <span className="text-[10px] font-bold text-[#54595d] uppercase opacity-60">Flags (Max 3)</span>
                              <div className="flex gap-2">
                                {[0, 1, 2].map(i => (
                                  <div key={i} className="flex-1 aspect-[3/2] bg-[#f8f9fa] border border-[#eaecf0] flex items-center justify-center relative overflow-hidden group hover:border-[#3366cc] transition-colors">
                                    {manualData.flags?.[i] ? (
                                      <>
                                        <img src={manualData.flags[i]} className="w-full h-full object-cover" />
                                        <button
                                          onClick={(e) => { e.preventDefault(); removeImage('flag', i); }}
                                          className="absolute top-1 right-1 bg-white border border-[#a2a9b1] text-[#d33] rounded-sm w-5 h-5 flex items-center justify-center z-10 hover:bg-[#eaecf0]"
                                          title="Remove flag"
                                        >
                                          &times;
                                        </button>
                                      </>
                                    ) : (
                                      <label className="w-full h-full flex items-center justify-center cursor-pointer">
                                        <Flag size={14} className="text-[#a2a9b1]" />
                                        <input 
                                          type="file" 
                                          className="hidden" 
                                          accept="image/*"
                                          onChange={(e) => handleAdvancedFileUpload(e, 'flag', i)}
                                        />
                                      </label>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="space-y-2">
                              <span className="text-[10px] font-bold text-[#54595d] uppercase opacity-60">Coats of Arms (Max 2)</span>
                              <div className="flex gap-2">
                                {[0, 1].map(i => (
                                  <div key={i} className="flex-1 aspect-square bg-[#f8f9fa] border border-[#eaecf0] flex items-center justify-center relative overflow-hidden group hover:border-[#3366cc] transition-colors">
                                    {manualData.coatsOfArms?.[i] ? (
                                      <>
                                        <img src={manualData.coatsOfArms[i]} className="w-full h-full object-cover" />
                                        <button
                                          onClick={(e) => { e.preventDefault(); removeImage('arms', i); }}
                                          className="absolute top-1 right-1 bg-white border border-[#a2a9b1] text-[#d33] rounded-sm w-5 h-5 flex items-center justify-center z-10 hover:bg-[#eaecf0]"
                                          title="Remove coat of arms"
                                        >
                                          &times;
                                        </button>
                                      </>
                                    ) : (
                                      <label className="w-full h-full flex items-center justify-center cursor-pointer">
                                        <Shield size={14} className="text-[#a2a9b1]" />
                                        <input 
                                          type="file" 
                                          className="hidden" 
                                          accept="image/*"
                                          onChange={(e) => handleAdvancedFileUpload(e, 'arms', i)}
                                        />
                                      </label>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <label className="block text-xs font-bold text-[#54595d] uppercase mb-3 underline decoration-[#3366cc]">Main Image</label>
                          <div className="w-48 aspect-square bg-[#f8f9fa] border border-[#eaecf0] flex items-center justify-center relative overflow-hidden group hover:border-[#3366cc] transition-colors">
                            {manualData.flags?.[0] ? (
                              <>
                                <img src={manualData.flags[0]} className="w-full h-full object-cover" />
                                <button
                                  onClick={(e) => { e.preventDefault(); removeImage('flag', 0); }}
                                  className="absolute top-1 right-1 bg-white border border-[#a2a9b1] text-[#d33] rounded-sm w-5 h-5 flex items-center justify-center z-10 hover:bg-[#eaecf0]"
                                  title="Remove image"
                                >
                                  &times;
                                </button>
                              </>
                            ) : (
                              <label className="w-full h-full flex flex-col gap-2 items-center justify-center cursor-pointer text-[#a2a9b1]">
                                <ImageIcon size={24} />
                                <span className="text-[10px] font-bold uppercase">Upload Image</span>
                                <input 
                                  type="file" 
                                  className="hidden" 
                                  accept="image/*"
                                  onChange={(e) => handleAdvancedFileUpload(e, 'flag', 0)}
                                />
                              </label>
                            )}
                          </div>
                        </>
                      )}
                    </div>

                    <div className="pt-4 border-t border-[#eaecf0]">
                      <label className="block text-xs font-bold text-[#54595d] uppercase mb-3">Infobox Data</label>
                      <div className="space-y-2">
                        {manualData.infobox?.map((item, idx) => (
                          <div key={idx} className="flex gap-2">
                            {item.label === '!HEADER!' || item.label === '!COLS!' ? (
                              <div className="w-1/3 flex items-center px-2 py-1.5 text-[11px] font-bold text-[#54595d] uppercase bg-[#eaecf0] rounded-sm">
                                {item.label === '!HEADER!' ? 'Header' : 'Columns'}
                              </div>
                            ) : (
                              <input 
                                placeholder="Label (e.g. Leader)" 
                                value={item.label} 
                                onChange={e => {
                                  const newInfo = [...(manualData.infobox || [])];
                                  newInfo[idx].label = e.target.value;
                                  setManualData(p => ({ ...p, infobox: newInfo }));
                                }}
                                className="w-1/3 border border-[#eaecf0] px-2 py-1.5 text-[11px] bg-[#f8f9fa] rounded-sm"
                              />
                            )}
                            <div className="flex-1 flex gap-2">
                              <input 
                                placeholder={item.label === '!HEADER!' ? "Header Text" : item.label === '!COLS!' ? "Col 1 || Col 2" : "Value"} 
                                value={item.value} 
                                onChange={e => {
                                  const newInfo = [...(manualData.infobox || [])];
                                  newInfo[idx].value = e.target.value;
                                  setManualData(p => ({ ...p, infobox: newInfo }));
                                }}
                                className="flex-1 border border-[#eaecf0] px-2 py-1.5 text-[11px] bg-white rounded-sm"
                              />
                              <button 
                                onClick={() => {
                                  const newInfo = manualData.infobox?.filter((_, i) => i !== idx);
                                  setManualData(p => ({ ...p, infobox: newInfo }));
                                }}
                                className="text-[#d33] px-2"
                              >
                                ×
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    onClick={() => handleSave(true)}
                    disabled={loading}
                    className="w-full bg-[#3366cc] text-white py-3 rounded-sm font-bold text-sm hover:bg-[#2a52a4] transition-colors shadow-md disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : initialArticle ? 'Save Changes' : 'Publish to WikiHistory'}
                  </button>
                </div>
              </div>

            )}
          </div>
        </div>

        <div>
          <div className="bg-[#f8f9fa] border border-dashed border-[#a2a9b1] rounded-sm p-8 min-h-[600px] flex flex-col">
            {(preview || (isManualMode && manualData.title)) ? (
              <div className="flex-1">
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#a2a9b1]">
                  <h3 className="font-serif text-xl font-bold flex items-center gap-2">
                    <Info className="w-4 h-4 text-[#3366cc]" />
                    Draft Preview
                  </h3>
                  {!isManualMode && (
                    <button 
                      onClick={() => handleSave(false)}
                      disabled={loading}
                      className="bg-[#3366cc] text-white px-4 py-1.5 rounded-sm text-sm font-bold hover:bg-[#2a52a4] transition-colors disabled:opacity-50"
                    >
                      {loading ? 'Saving...' : initialArticle ? 'Save Changes' : 'Post to Wiki'}
                    </button>
                  )}
                </div>
                <div className="bg-white border border-[#a2a9b1] p-6 shadow-md overflow-y-auto max-h-[800px]">
                  <Infobox article={isManualMode ? manualData : preview!} />
                  <h1 className="font-serif text-3xl mb-4">{isManualMode ? manualData.title : preview!.title}</h1>
                  <p className="text-sm font-sans mb-6">{isManualMode ? manualData.summary : preview!.summary}</p>
                  
                  {(isManualMode ? manualData : preview!).sections?.map((sec, i) => (
                    <div key={i} className="mb-6">
                      <h2 className="font-serif text-xl border-b border-[#eaecf0] mb-2">{sec.title}</h2>
                      <p className="text-sm font-sans whitespace-pre-wrap">{sec.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center opacity-40">
                <Wand2 className="w-16 h-16 mb-4" />
                <h3 className="font-serif text-2xl font-bold">Your Legend Awaits</h3>
                <p className="max-w-xs mx-auto mt-2">Fill out the form and hit generate to see your alternate history come to life in Wikipedia style.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
