import type { LLMMessage, LLMResponse, ProviderError } from '@/types/provider';
import { classifyProviderError, logProviderRequest } from '@/utils/providerError';

export interface LLMProvider {
  name: string;
  chat(messages: LLMMessage[], options?: { temperature?: number }): Promise<LLMResponse>;
}

export async function createSiliconFlowProvider(): Promise<LLMProvider> {
  const apiKey = process.env.SILICONFLOW_API_KEY;
  const baseUrl = process.env.SILICONFLOW_BASE_URL || 'https://api.siliconflow.cn/v1';
  const model = process.env.SILICONFLOW_MODEL || 'Pro/zai-org/GLM-4.7';

  if (!apiKey) {
    throw new Error('SILICONFLOW_API_KEY is not configured');
  }

  return {
    name: 'siliconflow',

    async chat(
      messages: LLMMessage[],
      options: { temperature?: number } = {}
    ): Promise<LLMResponse> {
      const startTime = Date.now();
      logProviderRequest('chat', 'siliconflow', 'start');

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
            stream: false,
          }),
        });

        const duration = Date.now() - startTime;

        if (!response.ok) {
          const errorBody = await response.text().catch(() => 'Unknown error');
          const error = new Error(`SiliconFlow API error: ${response.status} ${response.statusText} - ${errorBody}`) as Error & { status?: number };
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
            finish_reason: string;
          }>;
          usage: {
            prompt_tokens: number;
            completion_tokens: number;
            total_tokens: number;
            completion_tokens_details?: { reasoning_tokens?: number };
            prompt_tokens_details?: { cached_tokens?: number };
          };
        };

        const firstChoice = data.choices[0];

        logProviderRequest('chat', 'siliconflow', 'end', {
          duration,
          status: response.status,
        });

        return {
          content: firstChoice.message.content,
          reasoning: firstChoice.message.reasoning_content,
          usage: data.usage,
          finishReason: firstChoice.finish_reason,
        };
      } catch (error) {
        const duration = Date.now() - startTime;
        const classified = classifyProviderError(error, 'LLM 请求失败');
        logProviderRequest('chat', 'siliconflow', 'error', {
          duration,
          errorCode: classified.code,
        });
        throw classified;
      }
    },
  };
}

export type { LLMMessage, LLMResponse, ProviderError };
