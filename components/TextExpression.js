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
  // check the expression against its conditions
  get valid() {
    return this.conditions.every((condition) => condition.evaluate());
  }
  processSymbolRef(symbolIdRaw, useGrammar) {
    // split into symbol id and possible actions
    const actions = symbolIdRaw.split('.');
    const symbolRef = useGrammar[actions.shift()];
    // undefined symbols return as an empty string
    /*
    if (!symbolRef)
      console.warn(
        'Reference to undefined symbol:',
        symbolRef,
        'in',
        symbolIdRaw
      );
      */
    let symbolValue = symbolRef ? symbolRef.value : '';
    // perform any actions
    while (actions.length > 0) {
      let nextAction = actions.shift();
      const args = [];
      nextAction = nextAction.replace(/\((.*?)\)/, (match, argsRaw) => {
        // evaluate each argument as its own expression
        args.push(
          ...argsRaw
            .split(',')
            .map((rawText) =>
              new TextExpression(rawText, useGrammar).evaluate()
            )
        );
        return '';
      });
      if (!useGrammar?._actions[nextAction]) {
        console.warn('Reference to undefined action:', nextAction);
      } else {
        symbolValue = useGrammar._actions[nextAction](symbolValue, ...args);
      }
    }
    return symbolValue;
  }
  evaluate(grammar) {
    const useGrammar = grammar || this.defaultGrammar;
    let result = this.rawText;
    // expand alternations
    result = result.replace(/\[(.*?)\]/g, (match, alternation) => {
      return useGrammar.rng.pickFrom(alternation.split('|'));
    });
    // then expand standalone symbol references
    result = result.replace(/\#([a-zA-z\.]*)\#/g, (match, symbolIdRaw) => {
      return this.processSymbolRef(symbolIdRaw, useGrammar);
    });
    // expand symbol references with actions that have arguments
    // (symbol refs in the arguments should already be expanded)
    result = result.replace(/\#([^\?\#]*)\#/g, (match, symbolIdRaw) => {
      return this.processSymbolRef(symbolIdRaw, useGrammar);
    });
    // process conditional shorthand, tags for condition value should already be expanded
    result = result.replace(
      /\#([a-zA-z\.\=\!\&\|]*\?.*)\#/g,
      (match, symbolIdRaw) => {
        // process the conditional
        const conditionalParts = symbolIdRaw.split('?');
        let condition = conditionalParts[0];
        // equality operators
        let operator = '==';
        let conditionValue = null;
        condition = condition.replace(/[\=\!][\=](.*)/g, (match, cv) => {
          operator = match.slice(0, 2);
          conditionValue = cv;
          return '';
        });
        // use javascript truthiness, nonexistant symbols should evaluate false
        let conditionTrue = false;
        switch (operator) {
          case '==':
            conditionTrue =
              this.processSymbolRef(condition, useGrammar) === conditionValue;
            break;
          case '!=':
            conditionTrue =
              this.processSymbolRef(condition, useGrammar) !== conditionValue;
            break;
        }
        // process the ternary if any
        const predicate = conditionalParts[1].split(':');
        return conditionTrue ? predicate[0] : predicate[1] || '';
      }
    );
    console.log('result after conditional', result);
    return result;
  }
};
