const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckCircle2, Sun, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function CadastroLead() {
  const [formData, setFormData] = useState({
    primeiro_nome: "",
    sobrenome: "",
    tipo_cliente: "pessoa_fisica",
    telefone_comercial: "",
    telefone_celular: "",
    email: "",
    estado: "",
    cidade: "",
    cliente_que_indicou: "",
    origem: "indicacao",
    observacoes: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Call public API function (no authentication required)
      const response = await db.functions.invoke('createLeadPublic', formData);
      
      if (response.data.success) {
        setIsSuccess(true);
        setFormData({
          primeiro_nome: "",
          sobrenome: "",
          tipo_cliente: "pessoa_fisica",
          telefone_comercial: "",
          telefone_celular: "",
          email: "",
          estado: "",
          cidade: "",
          cliente_que_indicou: "",
          origem: "indicacao",
          observacoes: "",
        });
        
        // Reset success message after 5 seconds
        setTimeout(() => setIsSuccess(false), 5000);
      } else {
        alert("Erro ao cadastrar lead. Tente novamente.");
      }
    } catch (error) {
      alert("Erro ao cadastrar lead. Tente novamente.");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-green-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full shadow-2xl">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-10 h-10 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              Lead Cadastrado com Sucesso!
            </h2>
            <p className="text-slate-600 mb-6">
              Obrigado por indicar um novo cliente. Entraremos em contato em breve!
            </p>
            <Button
              onClick={() => setIsSuccess(false)}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Cadastrar Outro Lead
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-green-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-2xl mb-4 shadow-lg">
            <Sun className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            Cadastro de Lead
          </h1>
          <p className="text-lg text-slate-600">
            Indique novos clientes para energia solar e ganhe comissões!
          </p>
        </div>

        {/* Benefits */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="bg-white/80 backdrop-blur border-emerald-100">
            <CardContent className="p-4 text-center">
              <Sparkles className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
              <h3 className="font-semibold text-slate-900 mb-1">Economia Real</h3>
              <p className="text-sm text-slate-600">Até 20% na conta de luz</p>
            </CardContent>
          </Card>
          <Card className="bg-white/80 backdrop-blur border-emerald-100">
            <CardContent className="p-4 text-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
              <h3 className="font-semibold text-slate-900 mb-1">Sem Investimento</h3>
              <p className="text-sm text-slate-600">Sem instalação de painéis</p>
            </CardContent>
          </Card>
          <Card className="bg-white/80 backdrop-blur border-emerald-100">
            <CardContent className="p-4 text-center">
              <Sun className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
              <h3 className="font-semibold text-slate-900 mb-1">Sustentável</h3>
              <p className="text-sm text-slate-600">Energia limpa e renovável</p>
            </CardContent>
          </Card>
        </div>

        {/* Form */}
        <Card className="shadow-2xl">
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Info */}
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 font-bold text-sm">1</span>
                  Dados Pessoais
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nome *</Label>
                    <Input
                      value={formData.primeiro_nome}
                      onChange={(e) => setFormData({ ...formData, primeiro_nome: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Sobrenome</Label>
                    <Input
                      value={formData.sobrenome}
                      onChange={(e) => setFormData({ ...formData, sobrenome: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tipo de Cliente *</Label>
                    <Select
                      value={formData.tipo_cliente}
                      onValueChange={(value) => setFormData({ ...formData, tipo_cliente: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pessoa_fisica">Pessoa Física</SelectItem>
                        <SelectItem value="pessoa_juridica">Pessoa Jurídica</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Contact Info */}
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 font-bold text-sm">2</span>
                  Contato
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Telefone *</Label>
                    <Input
                      value={formData.telefone_comercial}
                      onChange={(e) => setFormData({ ...formData, telefone_comercial: e.target.value })}
                      placeholder="(00) 0000-0000"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Celular</Label>
                    <Input
                      value={formData.telefone_celular}
                      onChange={(e) => setFormData({ ...formData, telefone_celular: e.target.value })}
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Location */}
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 font-bold text-sm">3</span>
                  Localização
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Estado</Label>
                    <Select
                      value={formData.estado}
                      onValueChange={(value) => setFormData({ ...formData, estado: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MG">Minas Gerais</SelectItem>
                        <SelectItem value="SP">São Paulo</SelectItem>
                        <SelectItem value="RJ">Rio de Janeiro</SelectItem>
                        <SelectItem value="ES">Espírito Santo</SelectItem>
                        <SelectItem value="BA">Bahia</SelectItem>
                        <SelectItem value="PR">Paraná</SelectItem>
                        <SelectItem value="SC">Santa Catarina</SelectItem>
                        <SelectItem value="RS">Rio Grande do Sul</SelectItem>
                        <SelectItem value="GO">Goiás</SelectItem>
                        <SelectItem value="MT">Mato Grosso</SelectItem>
                        <SelectItem value="MS">Mato Grosso do Sul</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Cidade</Label>
                    <Input
                      value={formData.cidade}
                      onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Additional Info */}
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 font-bold text-sm">4</span>
                  Informações Adicionais
                </h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Origem do Lead</Label>
                    <Select
                      value={formData.origem}
                      onValueChange={(value) => setFormData({ ...formData, origem: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="indicacao">Indicação</SelectItem>
                        <SelectItem value="site">Site</SelectItem>
                        <SelectItem value="telefone">Telefone</SelectItem>
                        <SelectItem value="evento">Evento</SelectItem>
                        <SelectItem value="marketing">Marketing</SelectItem>
                        <SelectItem value="outro">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Cliente que Indicou</Label>
                    <Input
                      value={formData.cliente_que_indicou}
                      onChange={(e) => setFormData({ ...formData, cliente_que_indicou: e.target.value })}
                      placeholder="Nome do cliente que fez a indicação"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Observações</Label>
                    <Textarea
                      value={formData.observacoes}
                      onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                      placeholder="Informações adicionais sobre o lead..."
                      rows={3}
                    />
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 h-12 text-lg"
              >
                {isSubmitting ? "Cadastrando..." : "Cadastrar Lead"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-slate-600">
          <p>Ao cadastrar um lead, você concorda com nossos termos de uso.</p>
          <p className="mt-2">© 2026 UneEnergia - Créditos Solares</p>
        </div>
      </div>
    </div>
  );
}