import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const orderSuccessRate = new Rate('order_created');
const orderDuration = new Trend('order_duration');

const BASE_URL = 'http://localhost:3000';

const TEST_ITEMS = [
  { itemId: 6, sizeId: 1, sizeName: 'Kafer', price: 120 },
  { itemId: 6, sizeId: 2, sizeName: 'Hippie', price: 110 },
  { itemId: 6, sizeId: 3, sizeName: 'Bulli', price: 120 },
  { itemId: 18, sizeId: 3, sizeName: 'Bulli', price: 140 },
  { itemId: 69, sizeId: 1, sizeName: 'Kafer', price: 130 },
  { itemId: 69, sizeId: 2, sizeName: 'Hippie', price: 130 },
  { itemId: 69, sizeId: 3, sizeName: 'Bulli', price: 140 },
  { itemId: 70, sizeId: 1, sizeName: 'Kafer', price: 130 },
  { itemId: 70, sizeId: 2, sizeName: 'Hippie', price: 120 },
  { itemId: 70, sizeId: 3, sizeName: 'Bulli', price: 130 },
  { itemId: 81, sizeId: 1, sizeName: 'Kafer', price: 120 },
  { itemId: 81, sizeId: 2, sizeName: 'Hippie', price: 110 },
  { itemId: 81, sizeId: 3, sizeName: 'Bulli', price: 120 },
];

function getRandomItem() { return TEST_ITEMS[Math.floor(Math.random() * TEST_ITEMS.length)]; }
function getRandomPaymentMethod() { return Math.random() < 0.5 ? 'counter' : 'gcash'; }
function generateGCashReference() { const ts = Date.now().toString().slice(-10); const r = Math.floor(Math.random() * 1000).toString().padStart(3, '0'); return ts + r; }
const MOCK_GCASH_PHOTO = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

export const options = {
  scenarios: { steady_state: { executor: 'constant-vus', vus: 100, duration: '5m' } },
  thresholds: { 'http_req_duration': ['p(95)<3000'], 'http_req_failed': ['rate<0.10'], 'order_created': ['rate>0.90'], 'order_duration': ['p(95)<5000'] },
  tags: { test: 'order-flow-100vu' },
};

function taggedRequest(name, fn) { return fn(); }

export default function () {
  const item = getRandomItem();
  const paymentMethod = getRandomPaymentMethod();
  const isTakeout = Math.random() < 0.3;
  
  let res = taggedRequest('GET /api/menu', () => http.get(`${BASE_URL}/api/menu?unavailable=true`, { tags: { name: 'get_menu' } }));
  check(res, { 'menu fetched': (r) => r.status === 200, 'menu has items': (r) => r.json().length > 0 });
  sleep(Math.random() * 1 + 0.5);
  
  res = taggedRequest('GET /orders/:itemId', () => http.get(`${BASE_URL}/orders/${item.itemId}`, { tags: { name: 'get_order_detail' } }));
  check(res, { 'order detail fetched': (r) => r.status === 200 });
  sleep(Math.random() * 1 + 0.5);
  
  const orderPayload = { table_number: isTakeout ? 0 : Math.floor(Math.random() * 7) + 1, items: [{ itemId: item.itemId, sizeId: item.sizeId, quantity: 2, addOnIds: [] }], payment_method: paymentMethod, ...(paymentMethod === 'gcash' && { gcash_reference: generateGCashReference(), gcash_photo: MOCK_GCASH_PHOTO }), order_type: isTakeout ? 'takeout' : 'dine_in' };
  
  const orderStart = Date.now();
  res = taggedRequest('POST /api/orders', () => http.post(`${BASE_URL}/api/orders`, JSON.stringify(orderPayload), { headers: { 'Content-Type': 'application/json' }, tags: { name: 'create_order' } }));
  const orderDurationMs = Date.now() - orderStart;
  orderDuration.add(orderDurationMs);
  
  const orderSuccess = check(res, { 'order created': (r) => r.status === 201 || r.status === 200, 'order has order_id': (r) => { try { const b = r.json(); return b.order_id || b.id; } catch { return false; } } });
  orderSuccessRate.add(orderSuccess);
  if (!orderSuccess) console.log(`Order failed: ${res.status} ${res.body}`);
  
  sleep(Math.random() * 2 + 1);
  
  if (orderSuccess) {
    try {
      const orderData = res.json();
      const orderId = orderData.order_id || orderData.id;
      if (orderId) {
        res = taggedRequest('GET /order-confirmation', () => http.get(`${BASE_URL}/order-confirmation?orderId=${orderId}`, { tags: { name: 'get_confirmation' } }));
        check(res, { 'confirmation page loaded': (r) => r.status === 200 });
      }
    } catch (e) {}
  }
  sleep(Math.random() * 3 + 2);
}

export function handleSummary(data) { return { 'stdout': textSummary(data), 'results.json': JSON.stringify(data) }; }

function textSummary(data) {
  const i = ' '; let o = '\n';
  o += `${i}=== k6 Test Summary (100 VU Steady-State) ===\n`;
  o += `${i}Total requests: ${data.metrics.http_reqs?.values?.count || 0}\n`;
  o += `${i}Failed requests: ${data.metrics.http_req_failed?.values?.rate || 0}\n`;
  o += `${i}Avg duration: ${data.metrics.http_req_duration?.values?.avg || 0}ms\n`;
  const h = data.metrics.http_req_duration?.values || {};
  o += `${i}p95 duration: ${h['p(95)'] !== undefined ? h['p(95)'] : 'N/A'}ms\n`;
  o += `${i}p99 duration: ${h['p(99)'] !== undefined ? h['p(99)'] : 'N/A'}ms\n`;
  o += `${i}Order success rate: ${data.metrics.order_created?.values?.rate || 0}\n`;
  o += `${i}Order duration p95: ${data.metrics.order_duration?.values?.['p(95)'] !== undefined ? data.metrics.order_duration?.values?.['p(95)'] : 'N/A'}ms\n`;
  o += `\n${i}=== Thresholds ===\n`;
  for (const [n, t] of Object.entries(data.thresholds || {})) o += `${i}${t.ok ? '✓' : '✗'} ${n}: ${t.threshold}\n`;
  return o;
}