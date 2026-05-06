const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { toast } from "@/components/ui/use-toast";

export function useQualifyLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (leadId) => {
      const response = await db.functions.invoke("qualifyLead", { leadId });
      return response.data ?? response;
    },

    // ── Optimistic update: remove lead da lista imediatamente ──
    onMutate: async (leadId) => {
      await queryClient.cancelQueries({ queryKey: ["leads"] });
      const previousLeads = queryClient.getQueryData(["leads"]);

      queryClient.setQueryData(["leads"], (old) =>
        Array.isArray(old) ? old.filter((lead) => lead.id !== leadId) : []
      );

      return { previousLeads };
    },

    // ── Rollback em caso de erro ──
    onError: (error, _leadId, context) => {
      if (context?.previousLeads) {
        queryClient.setQueryData(["leads"], context.previousLeads);
      }
      toast({
        title: "Erro ao qualificar",
        description: error?.message || "Não foi possível qualificar o lead.",
        variant: "destructive",
      });
    },

    // ── Toast de sucesso ──
    onSuccess: (data) => {
      const messages = {
        created: "Novo cliente criado com sucesso.",
        linked: "Lead vinculado a cliente existente.",
        updated: "Cliente existente atualizado com dados do lead.",
        already_qualified: "Este lead já havia sido qualificado.",
      };

      toast({
        title: "Lead qualificado",
        description: messages[data?.action] || "Lead qualificado com sucesso.",
      });
    },

    // ── Revalidar caches ──
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["contatos"] });
    },
  });
}
