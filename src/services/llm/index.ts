import type { LLMProvider } from './deepseek';
import { createDeepSeekProvider } from './deepseek';
import { createSiliconFlowProvider } from './siliconflow';

export type LLMProviderType = 'deepseek' | 'siliconflow';

export interface CreateProviderOptions {
  provider?: LLMProviderType;
  fallbackOnError?: boolean;
}

let cachedProvider: LLMProvider | null = null;
let cachedProviderType: LLMProviderType | null = null;

export async function createLLMProvider(
  options: CreateProviderOptions = {}
): Promise<LLMProvider> {
  const providerType = options.provider || 
    (process.env.DEFAULT_LLM_PROVIDER as LLMProviderType) || 
    'deepseek';

  // 使用缓存的 provider（如果类型相同）
  if (cachedProvider && cachedProviderType === providerType) {
    return cachedProvider;
  }

  let provider: LLMProvider;

  try {
    switch (providerType) {
      case 'deepseek':
        provider = await createDeepSeekProvider();
        break;
      case 'siliconflow':
        provider = await createSiliconFlowProvider();
        break;
      default:
        throw new Error(`Unsupported LLM provider: ${providerType}`);
    }

    cachedProvider = provider;
    cachedProviderType = providerType;

    return provider;
  } catch (error) {
    console.error(`[LLM Provider] Failed to create ${providerType} provider:`, error);
    
    // 如果启用了回退策略，尝试另一个 provider
    if (options.fallbackOnError) {
      const fallbackType: LLMProviderType = providerType === 'deepseek' ? 'siliconflow' : 'deepseek';
      console.warn(`[LLM Provider] Falling back to ${fallbackType}`);
      
      try {
        provider = fallbackType === 'deepseek' 
          ? await createDeepSeekProvider() 
          : await createSiliconFlowProvider();
        
        cachedProvider = provider;
        cachedProviderType = fallbackType;
        
        return provider;
      } catch (fallbackError) {
        console.error(`[LLM Provider] Failed to create fallback ${fallbackType} provider:`, fallbackError);
        throw fallbackError;
      }
    }

    throw error;
  }
}

export async function getLLMProviderName(): Promise<string> {
  const provider = await createLLMProvider();
  return provider.name;
}

export type { LLMProvider };
