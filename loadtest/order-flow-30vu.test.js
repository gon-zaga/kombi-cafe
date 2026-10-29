import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const orderSuccessRate = new Rate('order_created');
const orderDuration = new Trend('order_duration');

// Test configuration
const BASE_URL = 'http://localhost:3000';

// Test items: { itemId, sizeId, sizeName, price }
const TEST_ITEMS = [
  { itemId: 6, sizeId: 1, sizeName: 'Kafer', price: 120 },   // Caramel Latte
  { itemId: 6, sizeId: 2, sizeName: 'Hippie', price: 110 },   // Caramel Latte
  { itemId: 6, sizeId: 3, sizeName: 'Bulli', price: 120 },    // Caramel Latte
  { itemId: 18, sizeId: 3, sizeName: 'Bulli', price: 140 },   // Hazelnut Mocha
  { itemId: 69, sizeId: 1, sizeName: 'Kafer', price: 130 },   // Dark Babyccino
  { itemId: 69, sizeId: 2, sizeName: 'Hippie', price: 130 },  // Dark Babyccino
  { itemId: 69, sizeId: 3, sizeName: 'Bulli', price: 140 },   // Dark Babyccino
  { itemId: 70, sizeId: 1, sizeName: 'Kafer', price: 130 },   // Babyccino
  { itemId: 70, sizeId: 2, sizeName: 'Hippie', price: 120 },  // Babyccino
  { itemId: 70, sizeId: 3, sizeName: 'Bulli', price: 130 },   // Babyccino
  { itemId: 81, sizeId: 1, sizeName: 'Kafer', price: 120 },   // John Lemon Ginger
  { itemId: 81, sizeId: 2, sizeName: 'Hippie', price: 110 },  // John Lemon Ginger
  { itemId: 81, sizeId: 3, sizeName: 'Bulli', price: 120 },   // John Lemon Ginger
];

// Pick random item for each VU iteration
function getRandomItem() {
  return TEST_ITEMS[Math.floor(Math.random() * TEST_ITEMS.length)];
}

// Pick random payment method
function getRandomPaymentMethod() {
  return Math.random() < 0.5 ? 'counter' : 'gcash';
}

// Generate unique 13-digit GCash reference per order
function generateGCashReference() {
  const timestamp = Date.now().toString().slice(-10);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return timestamp + random;
}

// Mock GCash photo (base64 1x1px transparent PNG)
const MOCK_GCASH_PHOTO = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

export const options = {
  scenarios: {
    steady_state: {
      executor: 'constant-vus',
      vus: 30,
      duration: '5m',
    },
  },
  thresholds: {
    'http_req_duration': ['p(95)<3000'],
    'http_req_failed': ['rate<0.10'],
    'order_created': ['rate>0.90'],
    'order_duration': ['p(95)<5000'],
  },
  tags: {
    test: 'order-flow-30vu',
  },
};

// Helper: make request with tags
function taggedRequest(name, fn) {
  const res = fn();
  return res;
}

export default function () {
  const item = getRandomItem();
  const paymentMethod = getRandomPaymentMethod();
  const isTakeout = Math.random() < 0.3;
  
  // Step 1: Fetch menu
  let res = taggedRequest('GET /api/menu', () => 
    http.get(`${BASE_URL}/api/menu?unavailable=true`, {
      tags: { name: 'get_menu' },
    })
  );
  
  check(res, {
    'menu fetched': (r) => r.status === 200,
    'menu has items': (r) => r.json().length > 0,
  });
  
  sleep(Math.random() * 1 + 0.5);
  
  // Step 2: Fetch order detail page
  res = taggedRequest('GET /orders/:itemId', () =>
    http.get(`${BASE_URL}/orders/${item.itemId}`, {
      tags: { name: 'get_order_detail' },
    })
  );
  
  check(res, {
    'order detail fetched': (r) => r.status === 200,
  });
  
  sleep(Math.random() * 1 + 0.5);
  
  // Step 3: Place order with quantity=2
  const orderPayload = {
    table_number: isTakeout ? 0 : Math.floor(Math.random() * 7) + 1,
    items: [{
      itemId: item.itemId,
      sizeId: item.sizeId,
      quantity: 2,
      addOnIds: [],
    }],
    payment_method: paymentMethod,
    ...(paymentMethod === 'gcash' && { 
      gcash_reference: generateGCashReference(),
      gcash_photo: MOCK_GCASH_PHOTO 
    }),
    order_type: isTakeout ? 'takeout' : 'dine_in',
  };
  
  const orderStart = Date.now();
  res = taggedRequest('POST /api/orders', () =>
    http.post(`${BASE_URL}/api/orders`, JSON.stringify(orderPayload), {
      headers: { 'Content-Type': 'application/json' },
      tags: { name: 'create_order' },
    })
  );
  const orderDurationMs = Date.now() - orderStart;
  
  orderDuration.add(orderDurationMs);
  
  const orderSuccess = check(res, {
    'order created': (r) => r.status === 201 || r.status === 200,
    'order has order_id': (r) => {
      try {
        const body = r.json();
        return body.order_id || body.id;
      } catch {
        return false;
      }
    },
  });
  
  orderSuccessRate.add(orderSuccess);
  
  if (!orderSuccess) {
    console.log(`Order failed: ${res.status} ${res.body}`);
  }
  
  sleep(Math.random() * 2 + 1);
  
  // Step 4: Fetch order confirmation
  if (orderSuccess) {
    try {
      const orderData = res.json();
      const orderId = orderData.order_id || orderData.id;
      
      if (orderId) {
        res = taggedRequest('GET /order-confirmation', () =>
          http.get(`${BASE_URL}/order-confirmation?orderId=${orderId}`, {
            tags: { name: 'get_confirmation' },
          })
        );
        
        check(res, {
          'confirmation page loaded': (r) => r.status === 200,
        });
      }
    } catch (e) {
      // Ignore confirmation errors
    }
  }
  
  sleep(Math.random() * 3 + 2);
}

export function handleSummary(data) {
  return {
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
    'results.json': JSON.stringify(data),
  };
}

function textSummary(data, options) {
  const indent = options.indent || '';
  let out = '\n';
  out += `${indent}=== k6 Test Summary (30 VU Steady-State) ===\n`;
  out += `${indent}Total requests: ${data.metrics.http_reqs?.values?.count || 0}\n`;
  out += `${indent}Failed requests: ${data.metrics.http_req_failed?.values?.rate || 0}\n`;
  out += `${indent}Avg duration: ${data.metrics.http_req_duration?.values?.avg || 0}ms\n`;
  
  const httpReqDuration = data.metrics.http_req_duration?.values || {};
  out += `${indent}p95 duration: ${httpReqDuration['p(95)'] !== undefined ? httpReqDuration['p(95)'] : 'N/A'}ms\n`;
  out += `${indent}p99 duration: ${httpReqDuration['p(99)'] !== undefined ? httpReqDuration['p(99)'] : 'N/A'}ms\n`;
  out += `${indent}Order success rate: ${data.metrics.order_created?.values?.rate || 0}\n`;
  out += `${indent}Order duration p95: ${data.metrics.order_duration?.values?.['p(95)'] !== undefined ? data.metrics.order_duration?.values?.['p(95)'] : 'N/A'}ms\n`;
  
  out += `\n${indent}=== Thresholds ===\n`;
  for (const [name, threshold] of Object.entries(data.thresholds || {})) {
    const status = threshold.ok ? '✓' : '✗';
    out += `${indent}${status} ${name}: ${threshold.threshold}\n`;
  }
  
  return out;
}