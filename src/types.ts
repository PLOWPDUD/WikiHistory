
export type ArticleType = 'country' | 'war' | 'event' | 'person' | 'culture';

export interface InfoboxItem {
  label: string;
  value: string;
}

export interface SectionImage {
  url: string;
  caption?: string;
}

export interface Section {
  title: string;
  content: string; // Markdown supported
  images?: SectionImage[];
  // Deprecated: kept for backward compatibility if needed, but we'll migrate to 'images'
  imageUrl?: string;
  imageCaption?: string;
}

export interface Article {
  id: string;
  title: string;
  summary: string;
  type: ArticleType;
  infobox: InfoboxItem[];
  sections: Section[];
  flagUrl?: string; // Main image (usually flag)
  flags?: string[]; // Up to 3 flags
  coatsOfArms?: string[]; // Up to 2 coats of arms
  createdAt: any; 
  authorId: string;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  photoURL?: string;
}
