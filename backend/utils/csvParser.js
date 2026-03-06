const { parse } = require('csv-parse/sync');

// Auto detect category from description
const detectCategory = (description) => {
  const text = description.toLowerCase();

  if (['swiggy', 'zomato', 'dominos', 'pizza',
       'restaurant', 'cafe', 'food', 'tea',
       'chai', 'burger', 'biryani'].some(k => text.includes(k)))
    return 'Food';

  if (['uber', 'ola', 'rapido', 'petrol', 'diesel',
       'metro', 'irctc', 'railway', 'flight',
       'bus', 'auto'].some(k => text.includes(k)))
    return 'Travel';

  if (['amazon', 'flipkart', 'myntra', 'meesho',
       'ajio', 'nykaa', 'shopping'].some(k => text.includes(k)))
    return 'Shopping';

  if (['netflix', 'spotify', 'prime', 'hotstar',
       'youtube', 'movie', 'bookmyshow'].some(k => text.includes(k)))
    return 'Entertainment';

  if (['blinkit', 'zepto', 'bigbasket', 'dmart',
       'grocery', 'supermarket'].some(k => text.includes(k)))
    return 'Grocery';

  if (['rent', 'house', 'pg', 'hostel',
       'maintenance'].some(k => text.includes(k)))
    return 'Rent';

  if (['hospital', 'medicine', 'doctor', 'pharmacy',
       'health', 'clinic'].some(k => text.includes(k)))
    return 'Health';

  if (['school', 'college', 'university', 'course',
       'udemy', 'education', 'book'].some(k => text.includes(k)))
    return 'Education';

  if (['electricity', 'water', 'gas', 'internet',
       'wifi', 'mobile', 'recharge', 'bill'].some(k => text.includes(k)))
    return 'Bills';

  if (['salary', 'payroll', 'stipend',
       'income'].some(k => text.includes(k)))
    return 'Salary';

  return 'Other';
};

// Parse amount — handle different formats
const parseAmount = (amountStr) => {
  if (!amountStr) return 0;
  const cleaned = amountStr
    .toString()
    .replace(/[₹,\s]/g, '')  // remove ₹ symbol and commas
    .trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : Math.abs(num);
};

// Parse date — handle different formats
const parseDate = (dateStr) => {
  if (!dateStr) return new Date();
  const cleaned = dateStr.toString().trim();

  // Try different formats
  const formats = [
    // DD/MM/YYYY
    /^(\d{2})\/(\d{2})\/(\d{4})$/,
    // DD-MM-YYYY
    /^(\d{2})-(\d{2})-(\d{4})$/,
    // YYYY-MM-DD
    /^(\d{4})-(\d{2})-(\d{2})$/,
  ];

  for (const format of formats) {
    const match = cleaned.match(format);
    if (match) {
      if (format === formats[2]) {
        return new Date(cleaned);
      }
      return new Date(`${match[3]}-${match[2]}-${match[1]}`);
    }
  }

  return new Date(cleaned) || new Date();
};

// Main parse function
const parseCSV = (fileBuffer) => {
  try {
    const records = parse(fileBuffer, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    const transactions = [];

    records.forEach((row) => {
      // Get all column names lowercase
      const keys = Object.keys(row).map(k => k.toLowerCase());
      const values = Object.values(row);
      const rowLower = {};
      keys.forEach((k, i) => { rowLower[k] = values[i]; });

      // Find description column
      const descKey = keys.find(k =>
        ['description', 'narration', 'particulars',
         'details', 'remarks', 'transaction details'].includes(k)
      );
      const description = descKey ? rowLower[descKey] : '';

      // Find date column
      const dateKey = keys.find(k =>
        ['date', 'transaction date', 'value date',
         'txn date', 'posting date'].includes(k)
      );
      const date = dateKey ? parseDate(rowLower[dateKey]) : new Date();

      // Find amount columns
      const debitKey = keys.find(k =>
        ['debit', 'withdrawal', 'dr', 'debit amount',
         'withdrawal amount', 'amount(dr)'].includes(k)
      );
      const creditKey = keys.find(k =>
        ['credit', 'deposit', 'cr', 'credit amount',
         'deposit amount', 'amount(cr)'].includes(k)
      );
      const amountKey = keys.find(k =>
        ['amount', 'transaction amount'].includes(k)
      );
      const typeKey = keys.find(k =>
        ['type', 'transaction type', 'dr/cr'].includes(k)
      );

      let amount = 0;
      let type = 'expense';

      if (debitKey && parseAmount(rowLower[debitKey]) > 0) {
        amount = parseAmount(rowLower[debitKey]);
        type = 'expense';
      } else if (creditKey && parseAmount(rowLower[creditKey]) > 0) {
        amount = parseAmount(rowLower[creditKey]);
        type = 'income';
      } else if (amountKey) {
        amount = parseAmount(rowLower[amountKey]);
        if (typeKey) {
          const typeVal = rowLower[typeKey]?.toLowerCase() || '';
          type = typeVal.includes('cr') || typeVal.includes('credit')
            ? 'income' : 'expense';
        }
      }

      if (amount > 0 && description) {
        transactions.push({
          type,
          amount,
          description,
          category: detectCategory(description),
          date,
          paymentMode: 'upi',
        });
      }
    });

    return { success: true, transactions };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

module.exports = { parseCSV };