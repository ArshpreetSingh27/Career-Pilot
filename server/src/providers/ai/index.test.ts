import assert from 'node:assert/strict';
import test from 'node:test';
import { env } from '../../config/env';
import { getAIProvider } from './index';

test('hosted fallback prioritizes Groq before billed Gemini', () => {
  const previous = {
    AI_PROVIDER: env.AI_PROVIDER,
    NODE_ENV: env.NODE_ENV,
    GROQ_API_KEY: env.GROQ_API_KEY,
    GEMINI_API_KEY: env.GEMINI_API_KEY,
    GEMINI_BILLING_VERIFIED: env.GEMINI_BILLING_VERIFIED,
    OLLAMA_MODEL: env.OLLAMA_MODEL,
  };
  try {
    Object.assign(env, {
      AI_PROVIDER: 'fallback', NODE_ENV: 'production',
      GROQ_API_KEY: 'synthetic-groq', GEMINI_API_KEY: 'synthetic-gemini',
      GEMINI_BILLING_VERIFIED: true, OLLAMA_MODEL: undefined,
    });
    const selected = getAIProvider();
    assert.match(selected.providerVersion, /^Groq \(hosted\):.+ -> Google Gemini:/);
  } finally {
    Object.assign(env, previous);
  }
});
