'use client';

import { useMemo, useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
} from '@tanstack/react-table';
import type { TableComponent as TableComponentType } from '@/types/report-schema';

interface TableComponentProps {
  component: TableComponentType;
}

// Format cell values based on column type
const formatValue = (value: any, type?: string): string => {
  if (value === null || value === undefined) return '';

  switch (type) {
    case 'currency':
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(Number(value));
    case 'number':
      return new Intl.NumberFormat('en-US').format(Number(value));
    case 'date':
      return new Date(value).toLocaleDateString('en-US');
    default:
      return String(value);
  }
};

export function TableComponent({ component }: TableComponentProps) {
  const { columns: columnDefs, rows, sortable = true, filterable = true, pagination = true, pageSize = 10 } = component.data;

  // State
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  // Build TanStack Table columns
  const columns = useMemo<ColumnDef<any>[]>(
    () =>
      columnDefs.map((col) => ({
        accessorKey: col.key,
        header: col.label,
        cell: (info) => formatValue(info.getValue(), col.type),
        enableSorting: sortable && (col.sortable !== false),
        enableColumnFilter: filterable,
        meta: {
          align: col.align || 'left',
          type: col.type,
        },
      })),
    [columnDefs, sortable, filterable]
  );

  // Create table instance
  const table = useReactTable({
    data: rows,
    columns,
    state: {
      sorting,
      columnFilters,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: pagination ? getPaginationRowModel() : undefined,
    initialState: {
      pagination: pagination ? { pageSize } : undefined,
    },
  });

  // Empty state
  if (rows.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <svg
            className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <p className="text-sm">No data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col">
      {/* Table container with horizontal scroll */}
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-muted/50 sticky top-0 z-10">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const meta = header.column.columnDef.meta as any;
                  return (
                    <th
                      key={header.id}
                      className={`px-4 py-3 text-${meta?.align || 'left'} font-medium text-muted-foreground border-b border-border`}
                    >
                      {header.isPlaceholder ? null : (
                        <div className="flex items-center gap-2">
                          <div
                            {...{
                              className: header.column.getCanSort()
                                ? 'cursor-pointer select-none flex items-center gap-1'
                                : '',
                              onClick: header.column.getToggleSortingHandler(),
                            }}
                          >
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                            {{
                              asc: ' ↑',
                              desc: ' ↓',
                            }[header.column.getIsSorted() as string] ?? null}
                          </div>
                          {filterable && (
                            <input
                              type="text"
                              value={(header.column.getFilterValue() ?? '') as string}
                              onChange={(e) =>
                                header.column.setFilterValue(e.target.value)
                              }
                              placeholder="Filter..."
                              className="w-full max-w-[120px] px-2 py-1 text-xs border border-input rounded bg-background"
                              onClick={(e) => e.stopPropagation()}
                            />
                          )}
                        </div>
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className="border-b border-border hover:bg-muted/30 transition-colors"
              >
                {row.getVisibleCells().map((cell) => {
                  const meta = cell.column.columnDef.meta as any;
                  return (
                    <td
                      key={cell.id}
                      className={`px-4 py-3 text-${meta?.align || 'left'}`}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination controls */}
      {pagination && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/20">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>
              Page {table.getState().pagination.pageIndex + 1} of{' '}
              {table.getPageCount()}
            </span>
            <span>
              ({table.getFilteredRowModel().rows.length} rows)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
              className="px-3 py-1 text-sm border border-border rounded hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
            >
              First
            </button>
            <button
              type="button"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="px-3 py-1 text-sm border border-border rounded hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="px-3 py-1 text-sm border border-border rounded hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
            <button
              type="button"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
              className="px-3 py-1 text-sm border border-border rounded hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Last
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
