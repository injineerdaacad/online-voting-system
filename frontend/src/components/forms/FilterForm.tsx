import { Filter, Search, X, Sparkles } from 'lucide-react';
import { ReactNode } from 'react';

export interface FilterField {
  key: string;
  label: string;
  type: 'text' | 'select' | 'date' | 'number';
  placeholder?: string;
  icon?: ReactNode;
  options?: { value: string; label: string }[];
  className?: string;
}

interface FilterFormProps {
  filters: Record<string, any>;
  onFilterChange: (filters: Record<string, any>) => void;
  onClear: () => void;
  fields: FilterField[];
  title?: string;
  showClearButton?: boolean;
}

export const FilterForm: React.FC<FilterFormProps> = ({
  filters,
  onFilterChange,
  onClear,
  fields,
  title = 'Advanced Filters',
  showClearButton = true,
}) => {
  const handleFieldChange = (key: string, value: any) => {
    onFilterChange({
      ...filters,
      [key]: value || undefined,
    });
  };

  const hasActiveFilters = Object.values(filters).some(
    (value) => value !== undefined && value !== null && value !== ''
  );

  return (
    <div className="relative group">
      
      <div className="absolute inset-0 bg-gradient-to-r from-university-blue-500/5 via-university-gold-500/5 to-university-blue-500/5 dark:from-university-blue-900/10 dark:via-university-gold-900/10 dark:to-university-blue-900/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="relative glass rounded-2xl shadow-md overflow-hidden border border-gray-200/50 dark:border-slate-700/50 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm mb-4 sm:mb-6 animate-fade-in-down">
        
        <div className="h-0.5 bg-gradient-to-r from-gray-300 via-gray-400 to-gray-300 dark:from-slate-600 dark:via-slate-500 dark:to-slate-600" />
        
        <div className="p-5 sm:p-6">
          
          <div className="flex items-center justify-between mb-4 sm:mb-5">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <div className="bg-gray-100 dark:bg-slate-700 p-2.5 rounded-lg shadow-sm flex items-center justify-center w-10 h-10">
                  <Filter className="h-5 w-5 text-gray-600 dark:text-gray-300" strokeWidth={2.5} />
                </div>
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  {title}
                  {hasActiveFilters && (
                    <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-medium text-university-gold-700 dark:text-university-gold-400 bg-university-gold-100 dark:bg-university-gold-900/30 rounded-full">
                      Active
                    </span>
                  )}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Refine your search with advanced options
                </p>
              </div>
            </div>
            {showClearButton && hasActiveFilters && (
              <button
                onClick={onClear}
                className="group/clear flex items-center gap-2 px-4 py-2 text-sm font-medium text-university-red-600 dark:text-university-red-400 hover:text-white bg-university-red-50 dark:bg-university-red-900/20 hover:bg-gradient-to-r hover:from-university-red-500 hover:to-university-red-600 dark:hover:from-university-red-600 dark:hover:to-university-red-700 rounded-xl border border-university-red-200 dark:border-university-red-800 hover:border-transparent transition-all duration-300 shadow-sm hover:shadow-lg"
              >
                <X className="h-4 w-4 group-hover/clear:rotate-90 transition-transform duration-300" />
                <span className="hidden sm:inline">Clear All</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {fields.map((field) => (
              <div
                key={field.key}
                className={`space-y-2 ${field.className || ''}`}
              >
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
                  {field.icon && <span className="text-university-blue-500 dark:text-university-blue-400">{field.icon}</span>}
                  {field.label}
                </label>
                
                {field.type === 'text' && (
                  <div className="relative group/input">
                    <div className="absolute inset-0 bg-gradient-to-r from-university-blue-500/10 to-university-gold-500/10 rounded-xl opacity-0 group-hover/input:opacity-100 transition-opacity duration-300" />
                    <div className="relative">
                      {field.icon ? (
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10">
                          {field.icon}
                        </div>
                      ) : (
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500 z-10" />
                      )}
                      <input
                        type="text"
                        placeholder={field.placeholder || 'Search...'}
                        className="form-input pl-10 pr-4 w-full h-11 rounded-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border-2 border-gray-200/60 dark:border-slate-600/60 focus:border-university-blue-500 dark:focus:border-university-blue-400 focus:ring-2 focus:ring-university-blue-500/20 dark:focus:ring-university-blue-400/20 transition-all duration-300 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 shadow-sm hover:shadow-md focus:shadow-lg"
                        value={filters[field.key] || ''}
                        onChange={(e) => handleFieldChange(field.key, e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {field.type === 'select' && (
                  <div className="relative group/select">
                    <div className="absolute inset-0 bg-gradient-to-r from-university-blue-500/10 to-university-gold-500/10 rounded-xl opacity-0 group-hover/select:opacity-100 transition-opacity duration-300" />
                    <div className="relative">
                      {field.icon && (
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10 pointer-events-none">
                          {field.icon}
                        </div>
                      )}
                      <select
                        className={`form-input w-full h-11 rounded-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border-2 border-gray-200/60 dark:border-slate-600/60 focus:border-university-blue-500 dark:focus:border-university-blue-400 focus:ring-2 focus:ring-university-blue-500/20 dark:focus:ring-university-blue-400/20 transition-all duration-300 text-gray-900 dark:text-gray-100 shadow-sm hover:shadow-md focus:shadow-lg appearance-none cursor-pointer ${field.icon ? 'pl-10 pr-10' : 'px-4'}`}
                        value={filters[field.key] || ''}
                        onChange={(e) => handleFieldChange(field.key, e.target.value)}
                      >
                        <option value="">All {field.label}</option>
                        {field.options?.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none z-10">
                        <svg
                          className="h-4 w-4 text-gray-400 dark:text-gray-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                )}

                {field.type === 'date' && (
                  <div className="relative group/date">
                    <div className="absolute inset-0 bg-gradient-to-r from-university-blue-500/10 to-university-gold-500/10 rounded-xl opacity-0 group-hover/date:opacity-100 transition-opacity duration-300" />
                    <input
                      type="date"
                      className="form-input w-full h-11 rounded-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border-2 border-gray-200/60 dark:border-slate-600/60 focus:border-university-blue-500 dark:focus:border-university-blue-400 focus:ring-2 focus:ring-university-blue-500/20 dark:focus:ring-university-blue-400/20 transition-all duration-300 text-gray-900 dark:text-gray-100 shadow-sm hover:shadow-md focus:shadow-lg px-4"
                      value={filters[field.key] || ''}
                      onChange={(e) => handleFieldChange(field.key, e.target.value)}
                    />
                  </div>
                )}

                {field.type === 'number' && (
                  <div className="relative group/number">
                    <div className="absolute inset-0 bg-gradient-to-r from-university-blue-500/10 to-university-gold-500/10 rounded-xl opacity-0 group-hover/number:opacity-100 transition-opacity duration-300" />
                    <input
                      type="number"
                      placeholder={field.placeholder || 'Enter number...'}
                      className="form-input w-full h-11 rounded-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border-2 border-gray-200/60 dark:border-slate-600/60 focus:border-university-blue-500 dark:focus:border-university-blue-400 focus:ring-2 focus:ring-university-blue-500/20 dark:focus:ring-university-blue-400/20 transition-all duration-300 text-gray-900 dark:text-gray-100 shadow-sm hover:shadow-md focus:shadow-lg px-4"
                      value={filters[field.key] || ''}
                      onChange={(e) => handleFieldChange(field.key, e.target.value)}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          {hasActiveFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200/50 dark:border-slate-700/50">
              <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                <Sparkles className="h-3 w-3 text-university-gold-500" />
                <span>
                  {Object.values(filters).filter((v) => v !== undefined && v !== null && v !== '').length} filter(s) active
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FilterForm;