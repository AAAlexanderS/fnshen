import { GoogleGenAI } from "@google/genai";
import { AppState, ClothingItem } from "../types";

// Helper to convert File to Base64
const fileToPart = async (file: File, mimeType: string) => {
  return new Promise<{ inlineData: { data: string; mimeType: string } }>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(',')[1];
      resolve({
        inlineData: {
          data: base64String,
          mimeType: mimeType
        }
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const generateOutfit = async (state: AppState): Promise<string> => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) throw new Error("API Key not found");

  const ai = new GoogleGenAI({ apiKey });

  // Prepare the content parts
  const parts: any[] = [];

  // Helper to add image if exists and record its index
  const addImagePart = async (file: File | null, label: string) => {
    if (file) {
      const part = await fileToPart(file, file.type);
      parts.push(part);
      return `[IMAGE_${parts.length}]`; // 1-based index for the prompt text
    }
    return "NO_IMAGE_PROVIDED";
  };

  // Helper for arrays of items
  const addImageParts = async (items: ClothingItem[]) => {
    if (items.length === 0) return "NO_IMAGE_PROVIDED";
    
    const refs = [];
    for (const item of items) {
      const part = await fileToPart(item.file, item.file.type);
      parts.push(part);
      refs.push(`[IMAGE_${parts.length}]`);
    }
    return refs.join(", ");
  };

  // 1. Profile
  const profileRef = await addImagePart(state.profilePhoto, "PROFILE_IMAGE");

  // 2. Clothing Parts (Handling arrays)
  const headRef = await addImageParts(state.wardrobe.headwear);
  const uOuterRef = await addImageParts(state.wardrobe.upperBody);
  const lOuterRef = await addImageParts(state.wardrobe.lowerBody);
  const footRef = await addImageParts(state.wardrobe.footwear);
  const accRef = await addImageParts(state.wardrobe.accessories);

  // 3. Style Reference
  const styleRefRef = await addImagePart(state.style.image, "STYLE_REF_IMAGE");

  // Construct the prompt using the specific format required
  let promptText = `
You are an AI outfit renderer for an image-try-on website.

The website will ALWAYS provide you with structured inputs from placeholders:

1) User profile & body info
- profile_photo: ${profileRef}
- body_info:
  - gender: ${state.bodyInfo.gender}
  - body_shape: ${state.bodyInfo.bodyShape}
  - notes: ${state.bodyInfo.otherNotes || "None"}

2) Clothing image placeholders (Lists of images for each slot)

- headwear: ${headRef}

- upper_body:
  - items: ${uOuterRef}

- lower_body:
  - items: ${lOuterRef}

- footwear: ${footRef}

- accessories:
  - items: ${accRef}

3) Outfit style reference
- style_reference_image: ${styleRefRef}
- style_text_prompt: "${state.style.textPrompt}"

4) Request context
- request_type: "new_generation"

------------------------------------------------------------
YOUR GOAL

Generate 1 high-quality photorealistic image of THE SAME PERSON as in profile_photo, wearing the items provided.

------------------------------------------------------------
HARD RULES

1. Identity & Body
- Preserve the user’s identity (face, hair, skin tone) from profile_photo.
- Respect body shape: ${state.bodyInfo.bodyShape}.
- Gender: ${state.bodyInfo.gender}.

2. Clothing
- Apply 'headwear' if provided.
- Apply ALL 'upper_body' items to the torso (layering them if multiple, e.g. shirt + jacket).
- Apply ALL 'lower_body' items to the legs.
- Apply 'footwear' to the feet.
- Apply 'accessories' where appropriate.
- If a slot is missing (NO_IMAGE_PROVIDED), infer a neutral basic item that matches the style to complete the outfit (e.g. if no pants provided, add simple jeans/trousers).

3. Style
- Use 'style_reference_image' and 'style_text_prompt' to determine lighting, pose, and background.
- If no style provided, default to a clean studio look.

4. Quality
- Photorealistic, no artifacts, natural lighting and shadows.
- Correct anatomical proportions.
  `;

  // Add the text prompt as the final part
  parts.push({ text: promptText });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: { parts },
    });

    // The response might contain an image or text.
    // We iterate to find the image part.
    const candidates = response.candidates;
    if (candidates && candidates.length > 0) {
      const content = candidates[0].content;
      for (const part of content.parts) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }
    
    // Fallback if no image found directly
    throw new Error("No image generated.");
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};
