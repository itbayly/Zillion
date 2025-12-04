import { GoogleGenerativeAI } from "@google/generative-ai";

// ⚠️ Ensure this key is correct and has no extra spaces/quotes
const API_KEY = "AIzaSyAa-V7Q1Ly9r_Sc0tFUSTrSG2w_NNYExCs"; 

const genAI = new GoogleGenerativeAI(API_KEY);

export const categorizeTransactions = async (transactions, categories) => {
  try {
    // Safety check for data
    if (!categories || categories.length === 0) {
      throw new Error("No categories found to map against.");
    }

    // Updated to use the available Gemini 2.0 Flash model
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // 1. Prepare the data
    const uniqueMerchants = [...new Set(transactions.map(t => t.merchant))];
    
    // Create a simplified category list
    const categoryMap = categories.flatMap(cat => 
      cat.subcategories.map(sub => `${cat.name}: ${sub.name} (ID: ${sub.id})`)
    ).join('\n');

    const prompt = `
      You are a financial assistant. Map these merchant names to the provided Category IDs.
      
      My Categories:
      ${categoryMap}
      
      Merchants:
      ${JSON.stringify(uniqueMerchants)}

      Instructions:
      - Return a raw JSON object. 
      - Format: { "Merchant Name": "CategoryID" }
      - Do not use Markdown formatting (no \`\`\`json).
      - If no good match exists, do not include that merchant in the object.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log("Gemini Raw Response:", text); // Debugging

    // 2. Robust JSON Extraction
    // Finds the first { and last } to ignore conversational filler
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
        throw new Error("AI response did not contain valid JSON.");
    }

    const cleanJson = jsonMatch[0];
    const mapping = JSON.parse(cleanJson);

    return mapping; 

  } catch (error) {
    console.error("Gemini Categorization Failed:", error);

    // --- Diagnostic: List Available Models ---
    // This runs a raw fetch to see what models your key is allowed to access
    try {
        console.log("Attempting to list available models for your key...");
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`);
        const data = await response.json();
        
        if (data.models) {
            console.log("✅ AVAILABLE MODELS:", data.models.map(m => m.name));
            alert(`Model Check: Your key has access to: \n${data.models.map(m => m.name.replace('models/', '')).join(', ')}\n\nPlease check the Console (F12) for the full list.`);
        } else {
            console.error("❌ Could not list models. Error:", data);
            alert("Could not list models. Ensure the 'Generative Language API' is enabled in your Google Cloud Console.");
        }
    } catch (listError) {
        console.error("Diagnostic check failed:", listError);
    }

    return null;
  }
};