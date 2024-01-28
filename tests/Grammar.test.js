const Grammar = require('../components/Grammar.js');
const TextSymbol = require('../components/TextSymbol.js');

test('Evaluate symbols and set output', () => {
  const simpleGrammar = new Grammar({
    traveler: ['Gandalf'],
    greeting: ['Howdy'],
    origin: '#greeting#, #traveler#! How goes it?',
  });
  expect(simpleGrammar.expand()).toBe('Howdy, Gandalf! How goes it?');
  expect(simpleGrammar.output).toBe('Howdy, Gandalf! How goes it?');
  expect(simpleGrammar.expand('traveler')).toBe('Gandalf');
});

test('Allow setting state from outside', () => {
  const simpleGrammar = new Grammar({
    traveler: 'Gandalf',
    greeting: ['Howdy'],
    origin: '#greeting#, #traveler#! How goes it?',
  });
  expect(simpleGrammar.expand()).toBe('Howdy, Gandalf! How goes it?');
  expect(simpleGrammar.state.traveler).toBe('Gandalf');
  expect(simpleGrammar.expand('traveler')).toBe('Gandalf');
  // change state directly
  simpleGrammar.state.traveler = 'Bilbo';
  expect(simpleGrammar.expand('origin')).toBe('Howdy, Bilbo! How goes it?');
  // change state with rules
  simpleGrammar.state.greeting = ['Yo'];
  expect(simpleGrammar.expand('origin')).toBe('Yo, Bilbo! How goes it?');
  // add new state
  simpleGrammar.state.nemesis = 'Sauron';
  expect(simpleGrammar.expand('nemesis')).toBe('Sauron');
  // change existing rules
  simpleGrammar.state.origin = "#greeting#, #traveler#, it's me, #nemesis#";
  expect(simpleGrammar.expand()).toBe("Yo, Bilbo, it's me, Sauron");
});

test('Specify config for symbols', () => {
  const simpleGrammar = new Grammar({
    traveler: { rules: ['Gandalf', 'Bilbo'], distribution: 'pop' },
  });
  expect(['Gandalf', 'Bilbo']).toContain(simpleGrammar.expand('traveler'));
  expect(simpleGrammar.symbols.traveler.distribution).toBe('pop');
});
