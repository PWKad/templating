System.register([], function (_export) {
  "use strict";

  var capitalMatcher;
  _export("hyphenate", hyphenate);

  function addHyphenAndLower(char) {
    return "-" + char.toLowerCase();
  }

  function hyphenate(name) {
    return (name.charAt(0).toLowerCase() + name.slice(1)).replace(capitalMatcher, addHyphenAndLower);
  }
  return {
    setters: [],
    execute: function () {
      capitalMatcher = /([A-Z])/g;
    }
  };
});