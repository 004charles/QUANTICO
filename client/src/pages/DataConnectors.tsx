import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { CheckCircle2, Database, KeyRound, Link2, Loader2, MapPinned, ShieldCheck, TableProperties } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type ConnectorType = "postgresql" | "mysql" | "sqlserver" | "sqlite" | "google_sheets" | "rest_api" | "webhook";
type BusinessField = "date" | "revenue" | "sales" | "customer" | "product" | "order";
type MappingValues = Record<BusinessField, string>;
type Dataset = { id: number; fileName: string; profile: { columns?: Array<{ name: string; inferredType: string }> } | null };

const connectorOptions: Array<{ value: ConnectorType; label: string; description: string; fields: Array<{ key: string; label: string; placeholder: string }>; secretLabel?: string }> = [
  { value: "postgresql", label: "PostgreSQL", description: "Base de dados relacional em modo de leitura.", fields: [{ key: "host", label: "Servidor", placeholder: "db.empresa.co.ao" }, { key: "port", label: "Porta", placeholder: "5432" }, { key: "database", label: "Base de dados", placeholder: "vendas" }, { key: "username", label: "Utilizador", placeholder: "leitura_quantico" }, { key: "ssl", label: "SSL", placeholder: "obrigatório" }], secretLabel: "Palavra-passe" },
  { value: "mysql", label: "MySQL", description: "Base de dados relacional em modo de leitura.", fields: [{ key: "host", label: "Servidor", placeholder: "db.empresa.co.ao" }, { key: "port", label: "Porta", placeholder: "3306" }, { key: "database", label: "Base de dados", placeholder: "vendas" }, { key: "username", label: "Utilizador", placeholder: "leitura_quantico" }, { key: "ssl", label: "SSL", placeholder: "obrigatório" }], secretLabel: "Palavra-passe" },
  { value: "sqlserver", label: "SQL Server", description: "Inventário de fonte Microsoft SQL Server.", fields: [{ key: "host", label: "Servidor", placeholder: "sql.empresa.co.ao" }, { key: "port", label: "Porta", placeholder: "1433" }, { key: "database", label: "Base de dados", placeholder: "comercial" }, { key: "username", label: "Utilizador", placeholder: "leitura_quantico" }, { key: "ssl", label: "SSL", placeholder: "obrigatório" }], secretLabel: "Palavra-passe" },
  { value: "sqlite", label: "SQLite", description: "Identificação de uma base para importação controlada.", fields: [{ key: "database", label: "Identificador da base", placeholder: "operacoes.db" }] },
  { value: "google_sheets", label: "Google Sheets", description: "Planilha partilhada com a conta de serviço autorizada.", fields: [{ key: "spreadsheetUrl", label: "Ligação da planilha", placeholder: "https://docs.google.com/spreadsheets/..." }, { key: "worksheetName", label: "Nome da folha", placeholder: "Vendas" }], secretLabel: "Credencial JSON da conta de serviço" },
  { value: "rest_api", label: "REST API", description: "Endpoint analítico autenticado por token.", fields: [{ key: "endpointUrl", label: "Endpoint HTTPS", placeholder: "https://api.empresa.co.ao/v1/vendas" }], secretLabel: "Token de acesso" },
  { value: "webhook", label: "Webhook", description: "Inventário para recepção validada de eventos.", fields: [{ key: "endpointName", label: "Nome do canal", placeholder: "eventos-de-vendas" }], secretLabel: "Segredo de assinatura" },
];

const fieldLabels: Record<BusinessField, { title: string; description: string }> = {
  date: { title: "Data", description: "Quando ocorreu a venda ou transacção." },
  revenue: { title: "Receita", description: "Valor monetário da venda." },
  sales: { title: "Vendas", description: "Quantidade efectiva de itens ou vendas." },
  customer: { title: "Cliente", description: "Identificador ou nome do cliente." },
  product: { title: "Produto", description: "Produto ou serviço vendido." },
  order: { title: "Pedido", description: "Número ou quantidade de vendas." },
};
const emptyMapping: MappingValues = { date: "unmapped", revenue: "unmapped", sales: "unmapped", customer: "unmapped", product: "unmapped", order: "unmapped" };

