/**
 * Smoke Test - Verificação básica de disponibilidade da API
 * Etapa 1: Configuração e Smoke Test
 * 
 * Objetivo: Verificar se a API está operacional antes de testes pesados
 * Configuração: 1 VUser por 30 segundos acessando /health
 * Critério de Sucesso: 100% de sucesso nas requisições
 * 
 * Como executar: k6 run tests/smoke.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 1, // 1 usuário virtual
  duration: '30s', // Durante 30 segundos
  
  thresholds: {
    http_req_failed: ['rate==0'], // 0% de falhas - 100% de sucesso
    http_req_duration: ['p(95)<200'], // 95% das requisições devem ser < 200ms
  },
};

export default function () {
  const res = http.get('http://localhost:3000/health');
  
  check(res, {
    'status é 200': (r) => r.status === 200,
    'resposta contém status UP': (r) => r.json('status') === 'UP',
    'tempo de resposta OK': (r) => r.timings.duration < 200,
  });
  
  sleep(1); // Pausa de 1 segundo entre requisições
}
