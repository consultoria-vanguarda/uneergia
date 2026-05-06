const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Upload, X, File, Loader2 } from "lucide-react";

// Internamente armazena apenas strings (URLs).
// `value` pode ser string[] vindo do banco.
export default function DocumentUploader({ value = [], onChange, label = "Documentos" }) {
  const [uploading, setUploading] = useState(false);

  // Normaliza: garante que tudo é string
  const urls = value.map(d => (typeof d === 'string' ? d : d?.url)).filter(Boolean);

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    setUploading(true);
    const newUrls = [];
    try {
      for (const file of files) {
        const response = await db.integrations.Core.UploadFile({ file });
        if (response?.file_url) newUrls.push(response.file_url);
      }
      onChange([...urls, ...newUrls]);
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
      alert("Erro ao fazer upload: " + (error.message || "Erro desconhecido"));
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const removeDocument = (index) => {
    onChange(urls.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <Label>{label}</Label>
      <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 hover:border-emerald-400 transition-colors">
        <input
          type="file"
          multiple
          onChange={handleFileUpload}
          className="hidden"
          id={`file-upload-${label.replace(/\s/g,'')}`}
          disabled={uploading}
        />
        <label
          htmlFor={`file-upload-${label.replace(/\s/g,'')}`}
          className="flex flex-col items-center justify-center cursor-pointer"
        >
          {uploading ? (
            <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mb-2" />
          ) : (
            <Upload className="w-8 h-8 text-slate-400 mb-2" />
          )}
          <p className="text-sm text-slate-600 mb-1">
            {uploading ? "Enviando..." : "Clique para fazer upload"}
          </p>
          <p className="text-xs text-slate-500">PDF, DOC, PNG, JPG (máx. 10MB)</p>
        </label>
      </div>

      {urls.length > 0 && (
        <div className="space-y-2">
          {urls.map((url, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <File className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {`Documento ${index + 1}`}
                  </p>
                  <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">
                    Visualizar
                  </a>
                </div>
              </div>
              <Button size="sm" variant="ghost" onClick={() => removeDocument(index)} className="flex-shrink-0">
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}