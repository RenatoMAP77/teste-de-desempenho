/**
 * Stress Test - Teste de Estresse
 * Etapa 3: Teste de Estresse (Stress Testing)
 * 
 * Objetivo: Descobrir quantos usuários fazendo cálculos de criptografia derrubam o servidor
 * Alvo: Endpoint POST /checkout/crypto (CPU Bound)
 * 
 * Cenário - Aumento agressivo de carga:
 *  - 0 a 200 usuários em 2 minutos
 *  - 200 a 500 usuários em 2 minutos
 *  - 500 a 1000 usuários em 2 minutos
 * 
 * Análise: Observar quando os tempos de resposta sobem exponencialmente ou ocorrem Timeouts
 * 
 * Como executar: k6 run tests/stress.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 200 },   // Fase 1: 0 → 200 usuários
    { duration: '2m', target: 500 },   // Fase 2: 200 → 500 usuários
    { duration: '2m', target: 1000 },  // Fase 3: 500 → 1000 usuários (Breaking Point)
    { duration: '1m', target: 0 },     // Recovery: volta a 0
  ],
  
  thresholds: {
    http_req_duration: ['p(95)<3000'],  // Threshold relaxado para observar degradação
    http_req_failed: ['rate<0.1'],      // Até 10% de falha é esperado no estresse
  },
};

export default function () {
  const url = 'http://localhost:3000/checkout/crypto';
  const payload = JSON.stringify({
    userId: `user_${__VU}`,
    items: [
      { id: 'secure_item_1', quantity: 1, price: 99.90 },
    ],
    securityLevel: 'high',
  });
  
  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
    timeout: '60s', // Timeout maior para operações CPU-intensive
  };
  
  const res = http.post(url, payload, params);
  
  check(res, {
    'status é 201 ou 500': (r) => r.status === 201 || r.status === 500,
    'não deu timeout': (r) => r.status !== 0,
    'resposta em até 5s': (r) => r.timings.duration < 5000,
  });
  
  // Log de degradação para análise
  if (res.timings.duration > 2000) {
    console.log(`⚠️ VU ${__VU}: Latência alta detectada: ${res.timings.duration.toFixed(2)}ms`);
  }
  
  if (res.status === 500 || res.status === 0) {
    console.log(`❌ VU ${__VU}: Falha detectada - Status: ${res.status}`);
  }
  
  sleep(1);
}