function suggestMapping(columns: Array<{ name: string }>): MappingValues {
  const find = (terms: string[]) => columns.find((column) => terms.some((term) => column.name.toLocaleLowerCase("pt-AO").includes(term)))?.name ?? "unmapped";
  return { date: find(["data", "date", "período", "periodo", "mês", "mes"]), revenue: find(["receita", "valor", "faturamento", "revenue", "total"]), sales: find(["quantidade", "qtd", "unidades", "itens"]), customer: find(["cliente", "customer", "conta"]), product: find(["produto", "product", "serviço", "servico"]), order: find(["pedido", "order", "documento"]) };
}

function sourceStatus(status: string) {
  if (status === "connected") return { label: "Ligado", style: "bg-[#e7f7ec] text-[#147a44]" };
  if (status === "error") return { label: "Erro", style: "bg-[#fff0f0] text-[#b42318]" };
  return { label: "Pendente", style: "bg-[#fff4ce] text-[#765d00]" };
}

export default function DataConnectors() {
  const utils = trpc.useUtils();
  const sourcesQuery = trpc.data.listSources.useQuery();
  const importsQuery = trpc.data.listImports.useQuery();
  const mappingsQuery = trpc.data.listMappings.useQuery();
  const [type, setType] = useState<ConnectorType>("postgresql");
  const [name, setName] = useState("");
  const [config, setConfig] = useState<Record<string, string>>({});
  const [secret, setSecret] = useState("");
  const datasets = (importsQuery.data ?? []) as Dataset[];
  const [datasetId, setDatasetId] = useState<string>("");
  const [mapping, setMapping] = useState<MappingValues>(emptyMapping);
  const selectedConnector = useMemo(() => connectorOptions.find((item) => item.value === type) ?? connectorOptions[0], [type]);
  const selectedDataset = datasets.find((dataset) => String(dataset.id) === datasetId);
  const columns = selectedDataset?.profile?.columns ?? [];

  useEffect(() => { setConfig({}); setSecret(""); }, [type]);
  useEffect(() => { if (!datasetId && datasets[0]) setDatasetId(String(datasets[0].id)); }, [datasetId, datasets]);
  useEffect(() => {
    if (!datasetId) return;
    const existing = mappingsQuery.data?.find((item) => item.datasetId === Number(datasetId));
    const stored = existing?.mapping as Partial<Record<BusinessField, string>> | undefined;
    const suggested = suggestMapping(datasets.find((dataset) => dataset.id === Number(datasetId))?.profile?.columns ?? []);
    setMapping({ date: stored?.date ?? suggested.date, revenue: stored?.revenue ?? suggested.revenue, sales: stored?.sales ?? suggested.sales, customer: stored?.customer ?? suggested.customer, product: stored?.product ?? suggested.product, order: stored?.order ?? suggested.order });
  }, [datasetId, mappingsQuery.data, datasets]);

  const sourceMutation = trpc.data.createSource.useMutation({
    onSuccess: () => { utils.data.listSources.invalidate(); setName(""); setConfig({}); setSecret(""); toast.success("Conector guardado. Execute o teste de ligação abaixo para validar o acesso."); },
    onError: (error) => toast.error(error.message),
  });
  const testMutation = trpc.data.testSource.useMutation({
    onSuccess: (result) => { utils.data.listSources.invalidate(); result.ok ? toast.success(result.message) : toast.error(result.message); },
    onError: (error) => toast.error(error.message),
  });
  const mappingMutation = trpc.data.saveMapping.useMutation({
    onSuccess: () => { utils.data.listMappings.invalidate(); toast.success("Mapeamento guardado. Os indicadores foram recalculados com os campos seleccionados."); },
    onError: (error) => toast.error(error.message),
  });
  const saveSource = () => sourceMutation.mutate({ name: name || selectedConnector.label, type, config, ...(secret.trim() ? { secret } : {}) });
  const saveMapping = () => {
    if (!datasetId) return;
    const payload: Partial<Record<BusinessField, string>> = {};
    (Object.keys(mapping) as BusinessField[]).forEach((field) => { if (mapping[field] !== "unmapped") payload[field] = mapping[field]; });
    if (!Object.keys(payload).length) { toast.error("Selecione ao menos um campo de negócio."); return; }
    mappingMutation.mutate({ datasetId: Number(datasetId), mapping: payload });
  };

  return <div className="space-y-7 pb-6">
    <PageHeader eyebrow="Dados conectados" title="Ligue fontes e explique o significado dos seus dados." description="Crie o inventário de conectores e confirme quais colunas representam receita, clientes, produtos, pedidos e datas." askCta={false} />
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(340px,0.9fr)]">
      <section className="quantico-card overflow-hidden">
        <div className="border-b border-[#dbe5ef] bg-[#fbfcfe] px-5 py-4 sm:px-6"><div className="flex items-center gap-3"><span className="flex size-9 items-center justify-center rounded-md bg-[#eaf3fc] text-[#0f6cbd]"><Link2 className="size-[18px]" /></span><div><p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#52708b]">Connect Data Source</p><h2 className="text-base font-semibold text-[#263746]">Registe uma fonte de dados</h2></div></div></div>
        <div className="space-y-5 p-5 sm:p-6"><div className="grid gap-3 sm:grid-cols-2">{connectorOptions.map((option) => <button type="button" key={option.value} onClick={() => setType(option.value)} className={`rounded-md border p-3 text-left transition-colors ${type === option.value ? "border-[#0f6cbd] bg-[#f2f8fe]" : "border-[#dce5ed] hover:border-[#a9c9e6]"}`}><p className="text-sm font-semibold text-[#263746]">{option.label}</p><p className="mt-1 text-xs leading-4 text-[#627485]">{option.description}</p></button>)}</div><div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="sourceName">Nome da fonte</Label><Input id="sourceName" value={name} onChange={(event) => setName(event.target.value)} placeholder={`Ex.: ${selectedConnector.label} comercial`} /></div><div className="space-y-2"><Label>Tipo seleccionado</Label><div className="flex h-9 items-center rounded-md border border-[#dce5ed] bg-[#f7f9fb] px-3 text-sm font-medium text-[#4e6172]">{selectedConnector.label}</div></div>{selectedConnector.fields.map((field) => <div className="space-y-2" key={field.key}><Label htmlFor={field.key}>{field.label}</Label><Input id={field.key} value={config[field.key] ?? ""} onChange={(event) => setConfig((current) => ({ ...current, [field.key]: event.target.value }))} placeholder={field.placeholder} /></div>)}{selectedConnector.secretLabel ? <div className="space-y-2"><Label htmlFor="sourceSecret">{selectedConnector.secretLabel}</Label><Input id="sourceSecret" type="password" autoComplete="new-password" value={secret} onChange={(event) => setSecret(event.target.value)} placeholder="Necessária para testar" /></div> : null}</div><div className="flex flex-col gap-3 rounded-md bg-[#edf5fd] p-4 text-xs leading-5 text-[#315b7c] sm:flex-row sm:items-start"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#0f6cbd]" /><p>As configurações ficam no workspace actual. Uma credencial introduzida é cifrada antes de ser guardada e nunca é devolvida para o navegador. Após guardar, execute o teste para validar somente a ligação e permissões de leitura, sem importar dados.</p></div><Button onClick={saveSource} disabled={sourceMutation.isPending} className="quantico-dark-button h-10 rounded-md px-4 text-sm font-semibold">{sourceMutation.isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <KeyRound className="mr-2 size-4" />}{sourceMutation.isPending ? "A guardar…" : "Guardar conector"}</Button></div>
      </section>
      <aside className="quantico-card overflow-hidden"><div className="flex items-center justify-between border-b border-[#dbe5ef] bg-[#fbfcfe] px-5 py-4"><div><p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#52708b]">Inventário</p><h2 className="text-base font-semibold text-[#263746]">Fontes desta organização</h2></div><Database className="size-5 text-[#0f6cbd]" /></div>{sourcesQuery.isLoading ? <div className="flex items-center gap-2 p-6 text-sm text-[#627485]"><Loader2 className="size-4 animate-spin" />A carregar fontes…</div> : sourcesQuery.data?.length ? <div className="divide-y divide-[#edf0f2]">{sourcesQuery.data.map((source) => { const status = sourceStatus(source.status); return <div key={source.id} className="px-5 py-4"><div className="flex items-start gap-3"><span className="flex size-8 items-center justify-center rounded-md bg-[#eaf3fc] text-[#0f6cbd]"><Database className="size-4" /></span><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-[#263746]">{source.name}</p><p className="mt-0.5 text-xs text-[#627485]">{connectorOptions.find((item) => item.value === source.type)?.label ?? source.type} · {source.hasCredential ? "credencial protegida" : "sem credencial"}</p><Button type="button" variant="outline" size="sm" onClick={() => testMutation.mutate({ sourceId: source.id })} disabled={testMutation.isPending} className="mt-3 h-8 border-[#a9c9e6] text-xs text-[#0f6cbd]">{testMutation.isPending ? <Loader2 className="mr-1.5 size-3 animate-spin" /> : <Link2 className="mr-1.5 size-3" />}Testar ligação</Button></div><span className={`rounded-md px-2 py-1 text-[10px] font-semibold ${status.style}`}>{status.label}</span></div></div>; })}</div> : <div className="p-6"><p className="text-sm font-semibold text-[#263746]">Ainda não há conectores.</p><p className="mt-2 text-sm leading-6 text-[#627485]">Pode importar um ficheiro ou registar uma fonte que será configurada com permissões mínimas de leitura.</p></div>}</aside>
    </div>
    <section className="quantico-card overflow-hidden"><div className="flex flex-col gap-3 border-b border-[#dbe5ef] bg-[#fbfcfe] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"><div className="flex items-center gap-3"><span className="flex size-9 items-center justify-center rounded-md bg-[#eaf3fc] text-[#0f6cbd]"><MapPinned className="size-[18px]" /></span><div><p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#52708b]">Mapeamento de campos</p><h2 className="text-base font-semibold text-[#263746]">Confirme as colunas que a Quantico deve analisar</h2></div></div>{datasets.length ? <Select value={datasetId} onValueChange={setDatasetId}><SelectTrigger className="w-full bg-white sm:w-[280px]"><SelectValue placeholder="Selecione um ficheiro" /></SelectTrigger><SelectContent>{datasets.map((dataset) => <SelectItem key={dataset.id} value={String(dataset.id)}>{dataset.fileName}</SelectItem>)}</SelectContent></Select> : null}</div>{datasets.length ? <div className="p-5 sm:p-6"><p className="mb-5 text-sm leading-6 text-[#627485]">A importação reconhece automaticamente campos comuns. Confirme ou corrija o mapeamento abaixo para que os indicadores sejam calculados com a estrutura real do seu ficheiro.</p><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">{(Object.keys(fieldLabels) as BusinessField[]).map((field) => <div className="space-y-2" key={field}><Label>{fieldLabels[field].title}</Label><Select value={mapping[field]} onValueChange={(value) => setMapping((current) => ({ ...current, [field]: value }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="unmapped">Não mapear</SelectItem>{columns.map((column) => <SelectItem key={column.name} value={column.name}>{column.name}</SelectItem>)}</SelectContent></Select><p className="text-xs leading-4 text-[#627485]">{fieldLabels[field].description}</p></div>)}</div><div className="mt-6 flex flex-col gap-3 border-t border-[#edf0f2] pt-5 sm:flex-row sm:items-center sm:justify-between"><p className="flex items-center gap-2 text-xs text-[#627485]"><TableProperties className="size-4 text-[#0f6cbd]" />{columns.length} coluna(s) disponível(eis) no ficheiro seleccionado.</p><Button onClick={saveMapping} disabled={mappingMutation.isPending || !datasetId} className="quantico-dark-button h-10 rounded-md px-4 text-sm font-semibold">{mappingMutation.isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <CheckCircle2 className="mr-2 size-4" />}{mappingMutation.isPending ? "A aplicar…" : "Guardar e recalcular"}</Button></div></div> : <div className="p-6 text-sm text-[#627485]">Importe primeiro um ficheiro CSV, XLSX ou JSON na Central de Dados. As colunas detectadas aparecerão aqui para confirmação.</div>}</section>
  </div>;
}
