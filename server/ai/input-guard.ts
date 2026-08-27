const blockedPatterns: Array<[RegExp, string]> = [
  [/\b(ignore|ignore todas|ignore todos|desconsidere)\b.{0,80}\b(instruções|instrucoes|prompt|sistema|system)\b/i, "A pergunta tenta alterar as regras de segurança do analista."],
  [/\b(revele|mostrar|mostre|exiba|exporte|vaze)\b.{0,100}\b(chave|senha|token|segredo|secret|api key|prompt)\b/i, "A pergunta solicita credenciais, segredos ou instruções internas."],
  [/\b(todas as empresas|todos os tenants|outra organização|outra organizacao|outro cliente)\b/i, "A pergunta solicita dados fora da organização atual."],
  [/\b(drop|delete|truncate|alter|insert|update)\b.{0,80}\b(sql|tabela|table|database|banco)\b/i, "A pergunta solicita uma operação destrutiva."],
];

export type AiInputAssessment = { safe: true } | { safe: false; reason: string };

/** Rejects clearly unsafe requests without sending them to an external AI provider. */
export function assessAiInputSafety(question: string): AiInputAssessment {
  const normalized = question.trim();
  if (!normalized) return { safe: false, reason: "A pergunta não pode estar vazia." };
  for (const [pattern, reason] of blockedPatterns) {
    if (pattern.test(normalized)) return { safe: false, reason };
  }
  return { safe: true };
}
