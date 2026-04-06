import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import DashboardLayout from "../components/layout/DashboardLayout"
import Papa from "papaparse"
import * as XLSX from "xlsx"
import { useTransactions } from "../context/TransactionsContext"
import { supabase } from "../lib/supabase"
import { smartParse } from "../utils/smartCsvParser"

const Upload = () => {
  const navigate = useNavigate()
  const { transactions, setTransactions, refreshTransactions, clearAllTransactions } = useTransactions()
  const [isScanning, setIsScanning] = useState(false)
  const [history, setHistory] = useState<any[]>([])

  // Initialize PDF.js Worker with high-availability CDN
  useEffect(() => {
    if (typeof window !== "undefined" && !(window as any).pdfjsLib) {
      const script = document.createElement("script")
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"
      script.onload = () => {
        const pdfjsLib = (window as any).pdfjsLib;
        pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
      }
      document.head.appendChild(script)
    }
  }, [])

// PDF Parsing Utility (Greedy Multi-Pass Scanner)
const parsePdf = async (file: File): Promise<any[]> => {
  const arrayBuffer = await file.arrayBuffer()
  const pdfjsLib = (window as any).pdfjsLib;
  if (!pdfjsLib) throw new Error("PDF.js not loaded");

  // Fix for tracking prevention: disablePreferences prevents localStorage usage
  const loadingTask = pdfjsLib.getDocument({
    data: arrayBuffer,
    disablePreferences: true,
    verbosity: 0 // Silences console noise
  });

  const pdf = await loadingTask.promise
  let fragments: string[] = []
  
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    fragments = [...fragments, ...content.items.map((item: any) => item.str)]
  }

  // UNIVERSAL PATTERN SCANNER
  const rows: any[] = []
  
  // UNIVERSAL DATE PATTERNS: 
  // Supports: DD/MM/YYYY, DD-MM-YYYY, MMM DD, YYYY (PhonePe), DD MMM YYYY (Paytm)
  const dateRegex = /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})|([a-z]{3}\s+\d{1,2},?\s+\d{4})|(\d{1,2}\s+[a-z]{3}\s+\d{4})/i
  
  for (let i = 0; i < fragments.length; i++) {
    const fragment = fragments[i].trim()
    if (dateRegex.test(fragment)) {
      const date = fragment
      let merchant = ""
      let amount = ""

      // GREEDY LOOK-AHEAD: Scan next 15 fragments for Merchant + Amount
      for (let j = 1; j <= 15 && (i + j) < fragments.length; j++) {
        const next = fragments[i + j].trim()
        
        // UNIVERSAL AMOUNT MATCH: ₹500, Rs. 1,139, 500.00, 12,345
        // Matches digits with optional currency prefix and mandatory numeric core
        const amountMatch = next.match(/^(₹|Rs\.?)?\s*([0-9,]+(\.[0-9]{2})?)$/)
        
        if (amountMatch && !amount) {
          const rawAmt = amountMatch[2].replace(/,/g, "")
          if (parseFloat(rawAmt) > 0) amount = rawAmt
        } else if (next.length > 3 && !amount && !dateRegex.test(next)) {
          // Heuristic: If it's not a date, not an amount, and > 3 chars, it's narrative
          if (!/txn|ref|utr|balance|status|id:|page|statement/i.test(next)) {
            merchant += " " + next
          }
        }
      }

      if (date && amount && merchant.trim().length > 2) {
        rows.push({
          date,
          merchant: merchant.trim(),
          amount: parseFloat(amount)
        })
        i += 4 // Optimization: Jump ahead
      }
    }
  }
  
  return rows
}

// Robust Header Hunter: Scans a 2D array for the first row that looks like a transaction header
const findHeaderRow = (rows: any[][]): { index: number, headers: string[] } | null => {
  const keywords = ["date", "amount", "merchant", "description", "details", "paid", "activity", "source", "product", "txn", "status", "balance", "vpa", "ref"];
  
  for (let i = 0; i < Math.min(rows.length, 50); i++) { // Scan first 50 rows
    const row = rows[i];
    if (!row || !Array.isArray(row)) continue;
    
    const stringRow = row.map(cell => String(cell || "").toLowerCase());
    const matchCount = stringRow.filter(cell => 
      keywords.some(k => cell.includes(k))
    ).length;

    // If at least 2 columns match common transaction headers, we've found it
    if (matchCount >= 2) {
      return { index: i, headers: row.map(h => String(h || "").trim()) };
    }
  }
  return null;
};

