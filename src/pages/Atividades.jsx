const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertCircle, Calendar } from "lucide-react";
import CommandBar from "@/components/crm/CommandBar";
import TimelineActivity from "@/components/crm/TimelineActivity";
import AtividadeErrorBoundary from "@/components/crm/AtividadeErrorBoundary";

// Logger estruturado para diagnosticar travamentos
const logger = {
  log: (event, data = {}) => {
    const timestamp = new Date().toISOString();
    console.log(`[ATIVIDADES_LOG] ${timestamp} - ${event}`, data);
  }
};

export default function AtividadesPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formError, setFormError] = useState("");
  const [formData, setFormData] = useState({
    tipo: "nota",
    assunto: "",
    descricao: "",
    data_atividade: new Date().toISOString().slice(0, 16),
    status: "concluido",
    contato_id: "",
    duracao_minutos: null
  });
  
  // Watchdog: detecta operações que demoram >10s
  const watchdogRef = useRef(null);
  const startTimeRef = useRef(null);

  const queryClient = useQueryClient();

  const { data: atividades = [], isLoading, refetch } = useQuery({
    queryKey: ['atividades'],
    queryFn: () => db.entities.Atividade.list('-data_atividade', 200),
  });

  const { data: contatos = [] } = useQuery({
    queryKey: ['contatos'],
    queryFn: () => db.entities.Contato.list(),
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      logger.log("API_START", { dataKeys: Object.keys(data) });
      startTimeRef.current = Date.now();
      
      // Inicia watchdog: se demorar >10s, força reset
      watchdogRef.current = setTimeout(() => {
        const elapsed = Date.now() - startTimeRef.current;
        logger.log("WATCHDOG_TRIGGERED", { elapsedMs: elapsed });
        setFormError("Operação demorou demais. Tente novamente.");
        // Force reset do estado de loading
        createMutation.reset?.();
      }, 10000);
      
      try {
        const result = await db.entities.Atividade.create(data);
        logger.log("API_OK", { resultId: result?.id });
        clearTimeout(watchdogRef.current);
        return result;
      } catch (error) {
        logger.log("API_FAIL", { 
          message: error.message,
          statusCode: error?.response?.status,
          elapsedMs: Date.now() - startTimeRef.current
        });
        clearTimeout(watchdogRef.current);
        throw error;
      }
    },
    onSuccess: () => {
      logger.log("MUTATION_SUCCESS");
      queryClient.invalidateQueries({ queryKey: ['atividades'] });
      setIsDialogOpen(false);
      setFormError("");
      resetForm();
    },
    onError: (error) => {
      logger.log("MUTATION_ERROR", { message: error.message });
      const errorMessage = error?.response?.data?.message || error.message || "Erro ao salvar atividade";
      setFormError(errorMessage);
    },
  });

  const resetForm = () => {
    setFormData({
      tipo: "nota",
      assunto: "",
      descricao: "",
      data_atividade: new Date().toISOString().slice(0, 16),
      status: "concluido",
      contato_id: "",
      duracao_minutos: null
    });
    setFormError("");
  };

  const validateForm = () => {
    if (!formData.assunto?.trim()) {
      setFormError("Assunto é obrigatório");
      return false;
    }
    if (!formData.data_atividade) {
      setFormError("Data e hora são obrigatórias");
      return false;
    }
    if (formData.duracao_minutos !== null && formData.duracao_minutos !== "") {
      const dur = Number(formData.duracao_minutos);
      if (isNaN(dur) || dur < 0) {
        setFormError("Duração deve ser um número válido");
        return false;
      }
    }
    setFormError("");
    return true;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const submitData = {
      ...formData,
      contato_id: formData.contato_id || undefined,
      duracao_minutos: formData.duracao_minutos !== null && formData.duracao_minutos !== "" ? Number(formData.duracao_minutos) : undefined,
    };
    
    createMutation.mutate(submitData);
  };

  // Reseta form ao abrir modal
  useEffect(() => {
    if (isDialogOpen) {
      resetForm();
    }
  }, [isDialogOpen]);

  // Limpa watchdog ao desmontar
  useEffect(() => {
    return () => {
      clearTimeout(watchdogRef.current);
    };
  }, []);

  return (
    <AtividadeErrorBoundary>
      <div className="min-h-screen bg-[#f3f2f1]">
      {/* Page Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-[#323130]">Atividades</h1>
            <p className="text-sm text-[#605e5c] mt-1">
              Timeline de todas as interações
            </p>
          </div>
        </div>
      </div>

      {/* Command Bar */}
      <CommandBar
        onNew={() => {
          logger.log("BUTTON_NEW_CLICK");
          setIsDialogOpen(true);
        }}
        onRefresh={refetch}
      />

      {/* Timeline */}
      <div className="p-6 max-w-5xl mx-auto">
        {atividades.length > 0 ? (
          <div className="space-y-1">
            {atividades.map((atividade) => (
              <TimelineActivity key={atividade.id} atividade={atividade} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
            <Calendar className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">Nenhuma atividade registrada</p>
            <Button 
              onClick={() => setIsDialogOpen(true)}
              className="mt-4 bg-[#0f6cbd] hover:bg-[#0d5ba8]"
            >
              Registrar Primeira Atividade
            </Button>
          </div>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(newOpen) => {
        if (createMutation.isPending && !newOpen) return;
        setIsDialogOpen(newOpen);
      }}>
        <DialogContent className="max-w-2xl z-50">
          <DialogHeader>
            <DialogTitle>Nova Atividade</DialogTitle>
            <DialogDescription>Preencha os dados da atividade abaixo.</DialogDescription>
          </DialogHeader>
          {formError && (
            <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-md">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-800">Erro ao salvar</p>
                <p className="text-sm text-red-700">{formError}</p>
              </div>
            </div>
          )}
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-4 py-4">
              <div>
                <Label htmlFor="tipo">Tipo *</Label>
                <select
                  id="tipo"
                  value={formData.tipo}
                  onChange={(e) => setFormData({...formData, tipo: e.target.value})}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                >
                  <option value="chamada">Chamada Telefônica</option>
                  <option value="email">E-mail</option>
                  <option value="reuniao">Reunião</option>
                  <option value="tarefa">Tarefa</option>
                  <option value="nota">Nota</option>
                  <option value="atualizacao">Atualização</option>
                </select>
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                >
                  <option value="agendado">Agendado</option>
                  <option value="concluido">Concluído</option>
                  <option value="cancelado">Cancelado</option>
                </select>
              </div>
              <div className="col-span-2">
                <Label>Assunto *</Label>
                <Input
                  value={formData.assunto}
                  onChange={(e) => setFormData({...formData, assunto: e.target.value})}
                  placeholder="Ex: Ligação de follow-up"
                  required
                />
              </div>
              <div className="col-span-2">
                <Label>Descrição</Label>
                <Textarea
                  value={formData.descricao}
                  onChange={(e) => setFormData({...formData, descricao: e.target.value})}
                  placeholder="Detalhes da atividade..."
                  rows={4}
                />
              </div>
              <div className="col-span-2">
                <Label>Contato Relacionado</Label>
                <select
                  id="contato_id"
                  value={formData.contato_id || ""}
                  onChange={(e) => setFormData({...formData, contato_id: e.target.value})}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                >
                  <option value="">Selecione um contato (opcional)</option>
                  {contatos.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.nome} {c.sobrenome}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Data e Hora</Label>
                <Input
                  type="datetime-local"
                  value={formData.data_atividade}
                  onChange={(e) => setFormData({...formData, data_atividade: e.target.value})}
                />
              </div>
              <div>
                <Label>Duração (minutos)</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.duracao_minutos ?? ''}
                  onChange={(e) => setFormData({...formData, duracao_minutos: e.target.value ? parseInt(e.target.value) : null})}
                  placeholder="30"
                />
              </div>
            </div>
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  logger.log("BUTTON_CANCEL_CLICK", { isPending: createMutation.isPending });
                  if (!createMutation.isPending) {
                    setIsDialogOpen(false);
                    resetForm();
                  }
                }}
                disabled={createMutation.isPending}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                className="bg-[#0f6cbd] hover:bg-[#0d5ba8]"
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
    </AtividadeErrorBoundary>
  );
}