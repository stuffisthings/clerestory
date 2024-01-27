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
  const symbolA = new TextSymbol(['foo', 'bar'], mockGrammar, undefined, {
    distribution: 'pop',
  });
  expect(['foo', 'bar']).toContain(symbolA.expand());
  expect(['foo', 'bar']).toContain(symbolA.expand());
  expect(symbolA.expand()).toBe('');
  // reset rules
  symbolA.reset();
  expect(['foo', 'bar']).toContain(symbolA.expand());
});
