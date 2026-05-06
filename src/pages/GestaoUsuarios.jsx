const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { UserPlus, Shield, Users, Pencil } from "lucide-react";

const ALL_PAGES = [
  { page: "Dashboard", label: "Home / Dashboard", group: "Geral" },
  { page: "Atividades", label: "Atividades", group: "Geral" },
  { page: "Leads", label: "Leads", group: "Cliente" },
  { page: "Contatos", label: "Contatos", group: "Cliente" },
  { page: "UnidadesConsumidoras", label: "Unidades Consumidoras", group: "Vendas" },
  { page: "Usinas", label: "Usinas", group: "Vendas" },
  { page: "AnaliseUsinas", label: "Análise de Usinas", group: "Vendas" },
  { page: "Propostas", label: "Propostas", group: "Vendas" },
  { page: "Contratos", label: "Contratos", group: "Vendas" },
  { page: "Financeiro", label: "Financeiro", group: "Vendas" },
  { page: "Automacao", label: "Automação", group: "Vendas" },
  { page: "Oportunidades", label: "Oportunidades", group: "Acompanhamento" },
  { page: "Relatorios", label: "Relatórios", group: "Acompanhamento" },
];

const GROUPS = ["Geral", "Cliente", "Vendas", "Acompanhamento"];

export default function GestaoUsuarios() {
  const [inviteOpen, setInviteOpen] = useState(false);
  const [permOpen, setPermOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [selectedPages, setSelectedPages] = useState([]);

  const queryClient = useQueryClient();

  const { data: users = [], isLoading: loadingUsers } = useQuery({
    queryKey: ["users"],
    queryFn: () => db.entities.User.list(),
  });

  const { data: permissions = [] } = useQuery({
    queryKey: ["user_permissions"],
    queryFn: () => db.entities.UserPermission.list(),
  });

  const savePerm = useMutation({
    mutationFn: async ({ userEmail, pages }) => {
      const existing = permissions.find((p) => p.user_email === userEmail);
      if (existing) {
        return db.entities.UserPermission.update(existing.id, { paginas_permitidas: pages });
      } else {
        return db.entities.UserPermission.create({ user_email: userEmail, paginas_permitidas: pages });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user_permissions"] });
      setPermOpen(false);
    },
  });

  const handleInvite = async (e) => {
    e.preventDefault();
    setInviteLoading(true);
    await db.users.inviteUser(inviteEmail, "user");
    setInviteEmail("");
    setInviteLoading(false);
    setInviteOpen(false);
    queryClient.invalidateQueries({ queryKey: ["users"] });
  };

  const openPermissions = (user) => {
    const perm = permissions.find((p) => p.user_email === user.email);
    setSelectedPages(perm?.paginas_permitidas ?? ALL_PAGES.map((p) => p.page));
    setSelectedUser(user);
    setPermOpen(true);
  };

  const togglePage = (page) => {
    setSelectedPages((prev) =>
      prev.includes(page) ? prev.filter((p) => p !== page) : [...prev, page]
    );
  };

  const toggleAll = () => {
    if (selectedPages.length === ALL_PAGES.length) {
      setSelectedPages([]);
    } else {
      setSelectedPages(ALL_PAGES.map((p) => p.page));
    }
  };

  const getPermCount = (email) => {
    const perm = permissions.find((p) => p.user_email === email);
    return perm ? perm.paginas_permitidas?.length ?? ALL_PAGES.length : ALL_PAGES.length;
  };

  return (
    <div className="min-h-screen bg-[#f3f2f1]">
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-emerald-600" />
            <div>
              <h1 className="text-xl font-semibold text-[#323130]">Gestão de Usuários</h1>
              <p className="text-sm text-[#605e5c] mt-0.5">Administre acessos e permissões do sistema</p>
            </div>
          </div>
          <Button onClick={() => setInviteOpen(true)} className="bg-[#0f6cbd] hover:bg-[#0d5ba8] gap-2">
            <UserPlus className="w-4 h-4" />
            Convidar Usuário
          </Button>
        </div>
      </div>

      <div className="p-6">
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-400" />
            <span className="text-sm font-medium text-slate-700">{users.length} usuários cadastrados</span>
          </div>
          {loadingUsers ? (
            <div className="p-8 text-center text-slate-400 text-sm">Carregando...</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Usuário</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Papel</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Acessos</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-xs font-bold">
                          {user.full_name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{user.full_name || "—"}</p>
                          <p className="text-xs text-slate-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={user.role === "admin" ? "bg-purple-100 text-purple-700 border-purple-200" : "bg-blue-100 text-blue-700 border-blue-200"}>
                        {user.role === "admin" ? "Admin" : "Usuário"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      {user.role === "admin" ? (
                        <span className="text-xs text-slate-400 italic">Acesso total</span>
                      ) : (
                        <span className="text-xs text-slate-600">{getPermCount(user.email)} de {ALL_PAGES.length} abas</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {user.role !== "admin" && (
                        <Button size="sm" variant="outline" onClick={() => openPermissions(user)} className="gap-1.5">
                          <Pencil className="w-3 h-3" />
                          Permissões
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Invite Dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Convidar Usuário</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleInvite}>
            <div className="py-4 space-y-3">
              <div>
                <Label>E-mail *</Label>
                <Input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="usuario@empresa.com"
                  required
                  className="mt-1"
                />
              </div>
              <p className="text-xs text-slate-500">O usuário receberá um e-mail com o convite de acesso. Após o cadastro, configure as permissões de acesso às abas.</p>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setInviteOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={inviteLoading} className="bg-[#0f6cbd] hover:bg-[#0d5ba8]">
                {inviteLoading ? "Enviando..." : "Enviar Convite"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Permissions Dialog */}
      <Dialog open={permOpen} onOpenChange={setPermOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Permissões — {selectedUser?.full_name || selectedUser?.email}</DialogTitle>
          </DialogHeader>
          <div className="py-3 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b">
              <span className="text-sm text-slate-500">{selectedPages.length} de {ALL_PAGES.length} abas selecionadas</span>
              <Button size="sm" variant="outline" onClick={toggleAll} className="text-xs">
                {selectedPages.length === ALL_PAGES.length ? "Desmarcar tudo" : "Marcar tudo"}
              </Button>
            </div>
            {GROUPS.map((group) => (
              <div key={group}>
                <p className="text-xs font-semibold text-slate-400 uppercase mb-2">{group}</p>
                <div className="space-y-2">
                  {ALL_PAGES.filter((p) => p.group === group).map((p) => (
                    <div key={p.page} className="flex items-center gap-3 p-2 rounded hover:bg-slate-50">
                      <Checkbox
                        id={p.page}
                        checked={selectedPages.includes(p.page)}
                        onCheckedChange={() => togglePage(p.page)}
                      />
                      <label htmlFor={p.page} className="text-sm text-slate-700 cursor-pointer select-none">
                        {p.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setPermOpen(false)}>Cancelar</Button>
            <Button
              onClick={() => savePerm.mutate({ userEmail: selectedUser.email, pages: selectedPages })}
              disabled={savePerm.isPending}
              className="bg-[#0f6cbd] hover:bg-[#0d5ba8]"
            >
              {savePerm.isPending ? "Salvando..." : "Salvar Permissões"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}