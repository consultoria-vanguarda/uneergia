const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "./utils";
import {
  Home,
  Users,
  Target,
  Calendar,
  BarChart3,
  DollarSign,
  Settings,
  ChevronRight,
  Search,
  Bell,
  HelpCircle,
  Grid3x3,
  LogOut,
  Sun,
  UserPlus,
  FileText,
  FileCheck,
  Zap,
  ShieldCheck,
  Menu,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const ALL_NAVIGATION_GROUPS = [
  {
    title: "Geral",
    items: [
      { name: "Home", page: "Dashboard", icon: Home },
      { name: "Atividades", page: "Atividades", icon: Calendar },
    ]
  },
  {
    title: "Cliente",
    items: [
      { name: "Leads", page: "Leads", icon: UserPlus },
      { name: "Contatos", page: "Contatos", icon: Users },
    ]
  },
  {
    title: "Vendas",
    items: [
      { name: "Unidades Consumidoras", page: "UnidadesConsumidoras", icon: Zap },
      { name: "Usinas", page: "Usinas", icon: Sun },
      { name: "Análise de Usinas", page: "AnaliseUsinas", icon: BarChart3 },
      { name: "Propostas", page: "Propostas", icon: FileText },
      { name: "Contratos", page: "Contratos", icon: FileCheck },
      { name: "Financeiro", page: "Financeiro", icon: DollarSign },
      { name: "Automação", page: "Automacao", icon: Zap },
    ]
  },
  {
    title: "Acompanhamento",
    items: [
      { name: "Oportunidades", page: "Oportunidades", icon: Target },
      { name: "Relatórios", page: "Relatorios", icon: BarChart3 },
    ]
  }
];

export default function Layout({ children, currentPageName }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState({
    "Geral": true,
    "Cliente": true,
    "Vendas": true,
    "Acompanhamento": true,
    "Admin": true
  });
  const [currentUser, setCurrentUser] = useState(null);
  const [allowedPages, setAllowedPages] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    db.auth.me().then((user) => {
      setCurrentUser(user);
      if (user?.role !== "admin") {
        db.entities.UserPermission.filter({ user_email: user.email }).then((perms) => {
          if (perms && perms.length > 0) {
            setAllowedPages(perms[0].paginas_permitidas || []);
          } else {
            setAllowedPages(null);
          }
        });
      }
    }).catch(() => {});
  }, []);

  const isAdmin = currentUser?.role === "admin";

  const navigationGroups = ALL_NAVIGATION_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => {
      if (isAdmin) return true;
      if (allowedPages === null) return true;
      return allowedPages.includes(item.page);
    })
  })).filter((group) => group.items.length > 0);

  const toggleGroup = (groupTitle) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupTitle]: !prev[groupTitle]
    }));
  };

  const SidebarContent = ({ onLinkClick }) => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="h-12 bg-gradient-to-r from-emerald-600 to-teal-600 flex items-center px-3">
        <button
          onClick={() => { setCollapsed(!collapsed); }}
          className="w-6 h-6 hidden md:flex items-center justify-center text-white hover:bg-white/10 rounded"
        >
          <Grid3x3 className="w-4 h-4" />
        </button>
        <button
          onClick={() => setMobileOpen(false)}
          className="w-6 h-6 flex md:hidden items-center justify-center text-white hover:bg-white/10 rounded"
        >
          <X className="w-4 h-4" />
        </button>
        {!collapsed && (
          <span className="ml-2 text-white font-semibold text-sm">UneEnergia</span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2">
        {navigationGroups.map((group) => (
          <div key={group.title} className="mb-1">
            {!collapsed && (
              <button
                onClick={() => toggleGroup(group.title)}
                className="w-full px-3 py-1.5 text-xs font-semibold text-[#323130] hover:bg-[#edebe9] flex items-center justify-between"
              >
                <span>{group.title}</span>
                <ChevronRight
                  className={`w-3 h-3 transition-transform ${expandedGroups[group.title] ? 'rotate-90' : ''}`}
                />
              </button>
            )}
            {(collapsed || expandedGroups[group.title]) && (
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentPageName === item.page;
                  return (
                    <Link
                      key={item.page}
                      to={createPageUrl(item.page)}
                      onClick={onLinkClick}
                      className={`flex items-center gap-3 px-3 py-2 text-sm transition-colors ${
                        isActive
                          ? 'bg-[#edebe9] text-[#323130] border-l-2 border-emerald-600 font-medium'
                          : 'text-[#605e5c] hover:bg-[#edebe9]'
                      }`}
                      title={collapsed ? item.name : undefined}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      {!collapsed && <span>{item.name}</span>}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* Admin links */}
      <div className="p-2 border-t border-[#edebe9] space-y-0.5">
        {isAdmin && (
          <Link
            to={createPageUrl("GestaoUsuarios")}
            onClick={onLinkClick}
            className={`flex items-center gap-2 px-3 py-2 text-xs rounded transition-colors ${
              currentPageName === "GestaoUsuarios"
                ? "bg-[#edebe9] text-[#323130] border-l-2 border-emerald-600 font-medium"
                : "text-[#605e5c] hover:bg-[#edebe9]"
            }`}
            title={collapsed ? "Gestão de Usuários" : undefined}
          >
            <ShieldCheck className="w-4 h-4 flex-shrink-0" />
            {!collapsed && "Gestão de Usuários"}
          </Link>
        )}
        {!collapsed && (
          <Link
            to={createPageUrl("IntegracaoDynamics")}
            onClick={onLinkClick}
            className="flex items-center gap-2 px-3 py-2 text-xs text-[#605e5c] hover:bg-[#edebe9] rounded"
          >
            <Settings className="w-4 h-4" />
            Dynamics 365
          </Link>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f3f2f1] flex" translate="no">

      {/* Mobile overlay backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar - Desktop */}
      <aside className={`${collapsed ? 'w-12' : 'w-56'} bg-[#f3f2f1] border-r border-[#edebe9] fixed left-0 top-0 bottom-0 transition-all duration-300 z-40 hidden md:flex flex-col`}>
        <SidebarContent onLinkClick={undefined} />
      </aside>

      {/* Sidebar - Mobile Drawer */}
      <aside className={`w-72 bg-[#f3f2f1] border-r border-[#edebe9] fixed left-0 top-0 bottom-0 z-40 flex flex-col md:hidden transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <SidebarContent onLinkClick={() => setMobileOpen(false)} />
      </aside>

      {/* Main Content Area */}
      <div
        className="flex-1 transition-all duration-300"
        style={{ marginLeft: isMobile ? 0 : (collapsed ? '3rem' : '14rem') }}
      >
        {/* Top Bar */}
        <header
          className="h-12 bg-white border-b border-[#edebe9] flex items-center px-4 fixed top-0 right-0 left-0 z-30"
          style={{ marginLeft: isMobile ? 0 : (collapsed ? '3rem' : '14rem') }}
        >
          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(true)}
            className="md:hidden mr-3 hover:bg-[#f3f2f1] p-3 rounded text-[#605e5c]"
          >
            <Menu className="w-6 h-6" />
          </button>

          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className="w-7 h-7 flex-shrink-0 rounded bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <Sun className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-sm text-[#323130] truncate">UneEnergia - Créditos Solares</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="hover:bg-[#f3f2f1] p-1.5 rounded text-[#605e5c]"
            >
              <Search className="w-4 h-4" />
            </button>
            <button className="hover:bg-[#f3f2f1] p-1.5 rounded relative text-[#605e5c] hidden sm:flex">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <button className="hover:bg-[#f3f2f1] p-1.5 rounded text-[#605e5c] hidden sm:flex">
              <HelpCircle className="w-4 h-4" />
            </button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-7 h-7 rounded-full bg-emerald-600 hover:bg-emerald-700 flex items-center justify-center text-xs font-semibold text-white">
                  {currentUser?.full_name?.charAt(0)?.toUpperCase() || currentUser?.email?.charAt(0)?.toUpperCase() || "U"}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Settings className="w-4 h-4 mr-2" />
                  Configurações
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => db.auth.logout()}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Search Bar Overlay */}
        {searchOpen && (
          <div className="fixed top-12 left-0 right-0 bg-white border-b shadow-lg z-20 p-4">
            <div className="max-w-3xl mx-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  placeholder="Pesquisar registros, contatos, oportunidades..."
                  className="pl-10 h-11 border-slate-300"
                  autoFocus
                />
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <main className="pt-12">
          {children}
        </main>
      </div>
    </div>
  );
}