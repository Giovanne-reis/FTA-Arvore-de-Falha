import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import OpenAI from "openai";

export type AIProvider = 'gemini' | 'openai';

/**
 * Tracks local usage to give the user an idea of their consumption.
 */
export const getLocalUsage = () => {
  const usage = localStorage.getItem('ai_usage_count') || '0';
  return parseInt(usage, 10);
};

const incrementLocalUsage = () => {
  const current = getLocalUsage();
  localStorage.setItem('ai_usage_count', (current + 1).toString());
};

/**
 * Helper to call Gemini with a fallback mechanism.
 */
async function generateGeminiContent(params: any): Promise<GenerateContentResponse> {
  const apiKey = 
    localStorage.getItem('custom_gemini_api_key') || 
    (import.meta as any).env.VITE_GEMINI_API_KEY || 
    (typeof process !== 'undefined' ? process.env.GEMINI_API_KEY : undefined);
  
  if (!apiKey) {
    throw new Error("Chave API do Gemini não encontrada.");
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
      const isQuotaError = error?.message?.includes("429") || 
                          error?.message?.toLowerCase().includes("quota");

      if (isQuotaError && model !== models[models.length - 1]) {
        continue;
      }
      break;
    }
  }
  throw lastError;
}

/**
 * Helper to call OpenAI.
 */
async function generateOpenAIContent(prompt: string): Promise<string[]> {
  const apiKey = localStorage.getItem('custom_openai_api_key');
  
  if (!apiKey) {
    throw new Error("Chave API da OpenAI não encontrada.");
  }

  const openai = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" }
    });
    
    const content = response.choices[0].message.content || "{}";
    const parsed = JSON.parse(content);
    return parsed.suggestions || [];
  } catch (error) {
    console.error("OpenAI Error:", error);
    throw error;
  }
}

export async function getFTASuggestions(nodeLabel: string, nodeType: string, contextPath: string[] = []): Promise<string[]> {
  const provider = (localStorage.getItem('active_ai_provider') as AIProvider) || 'gemini';
  
  let contextStr = "";
  if (contextPath.length > 1) {
    contextStr = `\nContexto da hierarquia (do topo para este nó): ${contextPath.join(' -> ')}.`;
  }

  const prompt = `Analise o seguinte evento em uma Árvore de Falhas (FTA) de equipamentos: "${nodeLabel}" (Tipo: ${nodeType}).${contextStr}
  Sugira 8 causas prováveis ou sub-eventos que poderiam estar abaixo deste nó na hierarquia, considerando o contexto técnico fornecido.
  As sugestões devem ser curtas (máximo 5 palavras), técnicas e em Português.
  Retorne no formato JSON: { "suggestions": ["causa 1", "causa 2", ...] }`;

  try {
    let suggestions: string[] = [];
    
    if (provider === 'openai') {
      suggestions = await generateOpenAIContent(prompt);
    } else {
      const response = await generateGeminiContent({
        contents: prompt,
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
      suggestions = data.suggestions;
    }
    
    incrementLocalUsage();
    return suggestions;
  } catch (error) {
    console.error("Error fetching suggestions:", error);
    return [];
  }
}

export async function analyzeFullFTA(nodes: any[], edges: any[]): Promise<string> {
  const provider = (localStorage.getItem('active_ai_provider') as AIProvider) || 'gemini';
  
  // Simplify tree structure for the prompt
  const treeSummary = nodes.map(n => ({
    id: n.id,
    label: n.data.label,
    type: n.type,
    children: edges.filter(e => e.source === n.id).map(e => e.target)
  }));

  const prompt = `Você é um especialista sênior em Engenharia de Confiabilidade e Análise de Árvore de Falhas (FTA).
  Analise a seguinte estrutura de Árvore de Falhas e forneça um relatório detalhado de auditoria técnica.
  
  Estrutura da Árvore:
  ${JSON.stringify(treeSummary, null, 2)}
  
  Sua análise deve cobrir:
  1. Melhorias: Onde a árvore pode ser mais detalhada ou técnica.
  2. Inconsistências Lógicas: Portas que não fazem sentido, eventos que não se conectam logicamente.
  3. Reorganização: Sugestões de como agrupar ou separar eventos para melhor clareza.
  4. Precisão Técnica: Avalie se os termos usados são profissionais e precisos para o setor industrial/manutenção.
  
  Forneça a resposta em Markdown, formatada de forma profissional e em Português.`;

  try {
    let analysis = "";
    
    if (provider === 'openai') {
      const apiKey = localStorage.getItem('custom_openai_api_key');
      if (!apiKey) throw new Error("Chave API da OpenAI não encontrada.");
      const openai = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
      const response = await openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [{ role: "user", content: prompt }]
      });
      analysis = response.choices[0].message.content || "Não foi possível gerar a análise.";
    } else {
      const response = await generateGeminiContent({
        contents: prompt,
      });
      analysis = response.text || "Não foi possível gerar a análise.";
    }
    
    incrementLocalUsage();
    return analysis;
  } catch (error) {
    console.error("Error analyzing FTA:", error);
    throw error;
  }
}
