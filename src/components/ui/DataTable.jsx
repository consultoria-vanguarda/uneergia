import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

export default function DataTable({ 
  columns, 
  data, 
  isLoading,
  emptyMessage = "Nenhum registro encontrado",
  onRowClick 
}) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50">
            {columns.map((column, idx) => (
              <TableHead key={idx} className="font-semibold text-slate-700">
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="text-center py-8 text-slate-400">
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            data.map((row, rowIdx) => (
              <TableRow 
                key={row.id || rowIdx} 
                className={onRowClick ? "cursor-pointer hover:bg-slate-50" : ""}
                onClick={() => onRowClick && onRowClick(row)}
              >
                {columns.map((column, colIdx) => (
                  <TableCell key={colIdx}>
                    {column.cell ? column.cell(row) : row[column.accessor]}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}