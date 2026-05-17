import type { TTSProvider } from './minimax';
import { createMinimaxProvider } from './minimax';
import { createVolcanoTTSProvider } from './volcano';

export type TTSProviderType = 'minimax' | 'volcano';

export interface CreateTTSProviderOptions {
  provider?: TTSProviderType;
  fallbackOnError?: boolean;
}

let cachedProvider: TTSProvider | null = null;
let cachedProviderType: TTSProviderType | null = null;

export async function createTTSProvider(
  options: CreateTTSProviderOptions = {}
): Promise<TTSProvider> {
  const providerType = options.provider || 
    (process.env.DEFAULT_TTS_PROVIDER as TTSProviderType) || 
    'minimax';

  if (cachedProvider && cachedProviderType === providerType) {
    return cachedProvider;
  }

  let provider: TTSProvider;

  try {
    switch (providerType) {
      case 'minimax':
        provider = await createMinimaxProvider();
        break;
      case 'volcano':
        provider = await createVolcanoTTSProvider();
        break;
      default:
        throw new Error(`Unsupported TTS provider: ${providerType}`);
    }

    cachedProvider = provider;
    cachedProviderType = providerType;

    return provider;
  } catch (error) {
    console.error(`[TTS Provider] Failed to create ${providerType} provider:`, error);
    
    if (options.fallbackOnError) {
      const fallbackType: TTSProviderType = providerType === 'minimax' ? 'volcano' : 'minimax';
      console.warn(`[TTS Provider] Falling back to ${fallbackType}`);
      
      try {
        provider = fallbackType === 'minimax' 
          ? await createMinimaxProvider() 
          : await createVolcanoTTSProvider();
        
        cachedProvider = provider;
        cachedProviderType = fallbackType;
        
        return provider;
      } catch (fallbackError) {
        console.error(`[TTS Provider] Failed to create fallback ${fallbackType} provider:`, fallbackError);
        throw fallbackError;
      }
    }

    throw error;
  }
}

export async function getTTSProviderName(): Promise<string> {
  const provider = await createTTSProvider();
  return provider.name;
}

export type { TTSProvider };
