import { doc, getDoc, writeBatch, collection } from 'firebase/firestore';
import { db } from '../config/firebase';

export const migrateTransactionsToSubCollection = async (userId) => {
  const appId = 'zillion-budget-app';
  const mainDocRef = doc(db, `/artifacts/${appId}/users/${userId}/budget/main`);
  const transactionsCollectionRef = collection(db, `/artifacts/${appId}/users/${userId}/budget/main/transactions`);

  try {
    const docSnap = await getDoc(mainDocRef);
    if (!docSnap.exists()) throw new Error("Budget document not found");

    const data = docSnap.data();
    const batch = writeBatch(db);
    let operationCount = 0;
    const MAX_BATCH_SIZE = 450; // Firestore limit is 500

    const monthlyData = data.monthlyData || {};
    let totalMoved = 0;

    // 1. Iterate through all months and move transactions
    for (const [monthKey, monthData] of Object.entries(monthlyData)) {
      if (monthData.transactions && monthData.transactions.length > 0) {
        
        for (const tx of monthData.transactions) {
          const newDocRef = doc(transactionsCollectionRef, tx.id);
          // Ensure date exists for querying
          const txDate = tx.date || `${monthKey}-01`;
          
          batch.set(newDocRef, {
            ...tx,
            date:TXDate
          });
          
          operationCount++;
          totalMoved++;

          // Commit batches periodically
          if (operationCount >= MAX_BATCH_SIZE) {
            await batch.commit();
            operationCount = 0;
          }
        }
        
        // Clear transactions from the main document object in memory
        monthlyData[monthKey].transactions = [];
      }
    }

    // 2. Update the main document to remove the old transactions arrays
    batch.update(mainDocRef, { monthlyData: monthlyData });
    
    // Final commit
    await batch.commit();
    
    return { success: true, count: totalMoved };

  } catch (error) {
    console.error("Migration failed:", error);
    return { success: false, error: error.message };
  }
};