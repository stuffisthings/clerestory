/**
 * A Grammar is a simply a list of Symbols and some methods for interacting with them and with its own state.
 * Each Grammar tracks the current state of its symbols which can be manipulated by executing their rules
 * or through Grammar methods for directly modifying its state.
 * Each symbol and expression refers back to its grammar to interact with other symbols.
 * @param {Object} symbols - the symbols making up this grammar, a set of key-value pairs where the value should be a valid TextSymbol rule def
 * @param {Object} [state] - the Grammar's current state. You can use this option to pass outside state values already set in another part of the program.
 * @param {Object} [rng] - optionally provide your own RNG.
 * @param {Object} [config] - configuration options
 */
const TextSymbol = require('./TextSymbol');
const Randomly = require('@joncuster/randomly');
module.exports = class Grammar {
  constructor(symbols, rng, config) {
    this.rng = rng || new Randomly.RNG(config?.seed);
    this.symbols = {};
    // set up proxy to track new state being added
    const createSymbol = (rules) => {
      if (!rules) return new TextSymbol('', this);
      if (
        Array.isArray(rules) ||
        typeof rules === 'string' ||
        typeof rules === 'function'
      ) {
        return new TextSymbol(rules, this);
      }
      // assume object definition otherwise
      return new TextSymbol(rules.rules, this, {
        distribution: rules.distribution,
      });
    };
    Object.keys(symbols).forEach((symRef) => {
      this.symbols[symRef] = createSymbol(symbols[symRef]);
    });
    const symbolHandler = {
      set(target, prop, value) {
        target[prop] = createSymbol(value);
      },
      get(target, prop) {
        return target[prop].value;
      },
    };
    this.state = new Proxy(this.symbols, symbolHandler);
    this.origin = config?.origin || 'origin'; // default key to start from
    this.output = '';
  }
  /**
   * Expand the grammar from a specific key (defaults to origin)
   * @param {String} [symbolKey] - key to start from
   * @returns {String} the resulting output
   */
  expand(symbolKey) {
    const useKey = symbolKey || this.origin;
    const result = this.symbols[useKey].expand();
    this.output = result;
    return result;
  }
};
