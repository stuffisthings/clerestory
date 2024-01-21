const TextExpression = require('../components/TextExpression.js');
const Randomly = require('@joncuster/randomly');
const rng = new Randomly.RNG();

const plainText = "Why hello there, friend! How's it going (today)?";

test('Return plain strings', () => {
  expect(new TextExpression(plainText, { rng }).evaluate()).toBe(plainText);
});

test('Evaluate alternations', () => {
  expect(['hi', 'hello', "what's up?", 'yo!']).toContain(
    new TextExpression("[hi|hello|what's up?|yo!]", { rng }).evaluate()
  );
  expect(['hi there', 'hello there', 'hi youse', 'hello youse']).toContain(
    new TextExpression('[hi|hello] [there|youse]', { rng }).evaluate()
  );
});
test('Evaluate symbol references', () => {
  const symbolGrammar = {
    rng,
    traveler: { value: 'Gandalf' },
    greeting_casual: { value: 'Howdy' },
  };
  expect(
    new TextExpression(
      "Why hello there, #traveler#! #greeting_casual#, how's it going (today)?",
      symbolGrammar
    ).evaluate()
  ).toBe("Why hello there, Gandalf! Howdy, how's it going (today)?");
  // mix of alternatation and symbols
  expect(['Hi Gandalf', 'Hello Gandalf, my friend', 'Yo Gandalf!']).toContain(
    new TextExpression(
      '[Hi #traveler#|Hello #traveler#, my friend|Yo #traveler#!]',
      symbolGrammar
    ).evaluate()
  );
});
const commonActions = {
  uppercase: (phrase) => phrase.toUpperCase(),
  s: (phrase) => `${phrase}s`,
};
test('Evaulate symbol modifiers', () => {
  const symbolActionGrammar = {
    rng,
    firstAnimal: { value: 'cat' },
    secondAnimal: { value: 'dog' },
    nutrition: { value: 'food' },
    _modifiers: commonActions,
  };
  expect(
    new TextExpression(
      'I LOVE MY #firstAnimal.uppercase#!',
      symbolActionGrammar
    ).evaluate()
  ).toBe('I LOVE MY CAT!');
  expect(
    new TextExpression(
      "It's raining #firstAnimal.s# and #secondAnimal.uppercase.s#!",
      symbolActionGrammar
    ).evaluate()
  ).toBe("It's raining cats and DOGs!");
  expect(
    new TextExpression(
      "It's raining #firstAnimal.s# and #secondAnimal.s.uppercase#!",
      symbolActionGrammar
    ).evaluate()
  ).toBe("It's raining cats and DOGS!");
  // Handle null seperator
  expect(
    new TextExpression(
      '#firstAnimal.s# eat #firstAnimal#|#nutrition# and #secondAnimal.s# eat #secondAnimal#|#nutrition#',
      symbolActionGrammar
    ).evaluate()
  ).toBe('cats eat catfood and dogs eat dogfood');
});
test('Evaulate conditionals', () => {
  const conditionalGrammar = {
    rng,
    animal: { value: 'dog' },
    woofAnimal: { value: 'dog' },
    dogSpeech: { value: 'woof!' },
    speech: { value: 'hello' },
    _modifiers: {
      ...commonActions,
      is: (phrase, comparator) => phrase === comparator,
    },
  };
  // equals
  expect(
    new TextExpression(
      'The #animal# says #?animal=dog?woof#!',
      conditionalGrammar
    ).evaluate()
  ).toBe('The dog says woof!');
  // symbol reference as condition
  expect(
    new TextExpression(
      'The #animal# says #?animal=#woofAnimal#?woof#!',
      conditionalGrammar
    ).evaluate()
  ).toBe('The dog says woof!');
  // modifiers in condition
  expect(
    new TextExpression(
      'The #animal# says #?animal.s.uppercase=DOGS?woof#!',
      conditionalGrammar
    ).evaluate()
  ).toBe('The dog says woof!');
  // symbol reference in predicate
  expect(
    new TextExpression(
      'The #animal# says #?animal=dog?#dogSpeech##!',
      conditionalGrammar
    ).evaluate()
  ).toBe('The dog says woof!!');
  // modifiers in predicate
  expect(
    new TextExpression(
      'The #animal# says #?animal=dog?#dogSpeech.uppercase##!',
      conditionalGrammar
    ).evaluate()
  ).toBe('The dog says WOOF!!');
  // ternary option
  expect(
    new TextExpression(
      'The #animal# says #?animal=cat?meow:#dogSpeech##!',
      conditionalGrammar
    ).evaluate()
  ).toBe('The dog says woof!!');
  // nonexistant symbol refs evaluate falsey
  expect(
    new TextExpression(
      'The #animal# says #?ape=monkey?aii:hello#!',
      conditionalGrammar
    ).evaluate()
  ).toBe('The dog says hello!');
  // not
  expect(
    new TextExpression(
      'The #animal# says #!animal=cat?woof#!',
      conditionalGrammar
    ).evaluate()
  ).toBe('The dog says woof!');
});
