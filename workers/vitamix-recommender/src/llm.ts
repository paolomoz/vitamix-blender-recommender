/**
 * LLM Abstraction Layer
 * Supports Cerebras (Llama 3.3 70B) and Anthropic (Claude Opus 4.5)
 */

import type { Env, LLMModel } from './types';

interface LLMRequest {
  systemPrompt: string;
  userMessage: string;
  temperature?: number;
  maxTokens?: number;
}

interface LLMResponse {
  content: string;
  model: LLMModel;
}

/**
 * Call the appropriate LLM based on model selection
 */
export async function callLLM(
  request: LLMRequest,
  model: LLMModel,
  env: Env
): Promise<LLMResponse> {
  if (model === 'claude') {
    return callAnthropic(request, env);
  }
  return callCerebras(request, env);
}

/**
 * Call Cerebras API (Llama 3.3 70B)
 */
async function callCerebras(request: LLMRequest, env: Env): Promise<LLMResponse> {
  const response = await fetch('https://api.cerebras.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.CEREBRAS_KEY}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b',
      messages: [
        { role: 'system', content: request.systemPrompt },
        { role: 'user', content: request.userMessage },
      ],
      temperature: request.temperature ?? 0.1,
      max_tokens: request.maxTokens ?? 500,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Cerebras API error:', response.status, errorText);
    throw new Error(`Cerebras API error: ${response.status}`);
  }

  const data = (await response.json()) as {
    choices: Array<{ message: { content: string } }>;
  };

  return {
    content: data.choices[0]?.message?.content || '',
    model: 'cerebras',
  };
}

/**
 * Call Anthropic API (Claude Opus 4.5)
 */
async function callAnthropic(request: LLMRequest, env: Env): Promise<LLMResponse> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-opus-4-5-20251101',
      max_tokens: request.maxTokens ?? 500,
      system: request.systemPrompt,
      messages: [
        { role: 'user', content: request.userMessage },
      ],
      temperature: request.temperature ?? 0.1,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Anthropic API error:', response.status, errorText);
    throw new Error(`Anthropic API error: ${response.status}`);
  }

  const data = (await response.json()) as {
    content: Array<{ type: string; text: string }>;
  };

  const textContent = data.content.find((c) => c.type === 'text');
  return {
    content: textContent?.text || '',
    model: 'claude',
  };
}

/**
 * Parse JSON from LLM response
 * Handles markdown code blocks and raw JSON
 */
export function parseJsonFromResponse<T>(content: string): T | null {
  // Try to extract JSON from markdown code block
  const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    try {
      return JSON.parse(codeBlockMatch[1].trim()) as T;
    } catch {
      // Continue to raw JSON parsing
    }
  }

  // Try to extract raw JSON object or array
  const jsonMatch = content.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0]) as T;
    } catch {
      return null;
    }
  }

  return null;
}
