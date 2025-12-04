import Papa from 'papaparse';
import { nanoid } from 'nanoid';

// --- 1. Parsing ---
export const parseCSV = (file) => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => resolve(results.data),
      error: (error) => reject(error),
    });
  });
};

// --- 2. Fuzzy Matching Helpers ---

const normalizeString = (str) => {
  return (str || '').toLowerCase().replace(/[^a-z0-9]/g, '');
};

const areDatesClose = (date1, date2, daysBuffer = 3) => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2 - d1);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
  return diffDays <= daysBuffer;
};

const isMerchantMatch = (csvMerchant, dbMerchant) => {
  const m1 = normalizeString(csvMerchant);
  const m2 = normalizeString(dbMerchant);
  
  // 1. Direct Substring Match (Strongest)
  if (m1.includes(m2) || m2.includes(m1)) return true;

  // 2. Token Intersection (For renamed splits, e.g. "Target 123" vs "Target - Split")
  // Split by any non-alphanumeric char to get words
  const getTokens = (str) => (str || '').toLowerCase().split(/[^a-z0-9]+/).filter(t => t.length > 2);
  
  const tokens1 = getTokens(csvMerchant);
  const tokens2 = getTokens(dbMerchant);

  // If they share ANY significant word (len > 2), consider it a match for deduplication context
  // (We only run this if Amounts match exactly, so fuzzy merchant is safe)
  const hasCommonToken = tokens1.some(t1 => tokens2.includes(t1));
  
  return hasCommonToken;
};

// --- 3. Deduplication Logic ---
export const identifyDuplicates = (newRows, existingTransactions) => {
  const unique = [];
  const duplicates = [];

  newRows.forEach(row => {
    const rowAmount = parseFloat(row.amount).toFixed(2);
    
    // Find ANY potential match in existing DB
    const match = existingTransactions.find(dbTx => {
      const rVal = parseFloat(rowAmount);
      const dVal = parseFloat(parseFloat(dbTx.amount).toFixed(2));
      
      // 1. Priority: Amount must match (allowing for small rounding differences, e.g. +/- 0.05)
      if (Math.abs(dVal - rVal) > 0.05) return false;

      // 2. Date: Must be within buffer (default 3 days)
      if (!areDatesClose(row.date, dbTx.date)) return false;

      // 3. Merchant: Fuzzy match
      return isMerchantMatch(row.merchant, dbTx.merchant);
    });

    if (match) {
      duplicates.push({ 
        newTx: row,
        existingTx: match,
        duplicateReason: `Matches existing: ${match.merchant} on ${match.date}` 
      });
    } else {
      unique.push(row);
    }
  });

  return { unique, duplicates };
};

// --- 4. Exclusion Logic (Credit Card Payments/Transfers) ---
export const filterExclusions = (rows) => {
  const EXCLUDE_KEYWORDS = [
    "payment to", 
    "transfer", 
    "autopay", 
    "credit card", 
    "thanks for your payment", 
    "thank you - payment",
    "thank you payment",
    "thank you", // Catch generic thank yous
    "web payment",
    "internet payment",
    "mobile payment",
    "online payment",
    "payment received"
  ];
  
  const valid = [];
  const excluded = [];

  rows.forEach(row => {
    // Check both the cleaned name AND the original raw text
    const lowerClean = (row.merchant || '').toLowerCase();
    const lowerOriginal = (row.originalMerchant || '').toLowerCase();
    
    const isExcluded = EXCLUDE_KEYWORDS.some(kw => 
      lowerClean.includes(kw) || lowerOriginal.includes(kw)
    );

    if (isExcluded) {
      excluded.push(row);
    } else {
      valid.push(row);
    }
  });

  return { valid, excluded };
};

