/**
 * Smart CSV Parser for SpendSense AI
 * A premier data hygiene engine specialized for Indian UPI and banking strings.
 */

const MERCHANT_CLEAN_REGEX = [
  /UPI\/[0-9]{12}\//i, // Strip UPI transaction IDs
  /VPA\/[^\/]+\//i,      // Strip Virtual Private addresses
  /REF[0-9]+\//i,       // Strip Reference codes
  /ONL[^\/]+\//i,       // Strip Online codes
  /BANK[^\/]+\//i,      // Strip Bank indicators 
  /[0-9]{12}/,          // Strip standalone 12-digit numbers
  /TRANSFER TO/i,      // Strip common transfer prefixes
  /SENT TO/i,
  /DEBIT/i,
  /CREDIT/i,
  /[-]?[0-9,]+/        // Strip numeric noise
];

const cleanMerchantName = (rawName: string): string => {
  if (!rawName) return "Unknown Merchant";
  
  let clean = rawName.trim();

  // 1. Remove Bank codes, IDs, and common prefixes
  MERCHANT_CLEAN_REGEX.forEach(regex => {
    clean = clean.replace(regex, "");
  });

  // 2. PAYTM/UPI FIX: Strip common narrative prefixes
  clean = clean.replace(/Paid to\s+/i, "");
  clean = clean.replace(/Refund from\s+/i, "");
  clean = clean.replace(/Money Sent to\s+/i, "");
  clean = clean.replace(/Sent to\s+/i, "");
  clean = clean.replace(/Received from\s+/i, "");

  // 3. Handle UPI path (e.g. UPI/123/ZOMATO/PYTM)
  if (clean.includes("/")) {
    const parts = clean.split("/").filter(p => p.length > 2 && !/[0-9]{4}/.test(p));
    if (parts.length > 0) clean = parts[0];
  }

  // 4. Remove excess whitespace and normalize
  clean = clean.replace(/\s+/g, " ").trim();

  // 5. Fuzzy normalization for common giants
  const m = clean.toLowerCase();
  if (m.includes("swiggy")) return "Swiggy";
  if (m.includes("zomato")) return "Zomato";
  if (m.includes("amazon")) return "Amazon";
  if (m.includes("flipkart")) return "Flipkart";
  if (m.includes("uber")) return "Uber";
  if (m.includes("ola")) return "Ola";
  if (m.includes("netflix")) return "Netflix";
  if (m.includes("spotify")) return "Spotify";
  if (m.includes("jio") || m.includes("airtel") || m.includes("vodafone") || m.includes("bsnl")) return "Telecom/Internet";
  if (m.includes("electric") || m.includes("bescom") || m.includes("power") || m.includes("recharge")) return "Utilities/Bills";
  if (m.includes("lic") || m.includes("premium")) return "Insurance";

  return clean || "Unknown Merchant";
};

const categorize = (merchant: string) => {
  const m = merchant.toLowerCase();

  const categories = {
    Food: ["swiggy", "zomato", "restaurant", "cafe", "bk", "mcdonalds", "starbucks", "domino", "blinkit", "zepto"],
    Travel: ["uber", "ola", "irctc", "indigo", "air", "makemytrip", "travel", "ride", "auto", "metro"],
    Shopping: ["amazon", "flipkart", "myntra", "ajio", "mall", "shopping", "clothes", "fashion", "nykaa"],
    Entertainment: ["netflix", "spotify", "prime", "movie", "pvr", "cinema", "gaming", "steam", "bookmyshow"],
    Transport: ["petrol", "fuel", "hpcl", "bpcl", "fueling", "toll", "parking", "fastag"],
    Bills: ["electric", "bill", "water", "recharge", "internet", "broadband", "jio", "airtel", "gas"],
    Health: ["apollo", "pharmacy", "medical", "hospital", "pharmeasy", "doctor", "gym", "tata 1mg"],
    Finance: ["investment", "shares", "zerodha", "upstox", "mutual", "insurance", "lic", "groww", "indmoney"]
  };

  for (const [cat, keywords] of Object.entries(categories)) {
    if (keywords.some(k => m.includes(k))) return cat;
  }

  return "Other";
};

