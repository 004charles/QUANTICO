import { useAuth } from "@/_core/hooks/useAuth";
import { QuanticoBrand } from "@/components/QuanticoBrand";
import { trpc } from "@/lib/trpc";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { startLogin } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import { BarChart3, Bell, Bot, Building2, ChevronDown, CircleGauge, Database, FileText, Gauge, LayoutDashboard, Link2, LogOut, Menu, Megaphone, Settings2, ShieldCheck, Sparkles, Target, UsersRound } from "lucide-react";
import { useLocation } from "wouter";

const primaryItems = [
  { icon: LayoutDashboard, label: "Resumo do negócio", path: "/" },
  { icon: Sparkles, label: "Pergunte ao seu negócio", path: "/ask-quantico", highlight: true },
  { icon: Target, label: "Vendas", path: "/sales" },
  { icon: UsersRound, label: "Clientes", path: "/customers" },
  { icon: CircleGauge, label: "Oportunidades de receita", path: "/growth" },
  { icon: Gauge, label: "Previsão de vendas", path: "/forecast" },
];

const managementItems = [
  { icon: Database, label: "Dados e importações", path: "/data" },
  { icon: Link2, label: "Conectores e campos", path: "/connectors" },
  { icon: BarChart3, label: "Áreas de análise", path: "/areas" },
  { icon: Megaphone, label: "Ações e alertas", path: "/actions" },
  { icon: FileText, label: "Relatórios", path: "/reports" },
  { icon: ShieldCheck, label: "Equipa e acessos", path: "/access" },
  { icon: Settings2, label: "Configurações", path: "/settings" },
];

function NavSection({ title, items, location, setLocation }: { title?: string; items: typeof primaryItems; location: string; setLocation: (path: string) => void }) {
  return (
    <SidebarMenu className="gap-0.5 px-2.5">
      {title ? <p className="px-2.5 pb-1.5 pt-5 text-[10px] font-semibold uppercase tracking-[0.09em] text-[#607080] group-data-[collapsible=icon]:hidden">{title}</p> : null}
      {items.map((item) => {
        const active = location === item.path;
        return (
          <SidebarMenuItem key={item.path}>
            <SidebarMenuButton
              isActive={active}
              onClick={() => setLocation(item.path)}
              tooltip={item.label}
              className={`h-9 rounded-md px-2.5 text-[#364656] transition-all hover:bg-[#f2f7fc] hover:text-[#0b62b4] data-[active=true]:bg-[#eaf3fc] data-[active=true]:font-semibold data-[active=true]:text-[#0b62b4] ${item.highlight && !active ? "text-[#0b62b4]" : ""}`}
            >
              <item.icon className={`size-4 ${item.highlight && !active ? "text-[#0b62b4]" : ""}`} strokeWidth={active ? 2.1 : 1.8} />
              <span className="truncate text-[13px]">{item.label}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const isMobile = useIsMobile();
  const organizationQuery = trpc.organization.current.useQuery(undefined, { staleTime: 5 * 60 * 1000 });
  const organization = organizationQuery.data;
  const displayName = user?.name || "Modo demonstração";
  const initials = displayName.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  const workspaceName = organization?.name || "Quantico Intelligence";
  const workspaceDetail = organization?.isDemo ? "Dados de demonstração" : `${organization?.industry || "Organização"} · ${organization?.membershipRole || "membro"}`;

  return (
    <SidebarProvider defaultOpen={!isMobile}>
      <Sidebar collapsible="icon" className="border-r border-[#e1e7ed] bg-white text-[#263746]">
        <SidebarHeader className="h-[52px] justify-center border-b border-[#0a5da9] bg-[#0f6cbd] px-3">
          <QuanticoBrand className="px-1 text-white" />
        </SidebarHeader>
        <SidebarContent className="bg-white py-3">
          <NavSection items={primaryItems} location={location} setLocation={setLocation} />
          <NavSection title="Gestão" items={managementItems} location={location} setLocation={setLocation} />
        </SidebarContent>
        <SidebarFooter className="border-t border-[#e1e7ed] bg-white p-2.5">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex w-full items-center gap-2.5 rounded-md p-1.5 text-left transition-colors hover:bg-[#f2f7fc] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#66a8dc] group-data-[collapsible=icon]:justify-center">
                <Avatar className="size-8 shrink-0"><AvatarFallback className="bg-[#eaf3fc] text-[10px] font-bold text-[#0b62b4]">{initials}</AvatarFallback></Avatar>
                <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden"><p className="truncate text-xs font-semibold text-[#273847]">{displayName}</p><p className="mt-0.5 truncate text-[10px] text-[#647687]">{workspaceDetail}</p></div>
                <ChevronDown className="size-3.5 text-[#63788c] group-data-[collapsible=icon]:hidden" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Conta Quantico</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {user ? <DropdownMenuItem onClick={logout} className="cursor-pointer text-destructive focus:text-destructive"><LogOut className="mr-2 size-4" />Terminar sessão</DropdownMenuItem> : <DropdownMenuItem onClick={() => startLogin()} className="cursor-pointer"><Building2 className="mr-2 size-4" />Iniciar sessão</DropdownMenuItem>}
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="min-h-screen bg-[#f5f7f9]">
        <header className="sticky top-0 z-20 flex h-[52px] items-center justify-between border-b border-[#0a5da9] bg-[#0f6cbd] px-4 shadow-sm sm:px-7">
          <div className="flex min-w-0 items-center gap-3">
            <SidebarTrigger className="size-8 rounded-md text-white hover:bg-white/15 hover:text-white" aria-label="Abrir navegação"><Menu className="size-4" /></SidebarTrigger>
            <div className="hidden h-5 w-px bg-white/25 sm:block" />
            <button onClick={() => setLocation("/settings")} className="hidden min-w-0 items-center gap-2 sm:flex"><span className="max-w-[260px] truncate text-sm font-semibold text-white">{workspaceName}</span><ChevronDown className="size-3.5 shrink-0 text-white/75" /></button>
            {isMobile ? <QuanticoBrand compact className="bg-white/15 text-white" /> : null}
          </div>
          <div className="flex items-center gap-2.5"><span className="hidden rounded-sm border border-white/25 bg-white/10 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.08em] text-white/95 lg:inline-flex">Área de trabalho</span><button className="relative flex size-8 items-center justify-center rounded-md text-white transition-colors hover:bg-white/15" aria-label="Notificações"><Bell className="size-4" /><span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-[#9ed0ff] ring-2 ring-[#0f6cbd]" /></button></div>
        </header>
        <main className="mx-auto w-full max-w-[1660px] flex-1 px-4 py-6 sm:px-7 sm:py-7">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
