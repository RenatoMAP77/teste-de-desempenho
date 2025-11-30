/**
 * Spike Test - Teste de Pico
 * Etapa 4: Teste de Pico (Spike Testing)
 * 
 * Contexto: Simular "Flash Sale" (abertura de venda de ingressos)
 * Alvo: Endpoint POST /checkout/simple (I/O Bound)
 * 
 * Cenário:
 *  - Carga baixa: 10 usuários por 30s
 *  - SPIKE: Salto imediato para 300 usuários em 10s
 *  - Platô: Manter 300 usuários por 1 minuto
 *  - Queda: Volta imediata para 10 usuários
 * 
 * Análise: Verificar se a API consegue lidar com picos repentinos de tráfego
 * 
 * Como executar: k6 run tests/spike.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 10 },   // Carga baixa: 10 usuários por 30s
    { duration: '10s', target: 300 },  // SPIKE: salto para 300 usuários em 10s
    { duration: '1m', target: 300 },   // Mantém: 300 usuários por 1 minuto
    { duration: '10s', target: 10 },   // Queda: volta para 10 usuários
    { duration: '30s', target: 10 },   // Recuperação: mantém 10 usuários
  ],
  
  thresholds: {
    http_req_duration: ['p(95)<1000'],  // Durante spike, latência pode aumentar
    http_req_failed: ['rate<0.05'],     // Até 5% de falha aceitável no pico
  },
};

export default function () {
  const url = 'http://localhost:3000/checkout/simple';
  const payload = JSON.stringify({
    userId: `flash_sale_user_${__VU}`,
    items: [
      { id: 'limited_item', quantity: 1, price: 199.90 },
    ],
    flashSale: true,
  });
  
  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };
  
  const res = http.post(url, payload, params);
  
  check(res, {
    'status é 201': (r) => r.status === 201,
    'checkout aprovado': (r) => r.json('status') === 'APPROVED',
    'tem transaction ID': (r) => r.json('id') !== undefined,
  });
  
  // Durante o spike, log de performance
  const currentVUs = __VU;
  if (currentVUs > 200 && res.timings.duration > 800) {
    console.log(`🔥 SPIKE - VU ${__VU}: Latência durante pico: ${res.timings.duration.toFixed(2)}ms`);
  }
  
  sleep(1);
}