// 4. Indian Date Intelligence (Force DD/MM/YYYY or MMM DD, YYYY)
const decodeIndianDate = (str: string): string => {
  if (!str || str === "undefined") return new Date().toISOString();
  
  // Pattern 1: DD/MM/YYYY or DD-MM-YYYY
  const ddmmyyyy = str.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
  if (ddmmyyyy) {
    let [_, d, m, y] = ddmmyyyy;
    if (y.length === 2) y = "20" + y; // Handle short year 24 -> 2024
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}T12:00:00.000Z`;
  }

  // Pattern 2: MMM DD, YYYY (PhonePe / GPay style: "Apr 03, 2026")
  const mmmddyyyy = str.match(/([a-z]{3})\s+(\d{1,2}),?\s+(\d{4})/i);
  if (mmmddyyyy) {
    const [_, m, d, y] = mmmddyyyy;
    const months: Record<string, string> = { jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06", jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12" };
    const month = months[m.toLowerCase()] || "01";
    return `${y}-${month}-${d.padStart(2, '0')}T12:00:00.000Z`;
  }

  // Pattern 3: DD MMM YYYY (Paytm style: "05 Apr 2024")
  const ddmmmyyyy = str.match(/(\d{1,2})\s+([a-z]{3})\s+(\d{4})/i);
  if (ddmmmyyyy) {
    const [_, d, m, y] = ddmmmyyyy;
    const months: Record<string, string> = { jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06", jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12" };
    const month = months[m.toLowerCase()] || "01";
    return `${y}-${month}-${d.padStart(2, '0')}T12:00:00.000Z`;
  }

  // Fallback to standard parser
  try {
    const d = new Date(str);
    return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
  } catch {
    return new Date().toISOString();
  }
};

export const smartParse = (rows: any[]) => {
  const detect = (row: any, keys: string[]) => {
    for (const key of keys) {
      if (row[key] !== undefined && row[key] !== null && String(row[key]).trim() !== "") return row[key];
    }
    return null;
  };

  const results = rows.map((row: any) => {
    // Detect Merchant Detail (Paytm specific aliases included)
    const rawMerchant = detect(row, [
      "merchant", "Merchant", "description", "Description", 
      "Transaction Details", "Remarks", "Details", "Narrative",
      "Particulars", "Transaction Desc", "Narration", "Activity",
      "Paid to", "Source/Destination", "Beneficiary Name", "Merchant Name", "Product"
    ]) || "Unknown";

    const merchant = cleanMerchantName(rawMerchant);

    // Detect Amount Detail (Paytm specific aliases included)
    const rawAmount = detect(row, [
      "amount", "Amount", "Transaction Amount", "Debit", 
      "Withdrawal", "Paid Amount", "Value", "Withdrawal (Dr)",
      "Debit Amount", "Amount (INR)", "Paid", "Paid (INR)",
      "Transaction Value", "Amount (Rs)"
    ]) || 0;

    // Strict Amount Scrubber (NaN Prevention)
    // We remove commas and currency symbols, but PROTECT the decimal dot.
    const amountStr = String(rawAmount).replace(/,/g, "").replace(/[₹$Rs ]/gi, "").trim();
    const parsedAmount = parseFloat(amountStr);
    const amount = !isNaN(parsedAmount) ? Math.abs(parsedAmount) : 0;

    // Detect Date Detail (Paytm specific aliases included)
    const rawDate = detect(row, [
      "date", "Date", "Transaction Date", "Txn Date", "Posting Date",
      "Value Date", "Value Date (DD/MM/YYYY)", "Tran Date", "Date (IST)", "Time"
    ]);

    const date = decodeIndianDate(String(rawDate || ""));

    // Validation Check: If amount is 0 and merchant is unknown or generic, discard
    if (amount === 0 && (merchant.toLowerCase().includes("unknown") || merchant.trim().length <= 2)) return null;
    
    // Validation Check: If date is current (fallback) and amount is 0, skip
    if (amount === 0 && String(rawDate || "").length < 2) return null;

    return {
      id: crypto.randomUUID(),
      merchant,
      amount,
      date,
      category: categorize(merchant)
    };
  });

  // Filter out null rows (junk/summaries)
  return results.filter(r => r !== null);
};