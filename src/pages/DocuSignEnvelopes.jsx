const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Send, RefreshCw, Download, X, FileText, Clock, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../utils";
import DataGrid from "@/components/crm/DataGrid";
import CommandBar from "@/components/crm/CommandBar";

export default function DocuSignEnvelopes() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedEnvelope, setSelectedEnvelope] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const { data: envelopes = [], isLoading, refetch } = useQuery({
    queryKey: ['docusign-envelopes'],
    queryFn: () => db.entities.DocusignEnvelope.list('-created_date', 200),
  });

  const statusColors = {
    created: "bg-slate-100 text-slate-700",
    sent: "bg-blue-100 text-blue-700",
    delivered: "bg-amber-100 text-amber-700",
    completed: "bg-emerald-100 text-emerald-700",
    declined: "bg-red-100 text-red-700",
    voided: "bg-slate-100 text-slate-700"
  };

  const statusIcons = {
    created: Clock,
    sent: Send,
    delivered: Clock,
    completed: CheckCircle,
    declined: XCircle,
    voided: X
  };

  const updateStatus = async (envelope) => {
    setIsUpdating(true);
    try {
      await db.functions.invoke('docusignGetStatus', {
        envelopeId: envelope.envelopeId,
        envelopeDbId: envelope.id
      });
      
      queryClient.invalidateQueries(['docusign-envelopes']);
      if (selectedEnvelope?.id === envelope.id) {
        const updated = await db.entities.DocusignEnvelope.list();
        setSelectedEnvelope(updated.find(e => e.id === envelope.id));
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const downloadDocument = async (envelope) => {
    setIsDownloading(true);
    try {
      const { data } = await db.functions.invoke('docusignDownloadDocument', {
        envelopeId: envelope.envelopeId,
        envelopeDbId: envelope.id
      });
      
      if (data.success) {
        window.open(data.fileUrl, '_blank');
        queryClient.invalidateQueries(['docusign-envelopes']);
      }
    } catch (error) {
      console.error('Erro ao baixar documento:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  const voidEnvelope = async (envelope) => {
    if (!confirm('Deseja cancelar este envelope?')) return;
    
    try {
      await db.functions.invoke('docusignVoidEnvelope', {
        envelopeId: envelope.envelopeId,
        envelopeDbId: envelope.id,
        reason: 'Cancelado pelo usuário'
      });
      
      queryClient.invalidateQueries(['docusign-envelopes']);
      setSelectedEnvelope(null);
    } catch (error) {
      console.error('Erro ao cancelar envelope:', error);
    }
  };

  const filteredEnvelopes = envelopes.filter(e =>
    e.subject?.toLowerCase().includes(search.toLowerCase()) ||
    e.envelopeId?.includes(search)
  );

  const columns = [
    {
      header: "Assunto",
      key: "subject",
      sortable: true,
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <p className="font-medium text-slate-900">{row.subject}</p>
            <p className="text-xs text-slate-500">{row.envelopeId}</p>
          </div>
        </div>
      ),
    },
    {
      header: "Tipo",
      key: "entityType",
      cell: (row) => <Badge variant="outline">{row.entityType}</Badge>,
    },
    {
      header: "Enviado em",
      key: "sentAt",
      cell: (row) => row.sentAt ? format(new Date(row.sentAt), 'dd/MM/yyyy HH:mm') : '-',
    },
    {
      header: "Status",
      key: "status",
      cell: (row) => {
        const Icon = statusIcons[row.status] || Clock;
        return (
          <Badge variant="outline" className={statusColors[row.status]}>
            <Icon className="w-3 h-3 mr-1" />
            {row.status}
          </Badge>
        );
      },
    },
    {
      header: "Signatários",
      key: "recipients",
      cell: (row) => row.recipients?.length || 0,
    },
  ];

  return (
    <div className="min-h-screen bg-[#f3f2f1]">
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-[#323130]">DocuSign Envelopes</h1>
            <p className="text-sm text-[#605e5c] mt-1">Acompanhamento de documentos enviados</p>
          </div>
          <div className="relative w-80">
            <Input
              placeholder="Pesquisar envelopes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9"
            />
          </div>
        </div>
      </div>

      <CommandBar
        onNew={() => navigate(createPageUrl('DocuSignEnvio'))}
        onRefresh={refetch}
      />

      <div className="p-6">
        <DataGrid
          columns={columns}
          data={filteredEnvelopes}
          isLoading={isLoading}
          onRowClick={setSelectedEnvelope}
        />
      </div>

      <Sheet open={!!selectedEnvelope} onOpenChange={(open) => !open && setSelectedEnvelope(null)}>
        <SheetContent className="w-full sm:max-w-2xl p-0 overflow-y-auto">
          {selectedEnvelope && (
            <>
              <div className="bg-[#0f6cbd] text-white p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-semibold">{selectedEnvelope.subject}</h2>
                    <p className="text-white/80 text-sm mt-1">{selectedEnvelope.envelopeId}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedEnvelope(null)}
                    className="text-white hover:bg-white/10"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                <Card>
                  <CardContent className="pt-6 space-y-4">
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600">Tipo</span>
                      <Badge>{selectedEnvelope.entityType}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600">Status</span>
                      <Badge variant="outline" className={statusColors[selectedEnvelope.status]}>
                        {selectedEnvelope.status}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600">Enviado em</span>
                      <span className="text-sm font-medium">
                        {selectedEnvelope.sentAt ? format(new Date(selectedEnvelope.sentAt), 'dd/MM/yyyy HH:mm') : '-'}
                      </span>
                    </div>
                    {selectedEnvelope.completedAt && (
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-600">Concluído em</span>
                        <span className="text-sm font-medium">
                          {format(new Date(selectedEnvelope.completedAt), 'dd/MM/yyyy HH:mm')}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <h3 className="font-semibold mb-3">Signatários</h3>
                    <div className="space-y-2">
                      {selectedEnvelope.recipients?.map((recipient, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded">
                          <div>
                            <p className="font-medium">{recipient.name}</p>
                            <p className="text-sm text-slate-600">{recipient.email}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {selectedEnvelope.message && (
                  <Card>
                    <CardContent className="pt-6">
                      <h3 className="font-semibold mb-2">Mensagem</h3>
                      <p className="text-sm text-slate-700">{selectedEnvelope.message}</p>
                    </CardContent>
                  </Card>
                )}

                <div className="flex gap-3">
                  <Button
                    onClick={() => updateStatus(selectedEnvelope)}
                    disabled={isUpdating}
                    variant="outline"
                    className="flex-1"
                  >
                    {isUpdating ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4 mr-2" />
                    )}
                    Atualizar Status
                  </Button>

                  {selectedEnvelope.status === 'completed' && (
                    <Button
                      onClick={() => downloadDocument(selectedEnvelope)}
                      disabled={isDownloading}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                    >
                      {isDownloading ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4 mr-2" />
                      )}
                      Baixar PDF
                    </Button>
                  )}

                  {selectedEnvelope.status !== 'completed' && selectedEnvelope.status !== 'voided' && (
                    <Button
                      onClick={() => voidEnvelope(selectedEnvelope)}
                      variant="destructive"
                      className="flex-1"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancelar
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}