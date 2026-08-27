import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { CheckCircle2, Loader2, ShieldCheck, UsersRound } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const areaOptions = [
  { id: "executive", label: "Direcção", detail: "Resumo executivo, oportunidades e previsão." },
  { id: "sales", label: "Vendas", detail: "Desempenho comercial e produtos." },
  { id: "customers", label: "Clientes", detail: "Retenção e segmentos de clientes." },
  { id: "operations", label: "Operações", detail: "Dados, conectores e qualidade." },
] as const;
type Area = (typeof areaOptions)[number]["id"];

export default function WorkspaceAccess() {
  const utils = trpc.useUtils();
  const organization = trpc.organization.current.useQuery();
  const preferences = trpc.organization.preferences.useQuery();
  const members = trpc.organization.members.useQuery(undefined, { enabled: organization.data?.membershipRole === "owner" || organization.data?.membershipRole === "admin" });
  const [visibleAreas, setVisibleAreas] = useState<Area[]>(["executive", "sales", "customers", "operations"]);
  const [defaultArea, setDefaultArea] = useState<Area>("executive");
  useEffect(() => { if (preferences.data) { setVisibleAreas(preferences.data.visibleAreas as Area[]); setDefaultArea(preferences.data.defaultArea as Area); } }, [preferences.data]);
  const saveMutation = trpc.organization.savePreferences.useMutation({ onSuccess: () => { utils.organization.preferences.invalidate(); toast.success("Preferências de área guardadas."); }, onError: (error) => toast.error(error.message) });
  const toggleArea = (area: Area) => setVisibleAreas((current) => current.includes(area) ? current.length === 1 ? current : current.filter((item) => item !== area) : [...current, area]);
  const role = organization.data?.membershipRole;
  const isManager = role === "owner" || role === "admin";
  return <div className="space-y-7 pb-6"><PageHeader eyebrow="Equipa e acessos" title="Defina como cada pessoa navega e governe a organização." description="A navegação pode ser ajustada por utilizador. Ações sensíveis, dados e automações são autorizados no servidor conforme o papel de cada membro." askCta={false} /><div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.9fr)]"><section className="quantico-card p-5 sm:p-6"><div className="flex items-center gap-3"><span className="flex size-9 items-center justify-center rounded-md bg-[#eaf3fc] text-[#0f6cbd]"><ShieldCheck className="size-[18px]" /></span><div><p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#52708b]">As minhas áreas</p><h2 className="text-base font-semibold text-[#263746]">Personalize a navegação</h2></div></div><p className="mt-5 text-sm leading-6 text-[#627485]">Escolha as áreas que pretende ver. Isto não aumenta o acesso aos dados; apenas organiza a experiência da sua conta.</p><div className="mt-5 space-y-3">{areaOptions.map((area) => <label key={area.id} className="flex cursor-pointer items-start gap-3 rounded-md border border-[#dce5ed] p-4 hover:border-[#a9c9e6]"><Checkbox checked={visibleAreas.includes(area.id)} onCheckedChange={() => toggleArea(area.id)} className="mt-0.5" /><span><span className="block text-sm font-semibold text-[#263746]">{area.label}</span><span className="mt-1 block text-xs leading-5 text-[#627485]">{area.detail}</span></span></label>)}</div><div className="mt-5 max-w-xs space-y-2"><Label>Área inicial</Label><Select value={defaultArea} onValueChange={(value) => setDefaultArea(value as Area)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{areaOptions.filter((area) => visibleAreas.includes(area.id)).map((area) => <SelectItem key={area.id} value={area.id}>{area.label}</SelectItem>)}</SelectContent></Select></div><Button onClick={() => saveMutation.mutate({ defaultArea, visibleAreas })} disabled={saveMutation.isPending} className="quantico-dark-button mt-6 h-10 rounded-md px-4 text-sm font-semibold">{saveMutation.isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <CheckCircle2 className="mr-2 size-4" />}{saveMutation.isPending ? "A guardar…" : "Guardar preferências"}</Button></section><section className="quantico-card overflow-hidden"><div className="flex items-center justify-between border-b border-[#dbe5ef] bg-[#fbfcfe] px-5 py-4"><div><p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#52708b]">Organização</p><h2 className="text-base font-semibold text-[#263746]">Membros e papéis</h2></div><UsersRound className="size-5 text-[#0f6cbd]" /></div>{isManager ? <div className="divide-y divide-[#edf0f2]">{members.isLoading ? <div className="flex items-center gap-2 p-6 text-sm text-[#627485]"><Loader2 className="size-4 animate-spin" />A carregar membros…</div> : members.data?.map((member) => <div key={member.userId} className="flex items-center gap-3 px-5 py-4"><span className="flex size-8 items-center justify-center rounded-full bg-[#eaf3fc] text-[10px] font-bold text-[#0f6cbd]">{(member.name || member.email || "M").slice(0, 2).toUpperCase()}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-[#263746]">{member.name || "Membro da organização"}</p><p className="truncate text-xs text-[#627485]">{member.email || "Sem endereço público"}</p></div><span className="rounded-md bg-[#edf5fd] px-2 py-1 text-[10px] font-semibold capitalize text-[#0f6cbd]">{member.role}</span></div>)}</div> : <div className="p-6"><p className="text-sm font-semibold text-[#263746]">O seu papel é {role || "membro"}.</p><p className="mt-2 text-sm leading-6 text-[#627485]">A lista da equipa é visível apenas para proprietários e administradores. Contacte um administrador para gerir acessos.</p></div>}<div className="border-t border-[#edf0f2] bg-[#fbfcfe] p-5"><p className="text-xs leading-5 text-[#627485]"><strong className="text-[#263746]">Papéis:</strong> proprietário e administrador governam configurações; analista pode trabalhar dados e relatórios; visualizador consulta as áreas autorizadas.</p></div></section></div></div>;
}
