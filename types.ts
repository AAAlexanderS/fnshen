export type BodyShape = 'slim' | 'average' | 'athletic' | 'plus-size';

export interface BodyInfo {
  gender: string;
  heightCm: string;
  weightKg: string;
  bodyShape: BodyShape;
  otherNotes: string;
}

export interface ClothingItem {
  id: string; // Unique ID for React keys
  file: File;
  previewUrl: string;
}

export interface Wardrobe {
  headwear: ClothingItem[];
  upperBody: ClothingItem[];
  lowerBody: ClothingItem[];
  footwear: ClothingItem[];
  accessories: ClothingItem[];
}

export interface StyleReference {
  image: File | null;
  previewUrl: string | null;
  textPrompt: string;
}

export interface AppState {
  profilePhoto: File | null;
  profilePreviewUrl: string | null;
  bodyInfo: BodyInfo;
  wardrobe: Wardrobe;
  style: StyleReference;
}

export const INITIAL_WARDROBE: Wardrobe = {
  headwear: [],
  upperBody: [],
  lowerBody: [],
  footwear: [],
  accessories: [],
};