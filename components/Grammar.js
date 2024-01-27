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
  constructor(symbols, state = {}, rng, config) {
    this.symbols = Object.keys(symbols).reduce((sym, symKey) => {
      const symbolDef = symbols[symKey];
      const symbol = new TextSymbol(symbolDef, this); // TODO: allow symbols as objs
      return { ...sym, [symKey]: symbol };
    }, {});
    this.state = state;
    const getSymbol = (symKey) => this.symbols[symKey].value;
    const setSymbol = (symKey, value) => (this.symbols[symKey].value = value);
    Object.keys(symbols).forEach((symKey) => {
      // skip symbols already defined in state
      if (!this.state[symKey]) {
        Object.defineProperty(this.state, symKey, {
          get() {
            return getSymbol(symKey);
          },
          set(value) {
            setSymbol(symKey, value);
          },
          enumerable: true,
        });
      }
    });
    this.rng = rng || new Randomly.RNG(config?.seed);
    this.origin = config?.origin || 'origin'; // default key to start from
    this.output = '';
  }
  /**
   * Expand the grammar from a specific key (defaults to origin)
   * @param {String} [symbolKey] - key to start from
   * @param {Boolean} [force] - force re-expanding even if value already set
   * @returns {String} the resulting output
   */
  expand(symbolKey, force) {
    const useKey = symbolKey || this.origin;
    const result =
      force && this.symbols[useKey]
        ? this.symbols[useKey].expand(true)
        : this.state[useKey];
    this.output = result;
    return result;
  }
};
