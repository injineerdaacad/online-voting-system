import React from "react";
import { clsx } from "clsx";

export interface Column<T = any> {
  key: string;
  title: string;
  dataIndex?: keyof T;
  render?: (value: any, record: T, index: number) => React.ReactNode;
  width?: string | number;
  align?: "left" | "center" | "right";
  sortable?: boolean;
  className?: string;
}

export interface TableProps<T = any> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  emptyText?: string;
  rowKey?: keyof T | ((record: T) => string);
  onRowClick?: (record: T, index: number) => void;
  className?: string;
  headerClassName?: string;
  rowClassName?: string | ((record: T, index: number) => string);
  size?: "sm" | "md" | "lg";
  striped?: boolean;
  hoverable?: boolean;
}

const Table = <T extends Record<string, any>>({
  data,
  columns,
  loading = false,
  emptyText = "No data available",
  rowKey = "id",
  onRowClick,
  className,
  headerClassName,
  rowClassName,
  size = "md",
  striped = false,
  hoverable = true,
}: TableProps<T>) => {
  const getRowKey = (record: T, index: number): string => {
    if (typeof rowKey === "function") return rowKey(record);
    return String(record[rowKey as keyof T] || index);
  };

  const getRowClassName = (record: T, index: number): string => {
    const baseClasses = "border-b border-gray-200 dark:border-gray-700";
    const stripedClasses =
      striped && index % 2 === 0 ? "bg-gray-50 dark:bg-gray-800" : "";
    const hoverClasses = hoverable
      ? "hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
      : "";
    const customClasses =
      typeof rowClassName === "function"
        ? rowClassName(record, index)
        : rowClassName || "";
    return clsx(baseClasses, stripedClasses, hoverClasses, customClasses);
  };

  const sizeClasses = {
    sm: "text-sm",
    md: "text-sm",
    lg: "text-base",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-university-gold-500"></div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 mb-4">
          <svg
            className="w-8 h-8 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
        </div>
        <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">
          {emptyText || "No data found in the database"}
        </p>
        <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
          Please add some data to get started
        </p>
      </div>
    );
  }

  return (
    <div className="relative w-full overflow-hidden">
      
      <div className="overflow-x-auto w-full max-w-full">
        <table
          className={clsx(
            "table-auto border-collapse w-full min-w-[800px]",
            sizeClasses[size],
            className
          )}
        >
          <thead>
            <tr
              className={clsx("bg-gray-50 dark:bg-gray-800", headerClassName)}
            >
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={clsx(
                    "px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap",
                    column.align === "center" && "text-center",
                    column.align === "right" && "text-right",
                    column.className
                  )}
                  style={{ width: column.width }}
                >
                  {column.title}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {data.map((record, index) => (
              <tr
                key={getRowKey(record, index)}
                onClick={() => onRowClick?.(record, index)}
                className={getRowClassName(record, index)}
              >
                {columns.map((column) => {
                  const value = column.dataIndex
                    ? record[column.dataIndex]
                    : null;
                  const content = column.render
                    ? column.render(value, record, index)
                    : value;

                  return (
                    <td
                      key={column.key}
                      className={clsx(
                        "px-6 py-4 whitespace-nowrap text-gray-900 dark:text-gray-100",
                        column.align === "center" && "text-center",
                        column.align === "right" && "text-right",
                        column.className
                      )}
                    >
                      {content}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Table;