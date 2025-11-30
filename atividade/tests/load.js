/**
 * Load Test - Teste de Carga
 * Etapa 2: Teste de Carga (Load Testing)
 * 
 * Contexto: Marketing anunciou promoção e esperamos pico de 50 usuários simultâneos
 * Alvo: Endpoint POST /checkout/simple (I/O Bound)
 * 
 * Cenário:
 *  - Ramp-up: 0 a 50 usuários em 1 minuto
 *  - Platô: Manter 50 usuários por 2 minutos
 *  - Ramp-down: 50 a 0 usuários em 30 segundos
 * 
 * SLA: p95 < 500ms e erros < 1%
 * 
 * Como executar: k6 run tests/load.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '1m', target: 50 },   // Ramp-up: 0 → 50 usuários em 1 minuto
    { duration: '2m', target: 50 },   // Platô: mantém 50 usuários por 2 minutos
    { duration: '30s', target: 0 },   // Ramp-down: 50 → 0 usuários em 30 segundos
  ],
  
  thresholds: {
    http_req_duration: ['p(95)<500'],   // 95% das requisições devem ser < 500ms
    http_req_failed: ['rate<0.01'],     // Taxa de erro deve ser < 1%
  },
};

export default function () {
  const url = 'http://localhost:3000/checkout/simple';
  const payload = JSON.stringify({
    userId: `user_${__VU}`,
    items: [
      { id: 'item_1', quantity: 2, price: 29.90 },
      { id: 'item_2', quantity: 1, price: 15.50 },
    ],
  });
  
  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };
  
  const res = http.post(url, payload, params);
  
  check(res, {
    'status é 201': (r) => r.status === 201,
    'status é APPROVED': (r) => r.json('status') === 'APPROVED',
    'tem ID de transação': (r) => r.json('id') !== undefined,
    'latência aceitável': (r) => r.timings.duration < 500,
  });
  
  sleep(1); // Tempo de "pensar" entre requisições (pacing)
}
