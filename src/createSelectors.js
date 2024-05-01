import R from "ramda";

const RESERVED_WORDS = ["_default", "_type", "_export", "_selector"];

function createSelectorName(selectorName) {
  return `select${selectorName.charAt(0).toUpperCase()}${selectorName.slice(
    1
  )}`;
}

function getDefaultValueForType(type) {
  if (type === "list") {
    return [];
  } else if (type === "index") {
    return {};
  }
}

function getDefaultForPropertySelector(propertySelectorSpec) {
  if (Object.hasOwn(propertySelectorSpec, "_default")) {
    return propertySelectorSpec["_default"];
  } else if (Object.hasOwn(propertySelectorSpec, "_type")) {
    return getDefaultValueForType(propertySelectorSpec["_type"]);
  }
}

function _createSelectors(selectorSpec, prevSelectorNames) {
  const selectors = {
    selectState: selectorSpec._selector ?? R.identity,
  };

  return Object.entries(selectorSpec).reduce(
    (selectors, [propertyName, propertySpec]) => {
      if (RESERVED_WORDS.includes(propertyName)) {
        return selectors;
      } else if (propertySpec._export !== false) {
        const selectorName = createSelectorName(propertyName);

        if (prevSelectorNames.includes(propertyName)) {
          throw new Error(
            `Invariant failed: The selector names [${selectorName}] are already in use. Please use an alternative name using '_name' or '_names'`
          );
        }

        const defaultValue = getDefaultForPropertySelector(
          selectorSpec[propertyName]
        );

        const selector = (_state) => {
          const state = selectors.selectState(_state);
          return Object.hasOwn(state, propertyName) &&
            state[propertyName] !== undefined
            ? state[propertyName]
            : defaultValue;
        };

        selectors[selectorName] = selector;
        prevSelectorNames.push(propertyName);

        return {
          ...selectors,
          ..._createSelectors(
            {
              ...propertySpec,
              _selector: selector,
            },
            prevSelectorNames
          ),
        };
      }
      return selectors;
    },
    selectors
  );
}

function createSelectors(selectorSpec) {
  return _createSelectors(selectorSpec, []);
}

export default createSelectors;
