const TextSymbol = require('../components/TextSymbol.js');
const Randomly = require('@joncuster/randomly');
const rng = new Randomly.RNG();
const plainText = "Why hello there, friend! How's it going (today)?";
const mockGrammar = { rng };

test('Expand a single expression', () => {
  expect(new TextSymbol(plainText, mockGrammar).expand()).toBe(plainText);
  expect(new TextSymbol([plainText], mockGrammar).expand()).toBe(plainText);
  expect(new TextSymbol([plainText], mockGrammar).expand()).toBe(plainText);
});

test('Expand from a list of rules', () => {
  expect(['foo', 'bar']).toContain(
    new TextSymbol(['foo', 'bar'], mockGrammar).expand()
  );
  expect(['foo', 'bar']).toContain(
    new TextSymbol([{ text: 'foo' }, { text: 'bar' }], mockGrammar).expand()
  );
});

test('Flatten a symbol', () => {
  const symbolA = new TextSymbol(['foo', 'bar'], mockGrammar);
  const expanded = symbolA.expand(true);
  expect(symbolA.value).toBe(expanded);
  // flatten with flatten method
  expect(['foo', 'bar']).toContain(
    new TextSymbol(['foo', 'bar'], mockGrammar).flatten()
  );
  // accessing value should flatten the symbol
  const symbolB = new TextSymbol(['foo', 'bar'], mockGrammar);
  const expandedB = symbolB.value;
  expect(symbolB.value).toBe(expandedB);
});

test('Manually set symbol value', () => {
  const symbolA = new TextSymbol(['foo', 'bar'], mockGrammar);
  symbolA.expand(true);
  symbolA.value = 'foobar';
  expect(symbolA.value).toBe('foobar');
});

test('Use pop distribution', () => {
  const symbolA = new TextSymbol(['foo', 'bar'], mockGrammar, {
    distribution: 'pop',
  });
  const firstValue = symbolA.expand();
  expect(['foo', 'bar']).toContain(firstValue);
  expect(symbolA.expand()).not.toBe(firstValue);
  // exhausted rules should return empty string
  expect(symbolA.expand()).toBe('');
  // reset rules
  symbolA.reset();
  expect(['foo', 'bar']).toContain(symbolA.expand());
});

test('Use shuffle distribution', () => {
  const symbolA = new TextSymbol(['A', 'B', 'C'], mockGrammar, {
    distribution: 'shuffle',
  });
  const firstValue = symbolA.expand();
  expect(['A', 'B', 'C']).toContain(firstValue);
  const secondValue = symbolA.expand();
  expect(secondValue).not.toBe(firstValue);
  const thirdValue = symbolA.expand();
  expect([firstValue, secondValue]).not.toContain(thirdValue);
  // when "deck" is exhausted it should be reshuffled
  expect(['A', 'B', 'C']).toContain(symbolA.expand());
});

test('Use weighted distribution', () => {
  const weightedSymbol = new TextSymbol(
    [
      { text: 'foo', weight: 1000 },
      { text: 'bar', weight: 1 },
    ],
    mockGrammar,
    {
      distribution: 'weighted',
    }
  );
  let fooCount = 0;
  let barCount = 0;
  for (let i = 0; i < 100; i += 1) {
    const text = weightedSymbol.expand();
    if (text === 'foo') fooCount += 1;
    if (text === 'bar') barCount += 1;
  }
  expect(fooCount).toBeGreaterThan(barCount);
});

test('Use weighted pop distribution', () => {
  const weightedPopSymbol = new TextSymbol(
    [
      { text: 'foo', weight: 4 },
      { text: 'bar', weight: 1 },
    ],
    mockGrammar,
    {
      distribution: 'popWeighted',
    }
  );
  const results = [];
  for (let i = 0; i < 6; i += 1) {
    results.push(weightedPopSymbol.expand());
  }
  expect(results.filter((r) => r === 'foo').length).toBe(4);
  expect(results.filter((r) => r === 'bar').length).toBe(1);
  expect(results.filter((r) => r === '').length).toBe(1);
});
