import { PersianQueryParser } from './libs/persian-query-parser/src/lib/persian-query-parser';

const parser = new PersianQueryParser();

// Test cases
const queries = [
  'خانه ۲ خوابه تا ۲ تومن',
  'آپارتمان ۲ خوابه بین ۱۸۰۰ تا ۲۵۰۰ تومن',
  'ویلا نوساز ۳ خوابه حداکثر ۳ تومن',
  'زمین سنددار',
  'کلنگی ۵۰۰ متر',
];

console.log('=== Testing Persian Query Parser ===\n');

queries.forEach((query) => {
  console.log(`Input: ${query}`);
  const result = parser.parseQuery(query);
  console.log('Parsed:', JSON.stringify(result, null, 2));
  console.log('---');
});
