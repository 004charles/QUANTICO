type MetricConnectionNoticeProps = {
  state?: "ready" | "empty" | "unavailable" | "failed";
  isLoading?: boolean;
  isError?: boolean;
};

export function MetricConnectionNotice({ state, isLoading = false, isError = false }: MetricConnectionNoticeProps) {
  if (isLoading) return <p className="text-xs text-[#738183]">A consultar a fonte analítica autorizada…</p>;
  if (isError || state === "failed" || state === "unavailable") return <p className="rounded-lg bg-[#fdf2f4] px-3 py-2 text-xs leading-5 text-[#a05c6c]">Não foi possível atualizar esta métrica. Os valores de demonstração continuam identificados abaixo.</p>;
  if (state === "empty") return <p className="rounded-lg bg-[#eff5ff] px-3 py-2 text-xs leading-5 text-[#577b9f]">Ainda não existem métricas conectadas para este módulo. Os valores exibidos são de demonstração.</p>;
  if (state === "ready") return <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#4c806c]"><span className="size-1.5 rounded-full bg-[#79b193]" />Atualizado a partir de métricas conectadas.</p>;
  return <p className="text-xs text-[#738183]">Aguardando fonte analítica.</p>;
}