// Upload Handler
const handleFileUpload = async (
  event: React.ChangeEvent<HTMLInputElement> | any
) => {
  setIsScanning(true)
  const file = event.target?.files?.[0] || event.dataTransfer?.files?.[0]
  if (!file) {
    setIsScanning(false)
    return
  }

  const type = file.name.split(".").pop()?.toLowerCase().trim()
  console.log("File Type:", type)

  try {
    // CSV Upload (Multi-Pass Robust Parser)
    if(type === "csv"){
      Papa.parse(file, {
        skipEmptyLines: true,
        complete: async (results: any) => {
          let finalData = [];
          
          // Try 1: Standard Auto-Header parsing
          const headerRows = findHeaderRow(results.data);
          if (headerRows) {
            const { index, headers } = headerRows;
            const tabularData = results.data.slice(index + 1).map((row: any[]) => {
              const obj: any = {};
              headers.forEach((h, i) => { if(h) obj[h] = row[i]; });
              return obj;
            });
            finalData = smartParse(tabularData);
          } else {
            // Try 2: Simple mapping if no header row found
            finalData = smartParse(results.data);
          }

          if (finalData.length === 0) {
            alert("No transactions found. Please ensure the CSV has column names like 'Date' and 'Amount'.");
          } else {
            await insertTransactions(finalData, file.name);
          }
          setIsScanning(false);
        },
        error: (err) => {
          console.log("CSV Error:", err);
          setIsScanning(false);
        }
      });
    }
    // Excel Upload (MULTI-SHEET SCANNING UPGRADE)
    else if(type === "xlsx" || type === "xls"){
      const reader = new FileReader()
      reader.onload = async(e:any)=>{
        const data = new Uint8Array(e.target.result)
        const workbook = XLSX.read(data, { type: "array" })
        
        // SCAN ALL SHEETS FOR TRANSACTIONS
        let allParsedTransactions: any[] = [];
        let sheetsScanned = 0;

        for (const sheetName of workbook.SheetNames) {
          const sheet = workbook.Sheets[sheetName]
          const rawRows = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][]
          const headerInfo = findHeaderRow(rawRows);
          
          if (headerInfo) {
            const { index, headers } = headerInfo;
            const tabularData = rawRows.slice(index + 1).map(row => {
              const obj: any = {};
              headers.forEach((h, i) => { if(h) obj[h] = row[i]; });
              return obj;
            });
            const sheetTransactions = smartParse(tabularData);
            if (sheetTransactions.length > 0) {
              allParsedTransactions = [...allParsedTransactions, ...sheetTransactions];
            }
          }
          sheetsScanned++;
        }

        // Fallback: If NO sheets had headers, try a blind parse on Sheet 1
        if (allParsedTransactions.length === 0 && workbook.SheetNames.length > 0) {
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const json = XLSX.utils.sheet_to_json(firstSheet);
          allParsedTransactions = smartParse(json);
        }

        if (allParsedTransactions.length === 0) {
          alert("No transactions identified. Ensure your Excel file has a 'Transaction History' sheet with 'Date' and 'Amount'.");
        } else {
          await insertTransactions(allParsedTransactions, file.name);
        }
        setIsScanning(false);
      }
      reader.readAsArrayBuffer(file)
    }
    // PDF Upload (Patterns)
    else if(type === "pdf"){
      const rows = await parsePdf(file)
      const parsedData = smartParse(rows)
      
      if (parsedData.length === 0) {
        alert("No clear transactions found in this PDF. Please ensure it's a standard bank statement download.");
      } else {
        await insertTransactions(parsedData, file.name);
      }
      setIsScanning(false)
    }
    else {
      alert("Unsupported file format")
      setIsScanning(false)
    }
  } catch (err) {
    console.error("Upload Error:", err)
    setIsScanning(false)
    alert("Statement Scan Failed: Please check the file format.")
  }
}


// Insert to Supabase

const insertTransactions =
async(parsedData:any[], currentFileName: string)=>{

// Update Local State Immediately
setTransactions(prev => [...prev, ...parsedData])


// History
setHistory(prev => [
...prev,
{
name: currentFileName,
status: "Success"
}
])

// Supabase Sync
try {
const { data: userData, error: userError } =
await supabase.auth.getUser()

if(userError || !userData?.user){
console.log("Supabase Auth Skip/Error:", userError)
// Still loaded locally, so we don't return early with an error
return
}

const user = userData.user
const formatted =
parsedData.map((t:any)=>({

merchant: t.merchant,
category: t.category,
amount: Number(t.amount || 0),
date: t.date,
user_id: user.id

}))


const { error: insertError } =
await supabase
.from("transactions")
.insert(formatted)

      if(insertError){
        console.log("Supabase Insert Error:", insertError)
        alert("Data loaded locally, but failed to sync with Cloud: " + insertError.message)
      } else {
        // Minor delay to let DB index catch up before final refresh
        setTimeout(async () => {
          await refreshTransactions()
        }, 1000)
      }
} catch (err) {
console.error("Sync Exception:", err)
}


// Navigate
setTimeout(()=>{
navigate("/transactions")
},1500)

}


