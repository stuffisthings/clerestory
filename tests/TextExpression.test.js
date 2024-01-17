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
  join: (phrase, ...addPhrase) => `${phrase}${addPhrase.join('')}`,
};
test('Evaulate symbol actions', () => {
  const symbolActionGrammar = {
    rng,
    firstAnimal: { value: 'cat' },
    secondAnimal: { value: 'dog' },
    _actions: commonActions,
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
  expect(
    new TextExpression(
      '#firstAnimal.s# eat #firstAnimal.join(food)# and #secondAnimal.s# eat #secondAnimal.join(food)#.',
      symbolActionGrammar
    ).evaluate()
  ).toBe('cats eat catfood and dogs eat dogfood.');
  // alternations in arguments
  expect([
    'cats love catfood',
    'cats love catnip',
    'cats love cattoys',
  ]).toContain(
    new TextExpression(
      '#firstAnimal.s# love #firstAnimal.join([food|nip|toys])#',
      symbolActionGrammar
    ).evaluate()
  );
  // symbol references in arguments
  expect(
    new TextExpression(
      '#firstAnimal.join(#secondAnimal#).s# are better than #secondAnimal.join(#firstAnimal.s#)# and #secondAnimal.join(#firstAnimal#,#secondAnimal#).s#',
      symbolActionGrammar
    ).evaluate()
  ).toBe('catdogs are better than dogcats and dogcatdogs');
});
test('Evaulate conditionals', () => {
  const conditionalGrammar = {
    rng,
    animal: { value: 'dog' },
    woofAnimal: { value: 'dog' },
    dogSpeech: { value: 'woof!' },
    speech: { value: 'hello' },
    _actions: {
      ...commonActions,
      is: (phrase, comparator) => phrase === comparator,
    },
  };
  // equals
  expect(
    new TextExpression(
      'The #animal# says #animal==dog?woof#!',
      conditionalGrammar
    ).evaluate()
  ).toBe('The dog says woof!');
  // symbol reference as condition
  expect(
    new TextExpression(
      'The #animal# says #animal==#woofAnimal#?woof#!',
      conditionalGrammar
    ).evaluate()
  ).toBe('The dog says woof!');
  // actions in condition
  expect(
    new TextExpression(
      'The #animal# says #animal.s.uppercase.join(DOGS)==DOGSDOGS?woof#!',
      conditionalGrammar
    ).evaluate()
  ).toBe('The dog says woof!');
  // symbol reference in predicate
  expect(
    new TextExpression(
      'The #animal# says #animal==dog?#dogSpeech##!',
      conditionalGrammar
    ).evaluate()
  ).toBe('The dog says woof!!');
  // actions in predicate
  expect(
    new TextExpression(
      'The #animal# says #animal==dog?#dogSpeech.uppercase##!',
      conditionalGrammar
    ).evaluate()
  ).toBe('The dog says WOOF!!');
  // nonexistant symbol refs evaluate falsey
  expect(
    new TextExpression(
      'The #animal# says #ape==monkey?aii#!',
      conditionalGrammar
    ).evaluate()
  ).toBe('The dog says !');
  // not
  expect(
    new TextExpression(
      'The #animal# says #animal!=cat?woof#!',
      conditionalGrammar
    ).evaluate()
  ).toBe('The dog says woof!');
});
