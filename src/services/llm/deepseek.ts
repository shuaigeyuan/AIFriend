import type { LLMMessage, LLMResponse, ProviderError } from '@/types/provider';
import { classifyProviderError, logProviderRequest } from '@/utils/providerError';

export interface LLMProvider {
  name: string;
  chat(messages: LLMMessage[], options?: { temperature?: number; thinking?: boolean }): Promise<LLMResponse>;
}

export async function createDeepSeekProvider(): Promise<LLMProvider> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  const baseUrl = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com';
  const model = process.env.DEEPSEEK_MODEL || 'deepseek-v4-pro';

  if (!apiKey) {
    throw new Error('DEEPSEEK_API_KEY is not configured');
  }

  return {
    name: 'deepseek',

    async chat(
      messages: LLMMessage[],
      options: { temperature?: number; thinking?: boolean } = {}
    ): Promise<LLMResponse> {
      const startTime = Date.now();
      logProviderRequest('chat', 'deepseek', 'start');

      try {
        const response = await fetch(`${baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model,
            messages,
            temperature: options.temperature ?? 0.8,
            thinking: options.thinking !== false ? { type: 'enabled' } : undefined,
            reasoning_effort: 'high',
            stream: false,
          }),
        });

        const duration = Date.now() - startTime;

        if (!response.ok) {
          const errorBody = await response.text().catch(() => 'Unknown error');
          const error = new Error(`DeepSeek API error: ${response.status} ${response.statusText} - ${errorBody}`) as Error & { status?: number };
          error.status = response.status;
          throw error;
        }

        const data = await response.json() as {
          id: string;
          object: string;
          created: number;
          model: string;
          choices: Array<{
            index: number;
            message: {
              role: string;
              content: string;
              reasoning_content?: string;
            };
            logprobs: null;
            finish_reason: string;
          }>;
          usage: {
            prompt_tokens: number;
            completion_tokens: number;
            total_tokens: number;
            prompt_tokens_details?: { cached_tokens?: number };
            completion_tokens_details?: { reasoning_tokens?: number };
            prompt_cache_hit_tokens?: number;
            prompt_cache_miss_tokens?: number;
          };
          system_fingerprint?: string;
        };

        const firstChoice = data.choices[0];

        logProviderRequest('chat', 'deepseek', 'end', {
          duration,
          status: response.status,
        });

        return {
          content: firstChoice.message.content,
          reasoning: firstChoice.message.reasoning_content,
          usage: {
            prompt_tokens: data.usage.prompt_tokens,
            completion_tokens: data.usage.completion_tokens,
            total_tokens: data.usage.total_tokens,
            completion_tokens_details: data.usage.completion_tokens_details,
            prompt_tokens_details: data.usage.prompt_tokens_details,
          },
          finishReason: firstChoice.finish_reason,
        };
      } catch (error) {
        const duration = Date.now() - startTime;
        const classified = classifyProviderError(error, 'DeepSeek LLM 请求失败');
        logProviderRequest('chat', 'deepseek', 'error', {
          duration,
          errorCode: classified.code,
        });
        throw classified;
      }
    },
  };
}

export type { LLMMessage, LLMResponse, ProviderError };
