import OpenAI from 'openai';
const openai = new OpenAI();

type Hit = { id: string; score: number };

export async function scoreMerge(
  vec: Hit[],
  kw: Hit[],
  { domain }: { domain?: string }
) {
  const α = await pickAlpha(Boolean(domain));
  const byId = new Map<string, number>();

  for (const h of vec) byId.set(h.id, (byId.get(h.id) ?? 0) + α * h.score);
  for (const h of kw)  byId.set(h.id, (byId.get(h.id) ?? 0) + (1 - α) * h.score);

  return Array.from(byId.entries())
    .map(([id, score]) => ({ id, score }))
    .sort((a, b) => b.score - a.score);
}

async function pickAlpha(hasDomain: boolean) {
  if (process.env.FINEX_ALPHA_MODE !== 'gpt') {
    return hasDomain ? 0.65 : 0.5;
  }
  const { choices } = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    max_tokens: 4,
    messages: [
      { role: 'system', content: 'Return a single number 0-1 for α weighting.' },
      { role: 'user',   content: hasDomain ? 'domain present' : 'no domain' },
    ],
  });
  const n = parseFloat(choices[0].message.content ?? '');
  return Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : 0.6;
}
