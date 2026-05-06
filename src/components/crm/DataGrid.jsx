import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronDown, ChevronUp } from "lucide-react";

export default function DataGrid({ 
  columns = [], 
  data = [], 
  isLoading = false,
  onRowClick,
  sortBy,
  sortOrder,
  onSort
}) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-slate-200">
        <div className="p-4 space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
        <p className="text-slate-500">Nenhum registro encontrado</p>
      </div>
    );
  }

  const handleSort = (columnKey) => {
    if (onSort && columnKey) {
      if (sortBy === columnKey) {
        onSort(columnKey, sortOrder === 'asc' ? 'desc' : 'asc');
      } else {
        onSort(columnKey, 'asc');
      }
    }
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-[#faf9f8] hover:bg-[#faf9f8]">
            {columns.map((col, idx) => (
              <TableHead 
                key={idx}
                className={`text-xs font-semibold text-[#323130] ${col.sortable ? 'cursor-pointer hover:bg-slate-100' : ''}`}
                onClick={() => col.sortable && handleSort(col.key)}
              >
                <div className="flex items-center gap-1">
                  {col.header}
                  {col.sortable && sortBy === col.key && (
                    sortOrder === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                  )}
                </div>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, idx) => (
            <TableRow 
              key={row.id || idx}
              onClick={() => onRowClick && onRowClick(row)}
              className={`${onRowClick ? 'cursor-pointer' : ''} hover:bg-slate-50 border-b border-slate-100`}
            >
              {columns.map((col, colIdx) => (
                <TableCell key={colIdx} className="text-sm text-slate-700">
                  {col.cell ? col.cell(row) : row[col.key]}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}