// Drag Drop

const handleDrop = (e:any)=>{
e.preventDefault()
handleFileUpload(e)
}


// Clear

const clearData = async ()=>{

  if (window.confirm("Are you sure? This will permanently delete all transactions from local and cloud storage.")) {
    await clearAllTransactions()
    setHistory([])
  }

}


// Stats

const totalTransactions =
transactions.length

const categories =
new Set(
transactions.map(t=>t.category)
).size

const merchants =
new Set(
transactions.map(t=>t.merchant)
).size

const savings =
Math.floor(

transactions.reduce(
(sum,t)=>
sum + Number(t.amount || 0),
0
) * 0.05

)


return (

<DashboardLayout>

      <div className="space-y-8 relative">
        
        {/* SCANNING OVERLAY */}
        {isScanning && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md z-50 rounded-3xl flex flex-col items-center justify-center space-y-6">
             <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
             <div className="text-center">
                <h2 className="text-2xl font-black text-white">Scanning Document</h2>
                <p className="text-sm opacity-60">AI is extracting transactions from your statement...</p>
             </div>
          </div>
        )}

        {/* Header */}
        <div className="flex justify-between">

<div>

<h1 className="text-3xl font-bold">
Upload Transactions
</h1>

<p className="opacity-60">
Upload CSV, Excel, PDF or Bank Statement
</p>

</div>

<button
onClick={clearData}
className="bg-red-500/10 px-4 py-2 rounded-lg"
>

Clear Data

</button>

</div>


{/* Upload Options */}

<div className="grid grid-cols-1 md:grid-cols-3 gap-6">


{/* CSV */}

<label className="bg-surface-container-low p-6 rounded-xl cursor-pointer">

<h3 className="font-bold">
Upload CSV
</h3>

<p className="opacity-60 text-sm">
Paytm, PhonePe, GPay
</p>

<input
type="file"
accept=".csv"
className="hidden"
onChange={handleFileUpload}
/>

</label>


{/* Excel */}

<label className="bg-surface-container-low p-6 rounded-xl cursor-pointer">

<h3 className="font-bold">
Upload Excel
</h3>

<p className="opacity-60 text-sm">
Bank Statements
</p>

<input
type="file"
accept=".xlsx,.xls"
className="hidden"
onChange={handleFileUpload}
/>

</label>


{/* PDF */}

<label className="bg-surface-container-low p-6 rounded-xl cursor-pointer">

<h3 className="font-bold">
Upload PDF
</h3>

<p className="opacity-60 text-sm">
Credit Card / Bank PDF
</p>

<input
type="file"
accept=".pdf"
className="hidden"
onChange={handleFileUpload}
/>

</label>


</div>


{/* Drag Drop */}

<div
className="border-2 border-dashed p-10 text-center rounded-xl"
onDrop={handleDrop}
onDragOver={(e)=>e.preventDefault()}
>

Drag & Drop Bank Statement Here

</div>


{/* Stats */}

<div className="grid grid-cols-1 md:grid-cols-4 gap-6">

<div className="bg-surface-container-low p-6 rounded-xl">
Transactions
<h3 className="text-2xl font-bold">
{totalTransactions}
</h3>
</div>

<div className="bg-surface-container-low p-6 rounded-xl">
Categories
<h3 className="text-2xl font-bold">
{categories}
</h3>
</div>

<div className="bg-surface-container-low p-6 rounded-xl">
Merchants
<h3 className="text-2xl font-bold">
{merchants}
</h3>
</div>

<div className="bg-primary/10 p-6 rounded-xl">
Savings
<h3 className="text-2xl font-bold">
₹{savings}
</h3>
</div>

</div>


{/* Preview */}

<div className="bg-surface-container-low p-6 rounded-xl">

<h3 className="font-bold mb-4">
Preview
</h3>

<table className="w-full">

<thead>

<tr>

<th>Merchant</th>
<th>Category</th>
<th>Amount</th>
<th>Date</th>

</tr>

</thead>

<tbody>

{transactions.slice(0,5).map((t,index)=>(

<tr key={index}>

<td>{t.merchant}</td>
<td>{t.category}</td>
<td>₹{t.amount}</td>
<td>{t.date}</td>

</tr>

))}

</tbody>

</table>

</div>


{/* Upload History */}

<div className="bg-surface-container-low p-6 rounded-xl">

<h3 className="font-bold mb-4">
Upload History
</h3>

{history.map((h,index)=>(

<div
key={index}
className="flex justify-between py-2"
>

<span>{h.name}</span>

<span className="text-green-400">
{h.status}
</span>

</div>

))}

</div>

</div>

</DashboardLayout>

)

}

export default Upload