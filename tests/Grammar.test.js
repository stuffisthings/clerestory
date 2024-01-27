const Grammar = require('../components/Grammar.js');

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
  const simpleGrammar = new Grammar(
    {
      greeting: ['Howdy'],
      origin: '#greeting#, #traveler#! How goes it?',
    },
    { traveler: 'Gandalf' }
  );
  expect(simpleGrammar.expand()).toBe('Howdy, Gandalf! How goes it?');
  expect(simpleGrammar.expand('traveler')).toBe('Gandalf');
  // change state directly and force expand
  simpleGrammar.state.traveler = 'Bilbo';
  expect(simpleGrammar.expand('origin', true)).toBe(
    'Howdy, Bilbo! How goes it?'
  );
  // change state defined by symbols
  simpleGrammar.state.greeting = 'Yo';
  expect(simpleGrammar.expand('origin', true)).toBe('Yo, Bilbo! How goes it?');
});
