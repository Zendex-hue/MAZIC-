
export type FeatureType = 'IMAGE' | 'STORY' | 'TRAVEL' | 'TRANSLATE' | 'RECIPE' | 'CHAT' | 'HOME' | 'FEATURES' | 'SUMMARY' | 'CODE';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  imageUrl?: string;
  groundingLinks?: Array<{ title: string; uri: string }>;
}
