import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Building2, CheckCircle2, ChevronRight, Database, FileUp, Goal, Loader2, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

type Goal = "grow_revenue" | "improve_retention" | "improve_efficiency" | "improve_forecast";
type CompanySize = "solo" | "small" | "mid_market" | "enterprise";
type DataReadiness = "starting" | "spreadsheets" | "systems_connected";

const goals: Array<{ value: Goal; title: string; description: string; icon: typeof Goal }> = [
  { value: "grow_revenue", title: "Aumentar receita", description: "Encontrar oportunidades e melhorar vendas.", icon: Goal },
  { value: "improve_retention", title: "Reter clientes", description: "Reduzir riscos e recuperar clientes inativos.", icon: CheckCircle2 },
  { value: "improve_efficiency", title: "Melhorar eficiência", description: "Identificar custos e operações a optimizar.", icon: Sparkles },
  { value: "improve_forecast", title: "Prever resultados", description: "Planear metas e antecipar tendências.", icon: Database },
];

function toBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1] || "");
    reader.onerror = () => reject(new Error("Não foi possível ler o ficheiro."));
    reader.readAsDataURL(file);
  });
}

export default function WorkspaceSetup() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const setupQuery = trpc.organization.setup.useQuery();
  const utils = trpc.useUtils();
  const [name, setName] = useState("");
  const [industry, setIndustry] = useState("Comércio e retalho");
  const [companySize, setCompanySize] = useState<CompanySize>("small");
  const [dataReadiness, setDataReadiness] = useState<DataReadiness>("spreadsheets");
  const [primaryGoal, setPrimaryGoal] = useState<Goal>("grow_revenue");
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);

  useEffect(() => {
    const source = setupQuery.data;
    if (!source) return;
    setName(source.organization.name);
    if (source.profile) {
      setCompanySize(source.profile.companySize as CompanySize);
      setDataReadiness(source.profile.dataReadiness as DataReadiness);
      setPrimaryGoal(source.profile.primaryGoal as Goal);
    }
  }, [setupQuery.data]);

  const saveMutation = trpc.organization.saveSetup.useMutation({
    onSuccess: () => {
      utils.organization.current.invalidate();
      utils.organization.setup.invalidate();
      toast.success("Configuração guardada. A Quantico vai adaptar os indicadores à sua organização.");
    },
    onError: (error) => toast.error(error.message),
  });
  const importMutation = trpc.data.importFile.useMutation({
    onSuccess: (result) => {
      setUploadedFile(result.fileName);
      utils.data.listImports.invalidate();
      toast.success(result.metricSnapshotsCreated ? `${result.metricSnapshotsCreated} período(s) preparados para análise.` : "Ficheiro analisado e guardado no seu workspace.");
    },
    onError: (error) => toast.error(error.message),
  });
  const save = () => saveMutation.mutate({ organizationName: name, industry, companySize, dataReadiness, primaryGoal });
  const handleFile = async (file?: File) => {
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) { toast.error("Envie um ficheiro de até 8 MB."); return; }
    try { importMutation.mutate({ fileName: file.name, contentType: file.type || "application/octet-stream", contentBase64: await toBase64(file) }); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Não foi possível preparar o ficheiro."); }
  };
  const complete = Boolean(setupQuery.data?.profile?.onboardingComplete);

  return <div className="space-y-7 pb-6">
    <PageHeader eyebrow="Configuração inicial" title="Dê contexto à sua inteligência de negócio." description="Estes dados ajudam a Quantico a escolher os indicadores, as perguntas e as recomendações mais relevantes para a sua empresa." askCta={false} />
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
      <section className="quantico-card overflow-hidden">
        <div className="border-b border-[#dbe5ef] bg-[#fbfcfe] px-5 py-4 sm:px-6"><div className="flex items-center gap-3"><span className="flex size-9 items-center justify-center rounded-md bg-[#eaf3fc] text-[#0f6cbd]"><Building2 className="size-[18px]" /></span><div><p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#52708b]">Passo a passo</p><h2 className="text-base font-semibold text-[#263746]">Configure a sua organização</h2></div></div></div>
        <div className="space-y-7 p-5 sm:p-6">
          <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="companyName">Nome da empresa</Label><Input id="companyName" value={name} onChange={(event) => setName(event.target.value)} placeholder="Ex.: Quantico Angola" /></div><div className="space-y-2"><Label htmlFor="industry">Sector</Label><Input id="industry" value={industry} onChange={(event) => setIndustry(event.target.value)} placeholder="Ex.: Comércio e retalho" /></div></div>
          <div><p className="text-sm font-semibold text-[#263746]">Qual é a prioridade agora?</p><p className="mt-1 text-sm text-[#627485]">Vamos destacar os indicadores e recomendações ligados a esta decisão.</p><div className="mt-4 grid gap-3 sm:grid-cols-2">{goals.map((goal) => { const Icon = goal.icon; const selected = primaryGoal === goal.value; return <button key={goal.value} type="button" onClick={() => setPrimaryGoal(goal.value)} className={`rounded-md border p-4 text-left transition-colors ${selected ? "border-[#0f6cbd] bg-[#f2f8fe]" : "border-[#dce5ed] bg-white hover:border-[#a9c9e6]"}`}><span className={`flex size-8 items-center justify-center rounded-md ${selected ? "bg-[#0f6cbd] text-white" : "bg-[#eaf3fc] text-[#0f6cbd]"}`}><Icon className="size-4" /></span><p className="mt-3 text-sm font-semibold text-[#263746]">{goal.title}</p><p className="mt-1 text-xs leading-5 text-[#627485]">{goal.description}</p></button>; })}</div></div>
          <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label>Dimensão da empresa</Label><Select value={companySize} onValueChange={(value) => setCompanySize(value as CompanySize)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="solo">Só eu</SelectItem><SelectItem value="small">Equipa pequena</SelectItem><SelectItem value="mid_market">Média empresa</SelectItem><SelectItem value="enterprise">Grande empresa</SelectItem></SelectContent></Select></div><div className="space-y-2"><Label>Como estão os seus dados?</Label><Select value={dataReadiness} onValueChange={(value) => setDataReadiness(value as DataReadiness)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="starting">Ainda vou organizar</SelectItem><SelectItem value="spreadsheets">Estão em Excel ou CSV</SelectItem><SelectItem value="systems_connected">Estão em sistemas ligados</SelectItem></SelectContent></Select></div></div>
          <div className="flex flex-col gap-4 rounded-md border border-[#dbe5ef] bg-[#fbfcfe] p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-semibold text-[#263746]">Primeiro ficheiro de dados</p><p className="mt-1 text-xs leading-5 text-[#627485]">Envie CSV, XLSX ou JSON (até 8 MB). O ficheiro fica isolado na sua organização.</p>{uploadedFile ? <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-[#147a44]"><CheckCircle2 className="size-3.5" />{uploadedFile} foi analisado.</p> : null}</div><Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={importMutation.isPending} className="shrink-0 border-[#0f6cbd] text-[#0f6cbd] hover:bg-[#eaf3fc]">{importMutation.isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <FileUp className="mr-2 size-4" />}{importMutation.isPending ? "A analisar…" : "Enviar ficheiro"}</Button><input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls,.json,text/csv,application/json,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" className="hidden" onChange={(event) => handleFile(event.target.files?.[0])} /></div>
          <Button onClick={save} disabled={saveMutation.isPending || name.trim().length < 2 || industry.trim().length < 2} className="quantico-dark-button h-10 rounded-md px-4 text-sm font-semibold">{saveMutation.isPending ? "A guardar…" : complete ? "Actualizar configuração" : "Concluir configuração"}<ChevronRight className="ml-1 size-4" /></Button>
        </div>
      </section>
      <aside className="space-y-5"><section className="quantico-card border-t-2 border-t-[#0f6cbd] p-5"><p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#52708b]">A sua identidade</p><h2 className="mt-2 text-lg font-semibold tracking-[-0.03em] text-[#263746]">Quantico Intelligence</h2><p className="mt-3 text-sm leading-6 text-[#5c6e80]">Uma linguagem visual corporativa criada para tornar informação complexa clara, segura e accionável.</p><div className="mt-5 grid grid-cols-3 gap-2"><span className="h-8 rounded-md bg-[#0f6cbd]" /><span className="h-8 rounded-md border border-[#dce5ed] bg-white" /><span className="h-8 rounded-md bg-[#263746]" /></div></section><section className="quantico-card p-5"><p className="text-sm font-semibold text-[#263746]">O que acontece depois</p><ol className="mt-4 space-y-3 text-sm text-[#5c6e80]"><li className="flex gap-3"><span className="font-semibold text-[#0f6cbd]">1</span>Confirme o significado das colunas.</li><li className="flex gap-3"><span className="font-semibold text-[#0f6cbd]">2</span>Veja os indicadores no resumo.</li><li className="flex gap-3"><span className="font-semibold text-[#0f6cbd]">3</span>Comece a perguntar ao seu negócio.</li></ol></section></aside>
    </div>
  </div>;
}
