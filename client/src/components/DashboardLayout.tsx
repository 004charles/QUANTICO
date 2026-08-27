import { useAuth } from "@/_core/hooks/useAuth";
import { QuanticoBrand } from "@/components/QuanticoBrand";
import { trpc } from "@/lib/trpc";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { startLogin } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import { BarChart3, Bell, Bot, Building2, ChevronDown, CircleGauge, Database, FileText, Gauge, LayoutDashboard, LogOut, Menu, Settings2, Sparkles, Target, UsersRound } from "lucide-react";
import { useLocation } from "wouter";

const primaryItems = [
  { icon: LayoutDashboard, label: "Visão geral", path: "/" },
  { icon: Sparkles, label: "Pergunte ao seu negócio", path: "/ask-quantico", highlight: true },
  { icon: Target, label: "Sales Intelligence", path: "/sales" },
  { icon: UsersRound, label: "Customer Intelligence", path: "/customers" },
  { icon: CircleGauge, label: "Oportunidades", path: "/growth" },
  { icon: Gauge, label: "Previsões", path: "/forecast" },
];

const managementItems = [
  { icon: Database, label: "Central de dados", path: "/data" },
  { icon: FileText, label: "Relatórios", path: "/reports" },
  { icon: Settings2, label: "Configurações", path: "/settings" },
];

function NavSection({ title, items, location, setLocation }: { title?: string; items: typeof primaryItems; location: string; setLocation: (path: string) => void }) {
  return (
    <SidebarMenu className="gap-1 px-3">
      {title ? <p className="px-2 pb-1 pt-4 text-[9px] font-bold uppercase tracking-[0.16em] text-[#718083] group-data-[collapsible=icon]:hidden">{title}</p> : null}
      {items.map((item) => {
        const active = location === item.path;
        return (
          <SidebarMenuItem key={item.path}>
            <SidebarMenuButton
              isActive={active}
              onClick={() => setLocation(item.path)}
              tooltip={item.label}
              className={`h-10 rounded-lg px-2.5 text-[#b8c5c6] transition-all hover:bg-white/7 hover:text-white data-[active=true]:bg-[#edf5ff] data-[active=true]:font-semibold data-[active=true]:text-[#1c3032] ${item.highlight && !active ? "bg-[#253234] text-[#e5f3f5]" : ""}`}
            >
              <item.icon className={`size-4 ${item.highlight && !active ? "text-[#a8cbef]" : ""}`} strokeWidth={active ? 2.2 : 1.9} />
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
  const workspaceName = organization?.name || "A carregar workspace";
  const workspaceDetail = organization?.isDemo ? "Dados de demonstração" : `${organization?.industry || "Organização"} · ${organization?.membershipRole || "membro"}`;

  return (
    <SidebarProvider defaultOpen={!isMobile}>
      <Sidebar collapsible="icon" className="border-0 bg-[#131a1b] text-[#dce8e8]">
        <SidebarHeader className="h-[78px] justify-center border-b border-white/[0.07] px-3">
          <QuanticoBrand className="px-1 text-white" />
        </SidebarHeader>
        <SidebarContent className="py-3">
          <NavSection items={primaryItems} location={location} setLocation={setLocation} />
          <NavSection title="Gestão" items={managementItems} location={location} setLocation={setLocation} />
        </SidebarContent>
        <SidebarFooter className="border-t border-white/[0.07] p-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex w-full items-center gap-2.5 rounded-xl p-1.5 text-left transition-colors hover:bg-white/[0.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9dc5ee] group-data-[collapsible=icon]:justify-center">
                <Avatar className="size-8 shrink-0 border border-white/10"><AvatarFallback className="bg-[#dbeafe] text-[10px] font-bold text-[#315d8d]">{initials}</AvatarFallback></Avatar>
                <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden"><p className="truncate text-xs font-semibold text-white">{displayName}</p><p className="mt-0.5 truncate text-[10px] text-[#839395]">{workspaceDetail}</p></div>
                <ChevronDown className="size-3.5 text-[#849496] group-data-[collapsible=icon]:hidden" />
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
      <SidebarInset className="min-h-screen bg-[#f1f4f5]">
        <header className="sticky top-0 z-20 flex h-[78px] items-center justify-between border-b border-[#dfe6e6] bg-[#f1f4f5]/90 px-4 backdrop-blur-md sm:px-7">
          <div className="flex min-w-0 items-center gap-3">
            <SidebarTrigger className="size-9 rounded-lg text-[#405052] hover:bg-white hover:text-[#111718]" aria-label="Abrir navegação"><Menu className="size-4" /></SidebarTrigger>
            <div className="hidden h-5 w-px bg-[#d9e0e0] sm:block" />
            <button onClick={() => setLocation("/settings")} className="hidden min-w-0 items-center gap-2 sm:flex"><span className="max-w-[220px] truncate text-sm font-bold tracking-[-0.04em] text-[#1d292a]">{workspaceName}</span><ChevronDown className="size-3.5 shrink-0 text-[#7f8e90]" /></button>
            {isMobile ? <QuanticoBrand compact className="text-[#172122]" /> : null}
          </div>
          <div className="flex items-center gap-2.5"><span className="hidden rounded-full border border-[#dce5e5] bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-[#6b7a7b] lg:inline-flex">Executive workspace</span><button className="relative flex size-9 items-center justify-center rounded-lg border border-[#dce4e4] bg-white text-[#526163] transition-colors hover:bg-[#edf5ff] hover:text-[#3977b9]" aria-label="Notificações"><Bell className="size-4" /><span className="absolute right-2 top-2 size-1.5 rounded-full bg-[#d78494]" /></button></div>
        </header>
        <main className="mx-auto w-full max-w-[1660px] flex-1 px-4 py-6 sm:px-7 sm:py-8">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
