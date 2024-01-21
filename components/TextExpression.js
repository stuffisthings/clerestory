/** An Expression is a unit of parseable text that can be evaluated to produce some output or have some effects on its Grammar's state */
module.exports = class TextExpression {
  constructor(text, grammar, config) {
    this.defaultGrammar = grammar;
    this.rawText = text;
    // conditions should be an array of expressions that must all evaluate to truthy values for this expression to be evaluated
    if (config?.conditions) {
      this.conditions = config.conditions.map(
        (condition) => new TextExpression(condition, grammar)
      );
    }
    this.weight = config?.weight || 1; // used for symbols with weighted distribution
  }
  evaluateSymbolRef(symbolTag, useGrammar) {
    // handle conditional tests
    if (symbolTag[0] === '?' || symbolTag[0] === '!') {
      return symbolTag.replace(
        /[?!](.*)\?(.*)/g,
        (match, condition, predicate) => {
          const operator = match[0];
          let [conditionValue, testValue] = condition.split('=');
          // evaluate condition and test values
          // condition is always treated as a symbol
          conditionValue = this.evaluateSymbolRef(conditionValue, useGrammar);
          // test value can be either a string or symbol
          testValue = testValue.replace(/\#(.*)\#/g, (match, symbol) =>
            this.evaluateSymbolRef(symbol, useGrammar)
          );
          // prepare the predicate
          let [trueResult, falseResult] = predicate.split(':');
          trueResult = trueResult.replace(/\#(.*)\#/g, (match, symbol) =>
            this.evaluateSymbolRef(symbol, useGrammar)
          );
          falseResult = falseResult
            ? falseResult.replace(/\#(.*)\#/g, (match, symbol) =>
                this.evaluateSymbolRef(symbol, useGrammar)
              )
            : '';
          // finally, return the result
          switch (operator) {
            case '?':
              return conditionValue === testValue ? trueResult : falseResult;
            case '!':
              return conditionValue !== testValue ? trueResult : falseResult;
          }
        }
      );
    }
    // expand the base value
    // skip unexpanded symbols

    let symbolValue = symbolTag.replace(/([a-zA-z]*)/, (match, baseSymbol) =>
      useGrammar[baseSymbol] ? useGrammar[baseSymbol].value : ''
    );
    // apply modifiers if any
    // collect all the modifiers in the chain
    const modifiers = [];
    symbolValue = symbolValue.replace(/\.([^\.]*)/g, (match, modifier) => {
      modifiers.push(modifier);
      return '';
    });
    // apply modifiers
    symbolValue = modifiers.reduce((result, modifier) => {
      if (!useGrammar?._modifiers[modifier]) {
        return symbolValue;
      } else {
        return useGrammar._modifiers[modifier](result);
      }
    }, symbolValue);
    return symbolValue;
  }
  evaluate(grammar) {
    const useGrammar = grammar || this.defaultGrammar;
    let result = this.rawText;
    // expand alternations
    result = result.replace(/\[(.*?)\]/g, (match, alternation) => {
      return useGrammar.rng.pickFrom(alternation.split('|'));
    });
    // expand symbol references
    result = result.replace(/\#([^\s\|]*)\#/g, (match, symbolTag) =>
      this.evaluateSymbolRef(symbolTag, useGrammar)
    );
    // TODO: non-expanding symbol references like ~foo~
    // remove seperators
    result = result.replace(/\|/g, '');
    return result;
  }
};
