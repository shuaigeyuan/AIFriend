import type {
  StorageProvider,
  WeightedStorageProvider,
  MultiStorageConfig,
  UploadOptions,
  UploadResult,
  DeleteResult,
  BalancedStorageProvider,
} from '@/types/storage';

function selectProvider(
  providers: WeightedStorageProvider[],
  weights: number[]
): StorageProvider {
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  let random = Math.random() * totalWeight;

  for (let i = 0; i < providers.length; i++) {
    random -= weights[i];
    if (random <= 0) {
      return providers[i].provider;
    }
  }

  return providers[providers.length - 1].provider;
}

function updateWeightsWithFailure(
  weights: number[],
  failedIndex: number,
  decreaseAmount: number
): number[] {
  const newWeights = [...weights];
  newWeights[failedIndex] = Math.max(0.1, newWeights[failedIndex] - decreaseAmount);
  return newWeights;
}

export function createBalancedStorageProvider(
  config: MultiStorageConfig
): BalancedStorageProvider {
  const weights = config.providers.map((p) => p.weight);
  const stats = config.providers.map((p) => ({
    providerName: p.provider.name,
    requestCount: 0,
    failureCount: 0,
    lastFailure: null as number | null,
  }));

  let currentWeights = [...weights];

  return {
    name: 'balanced-storage',

    getActiveProvider(): StorageProvider {
      return selectProvider(config.providers, currentWeights);
    },

    getStats() {
      return stats.map((s, i) => ({
        ...s,
        providerName: config.providers[i].provider.name,
      }));
    },

    async upload(options: UploadOptions): Promise<UploadResult> {
      const provider = this.getActiveProvider();
      const providerIndex = config.providers.findIndex(
        (p) => p.provider.name === provider.name
      );

      stats[providerIndex].requestCount++;

      try {
        const result = await provider.upload(options);
        return result;
      } catch (error) {
        stats[providerIndex].failureCount++;
        stats[providerIndex].lastFailure = Date.now();

        currentWeights = updateWeightsWithFailure(
          currentWeights,
          providerIndex,
          0.2
        );

        for (let i = 0; i < config.providers.length; i++) {
          if (i !== providerIndex && currentWeights[i] < config.providers[i].weight) {
            currentWeights[i] = Math.min(
              config.providers[i].weight,
              currentWeights[i] + 0.1
            );
          }
        }

        const fallbackIndex = currentWeights.indexOf(Math.max(...currentWeights));
        const fallbackProvider = config.providers[fallbackIndex].provider;

        return fallbackProvider.upload(options);
      }
    },

    async delete(key: string): Promise<DeleteResult> {
      const provider = this.getActiveProvider();
      return provider.delete(key);
    },

    async getSignedUrl(key: string, expiresIn?: number): Promise<string> {
      const provider = this.getActiveProvider();
      return provider.getSignedUrl(key, expiresIn);
    },

    getPublicUrl(key: string): string {
      const provider = this.getActiveProvider();
      return provider.getPublicUrl(key);
    },
  };
}
