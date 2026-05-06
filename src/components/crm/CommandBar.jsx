import React from "react";
import { Button } from "@/components/ui/button";
import { Plus, RefreshCw, Download, Upload, Trash2, Filter } from "lucide-react";

export default function CommandBar({ 
  onNew, 
  onRefresh, 
  onExport, 
  onImport,
  onDelete,
  onFilter,
  selectedCount = 0,
  showFilter = false
}) {
  return (
    <div className="bg-white border-b border-slate-200 px-4 py-2 flex items-center gap-2 flex-wrap">
      {onNew && (
        <Button 
          onClick={onNew}
          size="sm"
          className="bg-[#0f6cbd] hover:bg-[#0d5ba8] h-8 text-xs"
        >
          <Plus className="w-4 h-4 mr-1" />
          Novo
        </Button>
      )}

      <div className="w-px h-6 bg-slate-200 mx-1"></div>

      {onRefresh && (
        <Button 
          onClick={onRefresh}
          size="sm"
          variant="ghost"
          className="h-8 text-xs"
        >
          <RefreshCw className="w-4 h-4 mr-1" />
          Atualizar
        </Button>
      )}

      {onExport && (
        <Button 
          onClick={onExport}
          size="sm"
          variant="ghost"
          className="h-8 text-xs"
        >
          <Download className="w-4 h-4 mr-1" />
          Exportar
        </Button>
      )}

      {onImport && (
        <Button 
          onClick={onImport}
          size="sm"
          variant="ghost"
          className="h-8 text-xs"
        >
          <Upload className="w-4 h-4 mr-1" />
          Importar
        </Button>
      )}

      {onDelete && selectedCount > 0 && (
        <>
          <div className="w-px h-6 bg-slate-200 mx-1"></div>
          <Button 
            onClick={onDelete}
            size="sm"
            variant="ghost"
            className="h-8 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Excluir ({selectedCount})
          </Button>
        </>
      )}

      <div className="flex-1"></div>

      {onFilter && (
        <Button 
          onClick={onFilter}
          size="sm"
          variant={showFilter ? "default" : "ghost"}
          className="h-8 text-xs"
        >
          <Filter className="w-4 h-4 mr-1" />
          Filtrar
        </Button>
      )}
    </div>
  );
}