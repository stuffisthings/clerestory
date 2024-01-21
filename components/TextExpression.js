const Grammar = require('./Grammar');

/** An Expression is a unit of parseable text that can be evaluated to produce some output or have some effects on its Grammar's state
 * @param {String} text - parseable expresison text
 * @param {Grammar} grammar - the grammar this expression should use
 * @param {Object} [config] - configuration options e.g. weight
 */
module.exports = class TextExpression {
  constructor(text, grammar, config) {
    if (!grammar) throw new Error('No grammar supplied');
    this.defaultGrammar = grammar;
    if (!text || typeof text !== 'string')
      throw new Error('Invalid expression text', text);
    this.rawText = text;
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
    let symbolValue = symbolTag.replace(/([a-zA-z]*)/, (match, baseSymbol) =>
      useGrammar.expandSymbol(baseSymbol)
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
  /**
   *
   * @param {Grammar} grammar - the grammar to use when evaluating this expression; defaults to the grammar set when it was created
   * @returns {String} the result of evaluating the expression against the grammar
   */
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
