import React, { useState } from 'react';
import { Upload, AlertTriangle, Check, ArrowRight, X, Sparkles, Copy } from 'lucide-react';
import { ModalWrapper } from '../ui/SharedUI';
import { Button } from '../ui/Button';
import { formatCurrency } from '../../utils/helpers';
import { parseCSV, guessColumnMapping, normalizeImportRows, identifyDuplicates, filterExclusions, identifyReturns } from '../../utils/csvHelpers';
import { categorizeTransactions } from '../../services/gemini';

export default function ImportTransactionsModal({ isOpen, onClose, existingTransactions, categories, onSave, theme = 'light' }) {
  const [step, setStep] = useState(1); // 1: Upload, 2: Map, 3: Resolve, 4: Categorize
  const [file, setFile] = useState(null);
  const [rawHeaders, setRawHeaders] = useState([]);
  const [rawRows, setRawRows] = useState([]);
  const [mapping, setMapping] = useState({ date: '', amount: '', merchant: '' });
  
  const [processedData, setProcessedData] = useState({ unique: [], duplicates: [] });
  const [excludedCount, setExcludedCount] = useState(0);
  const [transactionsToDelete, setTransactionsToDelete] = useState([]); 
  const [isCategorizing, setIsCategorizing] = useState(false);

  // Reset on open
  React.useEffect(() => {
    if (isOpen) {
      setStep(1);
      setFile(null);
      setRawRows([]);
      setTransactionsToDelete([]);
      setExcludedCount(0);
    }
  }, [isOpen]);

  // --- Handlers ---
  const handleFileSelect = async (e) => {
    const selected = e.target.files[0];
    if (!selected) return;
    setFile(selected);

    try {
      const data = await parseCSV(selected);
      if (data && data.length > 0) {
        const headers = Object.keys(data[0]);
        setRawHeaders(headers);
        setRawRows(data);
        setMapping(guessColumnMapping(headers));
        setStep(2);
      }
    } catch (error) {
      alert('Error parsing CSV: ' + error.message);
    }
  };

  const handleProcess = () => {
    const normalized = normalizeImportRows(rawRows, mapping);
    
    // 1. Filter Exclusions (Credit Card Payments, etc.)
    const { valid, excluded } = filterExclusions(normalized);
    setExcludedCount(excluded.length);

    // 2. Check for Duplicates (Only on valid rows)
    const result = identifyDuplicates(valid, existingTransactions);
    
    // 3. Identify Returns (Only on unique rows)
    // This checks both DB and the new CSV batch for parent expenses
    const uniqueWithReturns = identifyReturns(result.unique, existingTransactions);
    
    setProcessedData({ unique: uniqueWithReturns, duplicates: result.duplicates });

    // Flow Logic: If duplicates exist, go to Resolve step. Else go straight to Categorize.
    if (result.duplicates.length > 0) {
        setStep(3); 
    } else {
        setStep(4);
    }
  };

  const handleAutoCategorize = async () => {
    setIsCategorizing(true);
    // Get mapping from Gemini
    const mapping = await categorizeTransactions(processedData.unique, categories);
    
    if (mapping) {
      // Apply mapping to current data
      const updatedUnique = processedData.unique.map(tx => ({
        ...tx,
        subCategoryId: mapping[tx.merchant] || ''
      }));
      
      setProcessedData(prev => ({ ...prev, unique: updatedUnique }));
    }
    setIsCategorizing(false);
  };

  const handleCategoryChange = (index, subCategoryId) => {
    setProcessedData(prev => {
      const newUnique = [...prev.unique];
      const targetRow = newUnique[index];
      
      // 1. Update the row the user clicked
      newUnique[index] = { ...targetRow, subCategoryId };

      // 2. Cascade: If this row is a parent to any linked returns, update them too
      if (targetRow.tempId) {
          // We must iterate through the whole array to find any children
          for (let i = 0; i < newUnique.length; i++) {
              if (newUnique[i].linkedParentId === targetRow.tempId) {
                  newUnique[i] = { ...newUnique[i], subCategoryId };
              }
          }
      }

      return { ...prev, unique: newUnique };
    });
  };

  const handleFinalSave = () => {
    // Pass the unique rows AND the IDs to delete (from "Replace" actions)
    onSave(processedData.unique, transactionsToDelete);
    onClose();
  };

  const handleDuplicateAction = (index, action) => {
    const item = processedData.duplicates[index];
    
    setProcessedData(prev => {
      const newDuplicates = prev.duplicates.filter((_, i) => i !== index);
      let newUnique = [...prev.unique];

      if (action === 'keep_both') {
        // Add CSV version as new
        newUnique.push(item.newTx);
      } else if (action === 'replace') {
        // Add CSV version as new AND mark old for deletion
        newUnique.push(item.newTx);
        setTransactionsToDelete(prevDel => [...prevDel, item.existingTx.id]);
      } 
      // action === 'keep_original' just removes it from duplicates

      return { ...prev, unique: newUnique, duplicates: newDuplicates };
    });
  };

  const handleRemoveTransaction = (index) => {
    setProcessedData(prev => ({
      ...prev,
      unique: prev.unique.filter((_, i) => i !== index)
    }));
  };

  if (!isOpen) return null;

  return (
    <ModalWrapper onClose={onClose} theme={theme} title="Import Transactions" maxWidth="max-w-3xl">
      {/* --- STEP 1: UPLOAD --- */}
      {step === 1 && (
        <div className="text-center py-8">
          <div className={`mx-auto h-20 w-20 rounded-full flex items-center justify-center mb-6 ${theme === 'dark' ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>
            <Upload className="h-10 w-10" />
          </div>
          <h3 className={`text-lg font-bold mb-2 ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>Upload Bank Statement</h3>
          <p className="text-sm text-slate-500 mb-8">Upload a CSV file from your bank to get started.</p>
          
          <label className="cursor-pointer">
            <input type="file" accept=".csv" className="hidden" onChange={handleFileSelect} />
            <div className="inline-flex items-center justify-center px-6 py-3 bg-zillion-400 hover:bg-zillion-500 text-white font-bold rounded-lg shadow-lg shadow-zillion-400/20 transition-all">
              Select CSV File
            </div>
          </label>
        </div>
      )}

      {/* --- STEP 2: MAP COLUMNS --- */}
      {step === 2 && (
        <div className="space-y-6">
          <p className="text-sm text-slate-500">Match the columns from your file to Zillion fields.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {['Date', 'Merchant', 'Amount'].map((field) => (
              <div key={field}>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-2">{field}</label>
                <select 
                  className={`w-full p-3 rounded-lg border bg-transparent outline-none ${theme === 'dark' ? 'border-slate-700 text-slate-200' : 'border-slate-300'}`}
                  value={mapping[field.toLowerCase()]}
                  onChange={(e) => setMapping(prev => ({ ...prev, [field.toLowerCase()]: e.target.value }))}
                >
                  <option value="">Select Column...</option>
                  {rawHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
            <Button variant="primary" onClick={handleProcess} disabled={!mapping.date || !mapping.amount}>Review Data</Button>
          </div>
        </div>
      )}

      {/* --- STEP 3: RESOLVE DUPLICATES --- */}
      {step === 3 && (
        <div className="flex flex-col h-[60vh]">
           <div className="mb-4 text-center">
              {/* Updated to Copy Icon with Slate background */}
              <div className={`inline-flex items-center justify-center p-3 rounded-full mb-2 ${theme === 'dark' ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-500'}`}>
                  <Copy className="w-6 h-6" />
              </div>
              <h3 className={`text-lg font-bold ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>
                 Resolve Duplicates ({processedData.duplicates.length})
              </h3>
              <div className={`mt-2 text-xs p-3 rounded-lg text-left mx-auto max-w-lg ${theme === 'dark' ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-600'}`}>
                <p><strong>Note:</strong> These transactions will be <span className="underline">skipped/ignored by default</span>. You do not need to do anything unless you want to force them to import.</p>
              </div>
           </div>

           <div className="flex-grow overflow-y-auto space-y-4 p-1 custom-scrollbar">
              {processedData.duplicates.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400">
                      <Check className="w-12 h-12 mb-2 opacity-50" />
                      <p>All duplicates resolved!</p>
                  </div>
              ) : (
                processedData.duplicates.map((item, i) => (
                  <div key={`dup-${i}`} className={`rounded-xl border p-4 ${theme === 'dark' ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200 shadow-sm'}`}>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                          {/* Existing Side */}
                          <div className={`p-3 rounded-lg border border-dashed ${theme === 'dark' ? 'border-slate-600 bg-slate-900/50' : 'border-slate-300 bg-slate-50'}`}>
                             <span className="text-[10px] font-bold uppercase text-slate-400 mb-2 block">Existing Transaction (In App)</span>
                             <div className="space-y-1">
                                <div className="font-bold text-lg">{item.existingTx.merchant}</div>
                                <div className="text-sm text-slate-500">{item.existingTx.date}</div>
                                <div className="font-mono font-bold">{formatCurrency(item.existingTx.amount)}</div>
                                {item.existingTx.notes && <div className="text-xs italic text-slate-400 mt-1">"{item.existingTx.notes}"</div>}
                             </div>
                          </div>

                          {/* New Side */}
                          <div className={`p-3 rounded-lg border ${theme === 'dark' ? 'border-blue-900/50 bg-blue-900/10' : 'border-blue-200 bg-blue-50'}`}>
                             <span className="text-[10px] font-bold uppercase text-blue-500 mb-2 block">New Transaction (From CSV)</span>
                             <div className="space-y-1">
                                <div className="font-bold text-lg text-blue-700 dark:text-blue-300">{item.newTx.merchant}</div>
                                <div className="text-sm text-blue-600 dark:text-blue-400">{item.newTx.date}</div>
                                <div className="font-mono font-bold text-blue-700 dark:text-blue-300">{formatCurrency(item.newTx.amount)}</div>
                             </div>
                          </div>
                      </div>

                      {/* Actions */}
                      <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-700 items-center">
                          <span className="text-[10px] text-slate-400 mr-auto italic">Action required only to override</span>
                          
                          <button onClick={() => handleDuplicateAction(i, 'replace')} className="px-3 py-2 rounded-md text-xs font-bold text-red-600 border border-red-200 hover:bg-red-50 dark:border-red-900/50 dark:hover:bg-red-900/20">
                             Replace Existing
                          </button>
                          <button onClick={() => handleDuplicateAction(i, 'keep_both')} className="px-3 py-2 rounded-md text-xs font-bold text-white bg-zillion-400 hover:bg-zillion-500 shadow-lg shadow-zillion-400/20">
                             Not a Duplicate
                          </button>
                      </div>
                  </div>
                ))
              )}
           </div>

           <div className="flex justify-between pt-6 mt-4 border-t border-slate-100 dark:border-slate-800">
              <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
              <Button variant="primary" onClick={() => setStep(4)} icon={<ArrowRight className="w-4 h-4" />}>
                 Next: Review {processedData.unique.length} Items
              </Button>
           </div>
        </div>
      )}

      {/* --- STEP 4: CATEGORIZE & IMPORT --- */}
      {step === 4 && (
        <div className="flex flex-col h-[60vh]">
           <div className="flex items-center justify-between mb-4 flex-shrink-0">
              <div>
                <div className="text-lg font-bold text-green-600">Importing {processedData.unique.length} Transactions</div>
                {excludedCount > 0 && (
                  <p className="text-xs text-slate-400 mt-1">
                    <span className="font-bold text-slate-500">{excludedCount}</span> payments/transfers were automatically skipped.
                  </p>
                )}
              </div>
              
              <Button 
                variant="outline" 
                onClick={handleAutoCategorize} 
                isLoading={isCategorizing}
                disabled={processedData.unique.length === 0}
                icon={<Sparkles className="w-4 h-4 text-purple-400" />}
                className="border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100 dark:bg-purple-900/20 dark:border-purple-800 dark:text-purple-300 text-xs h-9"
              >
                Auto-Categorize
              </Button>
           </div>

           <div className="flex-grow overflow-y-auto pr-1 space-y-6">
              {/* Returns Section */}
              {processedData.unique.some(row => row.isReturn) && (
                <div className="rounded-xl border overflow-hidden bg-slate-50/50 dark:bg-slate-900/30 dark:border-slate-700">
                   <div className="bg-orange-50 dark:bg-orange-900/20 px-4 py-2 border-b border-orange-100 dark:border-orange-800/30">
                      <h4 className="text-xs font-bold uppercase text-orange-600 dark:text-orange-400">Detected Returns</h4>
                   </div>
                   <table className="w-full text-sm text-left">
                      <thead className={`text-xs uppercase bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                        <tr>
                          <th className="p-3 pl-4">Date</th>
                          <th className="p-3">Merchant / Note</th>
                          <th className="p-3">Category</th>
                          <th className="p-3 text-right">Amount</th>
                          <th className="p-3 text-center w-16">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-700 bg-white dark:bg-slate-900">
                        {processedData.unique.map((row, i) => {
                           if (!row.isReturn) return null;
                           return (
                              <tr key={`ret-${i}`} className={`${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'} group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors`}>
                                <td className="p-3 pl-4 whitespace-nowrap align-top">{row.date}</td>
                                <td className="p-3 align-top">
                                   <div className="font-medium">{row.merchant}</div>
                                   {row.notes && <div className="text-xs text-orange-500 mt-0.5">{row.notes}</div>}
                                </td>
                                <td className="p-2 align-top">
                                  <select 
                                      className={`w-full max-w-[180px] p-2 rounded border text-xs outline-none cursor-pointer transition-colors ${
                                          row.subCategoryId 
                                              ? (theme === 'dark' ? 'border-slate-600 bg-slate-800 text-slate-200' : 'border-slate-300 bg-white text-slate-800') 
                                              : (theme === 'dark' ? 'border-dashed border-orange-800/50 bg-transparent text-slate-500' : 'border-dashed border-orange-300 bg-transparent text-slate-400')
                                      }`}
                                      value={row.subCategoryId || ""}
                                      onChange={(e) => handleCategoryChange(i, e.target.value)}
                                  >
                                      <option value="">{row.subCategoryId ? "Change..." : "Select Category..."}</option>
                                      {categories.map(cat => (
                                          <optgroup label={cat.name} key={cat.id} className={theme === 'dark' ? 'bg-slate-800' : ''}>
                                              {cat.subcategories.map(sub => (
                                                  <option value={sub.id} key={sub.id}>{sub.name}</option>
                                              ))}
                                          </optgroup>
                                      ))}
                                  </select>
                                </td>
                                <td className="p-3 text-right font-mono text-green-600 dark:text-green-400 align-top">+{row.amount}</td>
                                <td className="p-3 text-center align-top">
                                    <button onClick={() => handleRemoveTransaction(i)} className="text-slate-400 hover:text-red-500 transition-colors">
                                      <X className="w-4 h-4" />
                                    </button>
                                </td>
                              </tr>
                           );
                        })}
                      </tbody>
                   </table>
                </div>
              )}

              {/* Standard Transactions Section */}
              <div className="rounded-xl border overflow-hidden bg-slate-50/50 dark:bg-slate-900/30 dark:border-slate-700">
                  <div className="bg-slate-100 dark:bg-slate-800 px-4 py-2 border-b border-slate-200 dark:border-slate-700">
                      <h4 className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">New Transactions</h4>
                  </div>
                  <table className="w-full text-sm text-left">
                    <thead className={`text-xs uppercase bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                      <tr>
                        <th className="p-3 pl-4">Date</th>
                        <th className="p-3">Merchant</th>
                        <th className="p-3">Category</th>
                        <th className="p-3 text-right">Amount</th>
                        <th className="p-3 text-center w-16">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700 bg-white dark:bg-slate-900">
                      {processedData.unique.map((row, i) => {
                        if (row.isReturn) return null;
                        return (
                          <tr key={`u-${i}`} className={`${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'} group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors`}>
                            <td className="p-3 pl-4 whitespace-nowrap">{row.date}</td>
                            <td className="p-3 font-medium">{row.merchant}</td>
                            <td className="p-2">
                              <select 
                                  className={`w-full max-w-[180px] p-2 rounded border text-xs outline-none cursor-pointer transition-colors ${
                                      row.subCategoryId 
                                          ? (theme === 'dark' ? 'border-slate-600 bg-slate-800 text-slate-200' : 'border-slate-300 bg-white text-slate-800') 
                                          : (theme === 'dark' ? 'border-dashed border-slate-700 bg-transparent text-slate-500' : 'border-dashed border-slate-300 bg-transparent text-slate-400')
                                  }`}
                                  value={row.subCategoryId || ""}
                                  onChange={(e) => handleCategoryChange(i, e.target.value)}
                              >
                                  <option value="">Select Category...</option>
                                  {categories.map(cat => (
                                      <optgroup label={cat.name} key={cat.id} className={theme === 'dark' ? 'bg-slate-800' : ''}>
                                          {cat.subcategories.map(sub => (
                                              <option value={sub.id} key={sub.id}>{sub.name}</option>
                                          ))}
                                      </optgroup>
                                  ))}
                              </select>
                            </td>
                            <td className={`p-3 text-right font-mono ${row.isIncome ? 'text-green-600 dark:text-green-400' : ''}`}>{row.amount}</td>
                            <td className="p-3 text-center">
                                <button onClick={() => handleRemoveTransaction(i)} className="text-slate-400 hover:text-red-500 transition-colors">
                                  <X className="w-4 h-4" />
                                </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
              </div>
           </div>

           <div className="flex justify-between pt-6 mt-4 border-t border-slate-100 dark:border-slate-800 flex-shrink-0">
              <Button variant="outline" onClick={() => setStep(processedData.duplicates.length > 0 ? 3 : 2)}>Back</Button>
              <Button variant="primary" onClick={handleFinalSave} disabled={processedData.unique.length === 0}>
                 Import {processedData.unique.length} Transactions
              </Button>
           </div>
        </div>
      )}
    </ModalWrapper>
  );
}