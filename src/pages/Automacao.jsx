const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Zap, 
  Plus, 
  Mail, 
  Clock, 
  Users, 
  CheckCircle2,
  Play,
  Pause,
  Edit,
  Trash2
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function Automacao() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("workflows");
  const queryClient = useQueryClient();

  const [workflowData, setWorkflowData] = useState({
    nome: "",
    descricao: "",
    entidade_alvo: "Lead",
    trigger_condicao: "status_change",
    trigger_status: "novo",
    delay_dias: 0,
    ativo: true,
    acoes: []
  });

  const [templateData, setTemplateData] = useState({
    nome: "",
    tipo: "email",
    assunto: "",
    corpo: "",
    estagio_vendas: "lead_novo",
    categoria: "follow_up"
  });

  const { data: workflows = [] } = useQuery({
    queryKey: ['workflows'],
    queryFn: () => db.entities.FollowUpWorkflow.list('-created_date'),
  });

  const { data: templates = [] } = useQuery({
    queryKey: ['templates'],
    queryFn: () => db.entities.FollowUpTemplate.list('-created_date'),
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['followup-tasks'],
    queryFn: () => db.entities.FollowUpTask.list('-data_agendada', 50),
  });

  const createWorkflowMutation = useMutation({
    mutationFn: (data) => db.entities.FollowUpWorkflow.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['workflows']);
      setDialogOpen(false);
      resetWorkflowForm();
    },
  });

  const createTemplateMutation = useMutation({
    mutationFn: (data) => db.entities.FollowUpTemplate.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['templates']);
      setTemplateDialogOpen(false);
      resetTemplateForm();
    },
  });

  const toggleWorkflowMutation = useMutation({
    mutationFn: ({ id, ativo }) => db.entities.FollowUpWorkflow.update(id, { ativo }),
    onSuccess: () => {
      queryClient.invalidateQueries(['workflows']);
    },
  });

  const deleteWorkflowMutation = useMutation({
    mutationFn: (id) => db.entities.FollowUpWorkflow.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['workflows']);
    },
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: (id) => db.entities.FollowUpTemplate.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['templates']);
    },
  });

  const resetWorkflowForm = () => {
    setWorkflowData({
      nome: "",
      descricao: "",
      entidade_alvo: "Lead",
      trigger_condicao: "status_change",
      trigger_status: "novo",
      delay_dias: 0,
      ativo: true,
      acoes: []
    });
  };

  const resetTemplateForm = () => {
    setTemplateData({
      nome: "",
      tipo: "email",
      assunto: "",
      corpo: "",
      estagio_vendas: "lead_novo",
      categoria: "follow_up"
    });
  };

  const handleSubmitWorkflow = (e) => {
    e.preventDefault();
    createWorkflowMutation.mutate(workflowData);
  };

  const handleSubmitTemplate = (e) => {
    e.preventDefault();
    createTemplateMutation.mutate(templateData);
  };

  const addAcao = () => {
    setWorkflowData({
      ...workflowData,
      acoes: [
        ...workflowData.acoes,
        { tipo: "email", delay_dias: 1 }
      ]
    });
  };

  const updateAcao = (index, field, value) => {
    const newAcoes = [...workflowData.acoes];
    newAcoes[index] = { ...newAcoes[index], [field]: value };
    setWorkflowData({ ...workflowData, acoes: newAcoes });
  };

  const removeAcao = (index) => {
    setWorkflowData({
      ...workflowData,
      acoes: workflowData.acoes.filter((_, i) => i !== index)
    });
  };

  const pendingTasks = tasks.filter(t => t.status === 'pendente');

  return (
    <div className="min-h-screen bg-[#f3f2f1]">
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-[#323130] flex items-center gap-2">
              <Zap className="w-5 h-5 text-emerald-600" />
              Automação de Follow-up
            </h1>
            <p className="text-sm text-[#605e5c] mt-1">
              Gerencie workflows, templates e tarefas automáticas
            </p>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Workflows Ativos</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">
                    {workflows.filter(w => w.ativo).length}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                  <Zap className="w-6 h-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Templates</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{templates.length}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <Mail className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Tarefas Pendentes</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{pendingTasks.length}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="workflows">Workflows</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="tasks">Tarefas</TabsTrigger>
          </TabsList>

          <TabsContent value="workflows">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Workflows de Follow-up</CardTitle>
                <Button onClick={() => setDialogOpen(true)} className="bg-emerald-600 hover:bg-emerald-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Workflow
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {workflows.map((workflow) => (
                    <div key={workflow.id} className="border rounded-lg p-4 hover:bg-slate-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <h3 className="font-semibold text-slate-900">{workflow.nome}</h3>
                            <Badge variant={workflow.ativo ? "default" : "secondary"} className={workflow.ativo ? "bg-emerald-500" : ""}>
                              {workflow.ativo ? "Ativo" : "Inativo"}
                            </Badge>
                            <Badge variant="outline">{workflow.entidade_alvo}</Badge>
                          </div>
                          <p className="text-sm text-slate-600 mt-1">{workflow.descricao}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                            <span>Trigger: {workflow.trigger_condicao}</span>
                            {workflow.trigger_status && <span>Status: {workflow.trigger_status}</span>}
                            {workflow.delay_dias > 0 && <span>Delay: {workflow.delay_dias} dias</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => toggleWorkflowMutation.mutate({ id: workflow.id, ativo: !workflow.ativo })}
                          >
                            {workflow.ativo ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteWorkflowMutation.mutate(workflow.id)}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {workflows.length === 0 && (
                    <p className="text-center text-slate-500 py-8">Nenhum workflow criado</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="templates">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Templates de Comunicação</CardTitle>
                <Button onClick={() => setTemplateDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Template
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {templates.map((template) => (
                    <div key={template.id} className="border rounded-lg p-4 hover:bg-slate-50 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-blue-600" />
                          <h3 className="font-semibold text-slate-900">{template.nome}</h3>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteTemplateMutation.mutate(template.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                      <div className="flex gap-2 mb-2">
                        <Badge variant="outline">{template.tipo}</Badge>
                        <Badge variant="outline">{template.categoria}</Badge>
                      </div>
                      {template.assunto && (
                        <p className="text-sm font-medium text-slate-700 mb-1">{template.assunto}</p>
                      )}
                      <p className="text-xs text-slate-600 line-clamp-2">{template.corpo}</p>
                    </div>
                  ))}
                  {templates.length === 0 && (
                    <p className="col-span-2 text-center text-slate-500 py-8">Nenhum template criado</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tasks">
            <Card>
              <CardHeader>
                <CardTitle>Tarefas de Follow-up</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {tasks.map((task) => (
                    <div key={task.id} className="border rounded-lg p-4 hover:bg-slate-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                            task.status === 'concluida' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
                          }`}>
                            {task.status === 'concluida' ? <CheckCircle2 className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-slate-900">{task.titulo}</h3>
                            <p className="text-sm text-slate-600 mt-1">{task.descricao}</p>
                            <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                              <span>{task.entidade_tipo}: {task.entidade_nome}</span>
                              <span>Agendado: {new Date(task.data_agendada).toLocaleDateString('pt-BR')}</span>
                              {task.atribuido_para && <span>Para: {task.atribuido_para}</span>}
                            </div>
                          </div>
                        </div>
                        <Badge variant={task.prioridade === 'alta' ? 'destructive' : 'outline'}>
                          {task.prioridade}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {tasks.length === 0 && (
                    <p className="text-center text-slate-500 py-8">Nenhuma tarefa agendada</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialog Workflow */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Criar Workflow de Follow-up</DialogTitle>
            <DialogDescription>Configure o workflow abaixo.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitWorkflow}>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nome do Workflow *</Label>
                  <Input
                    value={workflowData.nome}
                    onChange={(e) => setWorkflowData({...workflowData, nome: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label>Entidade Alvo *</Label>
                  <select value={workflowData.entidade_alvo} onChange={(e) => setWorkflowData({...workflowData, entidade_alvo: e.target.value})} className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm">
                    <option value="Lead">Lead</option>
                    <option value="Contato">Contato</option>
                    <option value="Oportunidade">Oportunidade</option>
                  </select>
                </div>
              </div>

              <div>
                <Label>Descrição</Label>
                <Textarea
                  value={workflowData.descricao}
                  onChange={(e) => setWorkflowData({...workflowData, descricao: e.target.value})}
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Condição de Disparo</Label>
                  <select value={workflowData.trigger_condicao} onChange={(e) => setWorkflowData({...workflowData, trigger_condicao: e.target.value})} className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm">
                    <option value="status_change">Mudança de Status</option>
                    <option value="time_based">Baseado em Tempo</option>
                    <option value="manual">Manual</option>
                  </select>
                </div>
                <div>
                  <Label>Status Trigger</Label>
                  <Input
                    value={workflowData.trigger_status}
                    onChange={(e) => setWorkflowData({...workflowData, trigger_status: e.target.value})}
                    placeholder="ex: novo, qualificado"
                  />
                </div>
                <div>
                  <Label>Delay (dias)</Label>
                  <Input
                    type="number"
                    value={workflowData.delay_dias}
                    onChange={(e) => setWorkflowData({...workflowData, delay_dias: parseInt(e.target.value) || 0})}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Ações do Workflow</Label>
                  <Button type="button" size="sm" variant="outline" onClick={addAcao}>
                    <Plus className="w-4 h-4 mr-1" />
                    Adicionar Ação
                  </Button>
                </div>
                <div className="space-y-2">
                  {workflowData.acoes.map((acao, index) => (
                    <div key={index} className="border rounded p-3 flex items-center gap-2">
                      <select value={acao.tipo} onChange={(e) => updateAcao(index, 'tipo', e.target.value)} className="w-32 h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm">
                        <option value="email">Email</option>
                        <option value="tarefa">Tarefa</option>
                        <option value="notificacao">Notificação</option>
                      </select>
                      <Input
                        placeholder="Delay (dias)"
                        type="number"
                        className="w-28"
                        value={acao.delay_dias || 0}
                        onChange={(e) => updateAcao(index, 'delay_dias', parseInt(e.target.value) || 0)}
                      />
                      <Input
                        placeholder="Atribuir para (email)"
                        className="flex-1"
                        value={acao.atribuir_para || ''}
                        onChange={(e) => updateAcao(index, 'atribuir_para', e.target.value)}
                      />
                      <Button type="button" size="sm" variant="ghost" onClick={() => removeAcao(index)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
                Criar Workflow
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Template */}
      <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Criar Template de Comunicação</DialogTitle>
            <DialogDescription>Configure o template de comunicação abaixo.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitTemplate}>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nome do Template *</Label>
                  <Input
                    value={templateData.nome}
                    onChange={(e) => setTemplateData({...templateData, nome: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label>Tipo *</Label>
                  <select value={templateData.tipo} onChange={(e) => setTemplateData({...templateData, tipo: e.target.value})} className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm">
                    <option value="email">Email</option>
                    <option value="sms">SMS</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Estágio de Vendas</Label>
                  <select value={templateData.estagio_vendas} onChange={(e) => setTemplateData({...templateData, estagio_vendas: e.target.value})} className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm">
                    <option value="lead_novo">Lead Novo</option>
                    <option value="qualificacao">Qualificação</option>
                    <option value="proposta">Proposta</option>
                    <option value="negociacao">Negociação</option>
                    <option value="fechamento">Fechamento</option>
                  </select>
                </div>
                <div>
                  <Label>Categoria</Label>
                  <select value={templateData.categoria} onChange={(e) => setTemplateData({...templateData, categoria: e.target.value})} className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm">
                    <option value="boas_vindas">Boas-vindas</option>
                    <option value="follow_up">Follow-up</option>
                    <option value="proposta">Proposta</option>
                    <option value="lembrete">Lembrete</option>
                    <option value="agradecimento">Agradecimento</option>
                  </select>
                </div>
              </div>

              {templateData.tipo === 'email' && (
                <div>
                  <Label>Assunto do Email *</Label>
                  <Input
                    value={templateData.assunto}
                    onChange={(e) => setTemplateData({...templateData, assunto: e.target.value})}
                    placeholder="Use variáveis: {{nome}}, {{empresa}}"
                  />
                </div>
              )}

              <div>
                <Label>Corpo da Mensagem *</Label>
                <Textarea
                  value={templateData.corpo}
                  onChange={(e) => setTemplateData({...templateData, corpo: e.target.value})}
                  rows={8}
                  placeholder="Use variáveis: {{nome}}, {{empresa}}, {{telefone}}"
                  required
                />
                <p className="text-xs text-slate-500 mt-1">
                  Variáveis disponíveis: {'{{nome}}'}, {'{{empresa}}'}, {'{{telefone}}'}, {'{{email}}'}
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setTemplateDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                Criar Template
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}