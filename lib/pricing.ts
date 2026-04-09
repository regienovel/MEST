// Approximate cost per 1K tokens (USD)
export const PRICING = {
  'gpt-4o': { input: 0.0025, output: 0.01 },
  'claude-sonnet': { input: 0.003, output: 0.015 },
} as const;

export function estimateCost(model: 'gpt-4o' | 'claude-sonnet', inputTokens: number, outputTokens: number): number {
  const p = PRICING[model];
  return (inputTokens / 1000) * p.input + (outputTokens / 1000) * p.output;
}
