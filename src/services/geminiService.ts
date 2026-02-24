import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";

/**
 * Helper to call Gemini with a fallback mechanism.
 * Tries a Pro model first, then falls back to Flash if quota is reached.
 */
async function generateContentWithFallback(params: any): Promise<GenerateContentResponse> {
  // Priority: 
  // 1. User provided key in localStorage (if we add that)
  // 2. VITE_GEMINI_API_KEY (for Vercel/Production)
  // 3. process.env.GEMINI_API_KEY (for AI Studio/Local)
  
  const apiKey = 
    localStorage.getItem('custom_gemini_api_key') || 
    (import.meta as any).env.VITE_GEMINI_API_KEY || 
    (typeof process !== 'undefined' ? process.env.GEMINI_API_KEY : undefined);
  
  if (!apiKey) {
    throw new Error("Chave API do Gemini não encontrada. Configure VITE_GEMINI_API_KEY no Vercel ou insira uma chave nas configurações.");
  }

  const ai = new GoogleGenAI({ apiKey });
  const models = ["gemini-3.1-pro-preview", "gemini-3-flash-preview"];
  let lastError: any;

  for (const model of models) {
    try {
      const response = await ai.models.generateContent({
        ...params,
        model: model,
      });
      return response;
    } catch (error: any) {
      lastError = error;
      const errorMessage = error?.message || "";
      
      // If the error is "Requested entity was not found", it might be an invalid key selection
      if (errorMessage.includes("Requested entity was not found")) {
        console.error("[Gemini] API Key selection error. Please re-select your key.");
      }

      const isQuotaError = errorMessage.includes("429") || 
                          errorMessage.toLowerCase().includes("quota") || 
                          errorMessage.toLowerCase().includes("limit");

      if (isQuotaError && model !== models[models.length - 1]) {
        console.warn(`[Gemini] Limite atingido para o modelo ${model}. Tentando fallback para ${models[models.indexOf(model) + 1]}...`);
        continue;
      }
      break;
    }
  }
  throw lastError;
}

export async function getFTASuggestions(nodeLabel: string, nodeType: string) {
  try {
    const response = await generateContentWithFallback({
      contents: `Analise o seguinte evento em uma Árvore de Falhas (FTA) de equipamentos: "${nodeLabel}" (Tipo: ${nodeType}). 
      Sugira 5 causas prováveis ou sub-eventos que poderiam estar abaixo deste nó na hierarquia.
      As sugestões devem ser curtas (máximo 5 palavras), técnicas e em Português.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggestions: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["suggestions"]
        }
      }
    });

    const data = JSON.parse(response.text || '{"suggestions": []}');
    return data.suggestions as string[];
  } catch (error) {
    console.error("Error fetching suggestions:", error);
    return [];
  }
}
