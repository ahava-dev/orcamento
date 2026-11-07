const assert = require('node:assert');
const c = require('../.test/calc.js');

const perto = (a, b, eps = 1e-6) => assert.ok(Math.abs(a - b) < eps, `${a} != ${b}`);

// calibração: rolo fechado 540 g, tubo 40 g, 1.411 m
const fio = { metros_rolo: 1411, tara_g: 40, peso_fechado_g: 540 };
assert.strictEqual(c.gramasDeFio(fio), 500);
perto(c.metrosPorGrama(fio), 2.822);
assert.strictEqual(c.metrosPorGrama({ ...fio, peso_fechado_g: null }), null);

// custo do fio: R$ 49,90 / 1.411 m
assert.strictEqual((c.custoPorMetro(49.9, 1411) * 400).toFixed(2), '14.15');

// consumo: 400 g antes, 100 g depois
perto(c.metrosConsumidos({ antes: 400, depois: 100, metrosManual: null, mPorG: 2.822 }), 846.6);
assert.strictEqual(c.metrosConsumidos({ antes: 100, depois: 400, metrosManual: null, mPorG: 2.822 }), null);
assert.strictEqual(c.metrosConsumidos({ antes: 400, depois: null, metrosManual: null, mPorG: 2.822 }), null);
assert.strictEqual(c.metrosConsumidos({ antes: null, depois: null, metrosManual: 120, mPorG: null }), 120);

// custo fixo por hora: (100 + 60) / 160
assert.strictEqual(c.custoFixoPorHora({ energia_mes: 100, ferramentas_mes: 60, horas_mes: 160 }), 1);
assert.strictEqual(c.custoFixoPorHora({ energia_mes: 100, ferramentas_mes: 60, horas_mes: 0 }), 0);

// exemplo do texto: fio 30 + materiais 20 + 10 h x 15 + 10 h x 2 = 220
const custos = c.calcularCustos({
  custoFio: 30, custoMateriais: 20, horas: 10, maoObraFechada: null, valorHora: 15, fixoPorHora: 2,
});
assert.strictEqual(custos.maoObra, 150);
assert.strictEqual(custos.fixos, 20);
assert.strictEqual(custos.total, 220);

// 30% de margem + 5% de maquininha
assert.strictEqual(c.precoSugerido(220, 30, 5).toFixed(2), '338.46');
assert.strictEqual(c.precoSugerido(100, 60, 40), null);

// mão de obra com valor fechado
const fechado = c.calcularCustos({
  custoFio: 30, custoMateriais: 20, horas: 10, maoObraFechada: 100, valorHora: 15, fixoPorHora: 2,
});
assert.strictEqual(fechado.maoObra, 100);
assert.strictEqual(fechado.total, 170);

// peso sugerido na balança: 1.411 m de saldo + tubo
perto(c.pesoSugeridoAntes(1411, 2.822, 40), 540);
assert.strictEqual(c.pesoSugeridoAntes(1411, null, 40), null);

console.log('calc: tudo certo');