// --- 5. Smart Return Detection Logic ---
export const identifyReturns = (rows, existingTransactions) => {
  const PAYCHECK_KEYWORDS = ['payroll', 'direct deposit', 'salary', 'gusto', 'adp'];

  return rows.map(row => {
    // Pass expenses through untouched
    if (!row.isIncome) return row;

    // 1. Paycheck Check - Keep as standard Income if it matches
    const lowerMerchant = (row.merchant || '').toLowerCase();
    if (PAYCHECK_KEYWORDS.some(kw => lowerMerchant.includes(kw))) {
        return row; 
    }

    // It is a candidate for return
    let bestMatch = null;

    // Helper for date comparison (String comparison is safe for YYYY-MM-DD)
    const isDateValid = (txDate, returnDate) => (txDate || '') <= (returnDate || '');

    // 2a. DB Search (Primary): Look for parent expense in Database
    const dbCandidates = existingTransactions.filter(tx =>
        !tx.isIncome &&
        isMerchantMatch(row.merchant, tx.merchant) &&
        isDateValid(tx.date, row.date) &&
        parseFloat(tx.amount) >= parseFloat(row.amount)
    );

    if (dbCandidates.length > 0) {
        // Sort by date descending (most recent first)
        dbCandidates.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
        bestMatch = dbCandidates[0];
        
        return {
            ...row,
            isReturn: true,
            subCategoryId: bestMatch.subCategoryId,
            notes: `Return for ${bestMatch.merchant} (${bestMatch.date})`
        };
    }

    // 2b. CSV Search (Secondary): Look for parent expense in current CSV batch
    const csvCandidates = rows.filter(tx =>
        !tx.isIncome &&
        isMerchantMatch(row.merchant, tx.merchant) &&
        isDateValid(tx.date, row.date) &&
        parseFloat(tx.amount) >= parseFloat(row.amount)
    );

    if (csvCandidates.length > 0) {
         csvCandidates.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
         bestMatch = csvCandidates[0];
         
         return {
            ...row,
            isReturn: true,
            subCategoryId: '', 
            linkedParentId: bestMatch.tempId, // Store ID for cascading updates
            notes: `Linked to new import: ${bestMatch.merchant}`
         };
    }

    // 3. Fallback: No Match Found
    return {
        ...row,
        isReturn: true, 
        subCategoryId: '', 
        notes: 'Potential Return - No match found'
    };
  });
};

// --- 5. Column Mapping Helper ---
// Tries to guess which column corresponds to our schema
export const guessColumnMapping = (headers) => {
  const mapping = { date: '', amount: '', merchant: '' };
  const lowerHeaders = headers.map(h => h.toLowerCase());

  // Heuristics
  mapping.date = headers[lowerHeaders.findIndex(h => h.includes('date') || h.includes('time'))] || '';
  mapping.amount = headers[lowerHeaders.findIndex(h => h.includes('amount') || h.includes('debit') || h.includes('value'))] || '';
  mapping.merchant = headers[lowerHeaders.findIndex(h => h.includes('description') || h.includes('merchant') || h.includes('payee') || h.includes('memo'))] || '';

  return mapping;
};

// --- 5. Smart Merchant Cleaning ---
const cleanMerchantName = (rawName) => {
  if (!rawName) return 'Unknown Merchant';
  let name = rawName.trim();

  // 1. Remove prefixes like "QDI*" or "SQ *"
  // Matches: "TEXT*" or "TEXT *" at start
  name = name.replace(/^[A-Z0-9]+\s?\*/, '');

  // 2. Remove "Store #123" or "#123" patterns
  // Matches: " Store #123", " #1234", " # 123"
  name = name.replace(/\s?(Store|Shop)?\s?#\s?\d+/gi, '');

  // 3. Remove trailing sequences of 3+ digits (often store IDs or dates)
  // Matches: " 12345" at end of string, but keeps "7-Eleven"
  name = name.replace(/\s\d{3,}$/, '');

  // 4. Remove common junk words
  name = name.replace(/(PYPL|PAYPAL|SQC|TST)\s?/gi, '');

  // 5. Duplicate substring cleanup (e.g., "Hostinger Hostinger.c")
  // This is a simple heuristic: if the first word repeats, drop the rest
  const parts = name.split(' ');
  if (parts.length > 1 && parts[1].toLowerCase().includes(parts[0].toLowerCase())) {
    name = parts[0];
  }

  // 6. Capitalize nicely (Title Case)
  return name
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
    .trim();
};

// --- 6. Normalization ---
// Converts "Bank Format" -> "Zillion Format" using the mapping
export const normalizeImportRows = (rows, mapping) => {
  return rows.map(row => {
    // Amount Logic
    let rawAmount = row[mapping.amount];
    if (typeof rawAmount === 'string') rawAmount = rawAmount.replace(/[$,]/g, '');
    let amount = parseFloat(rawAmount);
    
    // Date Logic
    let date = row[mapping.date];
    try {
        const d = new Date(date);
        if (!isNaN(d)) date = d.toISOString().split('T')[0];
    } catch (e) { }

    return {
      tempId: nanoid(), // Unique ID for this import session
      date: date,
      merchant: cleanMerchantName(row[mapping.merchant]), // Apply cleaning here
      originalMerchant: row[mapping.merchant], // Keep original just in case
      amount: Math.abs(amount),
      isIncome: amount > 0,
      originalData: row
    };
  });
};