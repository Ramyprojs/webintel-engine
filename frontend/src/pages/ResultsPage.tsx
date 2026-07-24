import { useEffect, useState } from 'react';
import { Database, Filter, Download, AlertTriangle, CheckCircle, ExternalLink, RefreshCw } from 'lucide-react';
import { resultsApi } from '../api/client';
import type { StructuredResult } from '../api/client';
import { cn } from '../App';

export default function ResultsPage() {
  const [results, setResults] = useState<StructuredResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchResults = async () => {
    try {
      const data = await resultsApi.getAll();
      setResults(data);
    } catch (err) {
      console.error('Failed to fetch results', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, []);

  const handleExport = () => {
    window.open(resultsApi.getExportUrl('csv'), '_blank');
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-light tracking-tight flex items-center gap-3">
            <Database className="w-8 h-8 text-brand-secondary" />
            Results Database
          </h1>
          <p className="text-slate-400 mt-2">View and export extracted LLM intelligence.</p>
        </div>
        
        <div className="flex gap-3">
          <button onClick={fetchResults} className="glass-button !px-3 !bg-slate-800 hover:!bg-slate-700 flex items-center gap-2">
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          </button>
          <button onClick={handleExport} className="glass-button flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="glass-panel p-4 flex gap-4 items-center">
        <Filter className="w-4 h-4 text-slate-400" />
        <input 
          type="text" 
          placeholder="Filter by company name or industry..." 
          className="glass-input flex-1 !py-1.5"
          disabled
        />
        <select className="glass-input !py-1.5 w-48" disabled>
          <option>All Statuses</option>
          <option>Cleaned</option>
          <option>Needs Review</option>
        </select>
      </div>

      {/* Data Table */}
      <div className="glass-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-900/50 text-slate-400 font-medium uppercase tracking-wider text-xs">
              <tr>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Company</th>
                <th className="px-6 py-4">Industry</th>
                <th className="px-6 py-4">Contact</th>
                <th className="px-6 py-4 text-right">Confidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {loading && results.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Loading intelligence...
                  </td>
                </tr>
              ) : results.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    No results found.
                  </td>
                </tr>
              ) : (
                results.map((result) => (
                  <ResultRow 
                    key={result.id} 
                    result={result} 
                    isExpanded={expandedId === result.id}
                    onToggle={() => setExpandedId(expandedId === result.id ? null : result.id)}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ResultRow({ result, isExpanded, onToggle }: { result: StructuredResult, isExpanded: boolean, onToggle: () => void }) {
  const isWarning = result.status === 'needs_review' || result.status === 'failed';
  
  return (
    <>
      <tr 
        onClick={onToggle}
        className={cn(
          "hover:bg-slate-800/30 cursor-pointer transition-colors",
          isExpanded && "bg-slate-800/20"
        )}
      >
        <td className="px-6 py-4">
          {isWarning ? (
            <span className="flex items-center gap-1.5 text-amber-400 bg-amber-400/10 px-2 py-1 rounded w-max text-xs uppercase font-semibold">
              <AlertTriangle className="w-3 h-3" /> Review
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded w-max text-xs uppercase font-semibold">
              <CheckCircle className="w-3 h-3" /> Cleaned
            </span>
          )}
        </td>
        <td className="px-6 py-4 font-medium text-slate-200">
          {result.company_name || <span className="text-slate-600">Unknown</span>}
        </td>
        <td className="px-6 py-4 text-slate-400">
          {result.industry || '-'}
        </td>
        <td className="px-6 py-4">
          <div className="flex flex-col text-slate-400 gap-0.5">
            {result.contact_email ? <span>{result.contact_email}</span> : null}
            {result.website ? (
              <a 
                href={result.website.startsWith('http') ? result.website : `https://${result.website}`}
                target="_blank" 
                rel="noreferrer"
                className="text-brand-primary hover:underline flex items-center gap-1"
                onClick={(e) => e.stopPropagation()}
              >
                {result.website} <ExternalLink className="w-3 h-3" />
              </a>
            ) : null}
            {!result.contact_email && !result.website && '-'}
          </div>
        </td>
        <td className="px-6 py-4 text-right">
          {result.confidence_score ? (
            <div className="flex items-center justify-end gap-2">
              <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className={cn(
                    "h-full rounded-full", 
                    result.confidence_score > 0.8 ? "bg-emerald-500" : "bg-amber-500"
                  )}
                  style={{ width: `${result.confidence_score * 100}%` }}
                />
              </div>
              <span className="text-slate-400 font-mono">{(result.confidence_score * 100).toFixed(0)}%</span>
            </div>
          ) : (
            <span className="text-slate-600">-</span>
          )}
        </td>
      </tr>
      
      {/* Expanded Detail View */}
      {isExpanded && (
        <tr>
          <td colSpan={5} className="px-0 py-0 border-b-0">
            <div className="bg-slate-900/50 p-6 shadow-inner border-y border-slate-800">
              <div className="grid grid-cols-2 gap-8 whitespace-normal">
                
                {/* Left Column: Context */}
                <div className="space-y-4">
                  <div>
                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">AI Summary</h4>
                    <p className="text-sm text-slate-300 leading-relaxed">
                      {result.summary || 'No summary generated.'}
                    </p>
                  </div>
                  
                  {isWarning && result.review_notes && (
                    <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-lg">
                      <h4 className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Review Diagnostics
                      </h4>
                      <code className="text-xs text-red-300 font-mono break-words whitespace-pre-wrap block mt-2">
                        {result.review_notes}
                      </code>
                    </div>
                  )}
                </div>

                {/* Right Column: Key Data Points */}
                <div>
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Extracted Metadata</h4>
                  {result.key_data_points && Object.keys(result.key_data_points).length > 0 ? (
                    <div className="grid grid-cols-2 gap-4">
                      {Object.entries(result.key_data_points).map(([key, val]) => (
                        <div key={key} className="bg-slate-800/30 p-3 rounded-lg border border-slate-700/50">
                          <div className="text-xs text-slate-500 mb-1 font-mono truncate" title={key}>{key}</div>
                          <div className="text-sm text-slate-200 font-medium truncate" title={String(val)}>
                            {String(val)}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500 italic">No additional metadata extracted.</p>
                  )}
                </div>
                
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
