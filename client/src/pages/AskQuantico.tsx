import { DemoBadge } from "@/components/DemoBadge";
import { AIChatBox, type Message } from "@/components/AIChatBox";
import { AiVisualization, type AiVisualizationSpec } from "@/components/AiVisualization";
import { trpc } from "@/lib/trpc";
import { BarChart3, ShieldCheck, Sparkles } from "lucide-react";
import { useState } from "react";

const initialMessages: Message[] = [];

export default function AskQuantico() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [visualization, setVisualization] = useState<AiVisualizationSpec | null>(null);
  const askMutation = trpc.ai.ask.useMutation({
    onSuccess: (response) => {
      const insights = response.insights.length ? `\n\n**Sinais identificados**\n${response.insights.map((item) => `- ${item}`).join("\n")}` : "";
      const recommendations = response.recommendations.length ? `\n\n**Próximas ações**\n${response.recommendations.map((item) => `- ${item}`).join("\n")}` : "";
      setMessages((current) => [...current, { role: "assistant", content: `**${response.answer}**${insights}${recommendations}\n\n_${response.confidenceNote}_` }]);
      setVisualization("visualization" in response ? response.visualization ?? null : null);
    },
    onError: () => {
      setMessages((current) => [...current, { role: "assistant", content: "Não foi possível concluir a análise neste momento. Nenhuma consulta foi executada no seu nome; tente novamente dentro de instantes." }]);
    },
  });

  const handleSendMessage = (content: string) => {
    setMessages((current) => [...current, { role: "user", content }]);
    setVisualization(null);
    askMutation.mutate({ question: content });
  };

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
      <section className="quantico-card overflow-hidden">
        <header className="flex flex-col gap-4 border-b border-[#e4eaea] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-[#dbeafe] text-[#3977b9]"><Sparkles className="size-[18px]" /></div>
            <div><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#839092]">AI Business Analyst</p><h1 className="mt-1 text-xl font-extrabold tracking-[-0.045em] text-[#172122]">Pergunte ao seu negócio</h1></div>
          </div>
          <DemoBadge />
        </header>
        <AIChatBox
          messages={messages}
          onSendMessage={handleSendMessage}
          isLoading={askMutation.isPending}
          height="calc(100vh - 266px)"
          className="rounded-none border-0 shadow-none"
          placeholder="Ex.: Por que as vendas diminuíram este mês?"
          emptyStateMessage="Comece uma investigação com o Quantico AI"
          suggestedPrompts={["Quanto vendemos este mês?", "Quais clientes estão em risco?", "Qual produto tem maior margem?"]}
        />
      </section>
      <aside className="space-y-5">
        {visualization ? <AiVisualization visualization={visualization} /> : null}
        <section className="quantico-card p-5"><div className="flex size-10 items-center justify-center rounded-xl bg-[#eff7f2] text-[#548571]"><ShieldCheck className="size-[19px]" /></div><h2 className="mt-5 text-base font-bold tracking-[-0.04em] text-[#192526]">Consulta protegida</h2><p className="mt-2 text-sm leading-6 text-[#697778]">A interface usa apenas métricas aprovadas e operações analíticas de leitura. Chaves e dados de conexão não chegam ao navegador.</p></section>
        <section className="quantico-card p-5"><div className="flex size-10 items-center justify-center rounded-xl bg-[#f8e2e7] text-[#a86172]"><BarChart3 className="size-[19px]" /></div><h2 className="mt-5 text-base font-bold tracking-[-0.04em] text-[#192526]">Respostas acionáveis</h2><p className="mt-2 text-sm leading-6 text-[#697778]">O Quantico AI organiza resposta, evidências e recomendações. Sem fonte conectada, ele solicita dados antes de concluir.</p></section>
      </aside>
    </div>
  );
}
