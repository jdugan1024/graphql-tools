import { parseValue, SelectionSetNode, valueFromASTUntyped } from 'graphql';

import { Expansion, KeyDeclaration, ParsedMergeArgsExpr } from './types';

import { expandUnqualifiedKeys } from './expandUnqualifiedKeys';
import { extractVariables } from './extractVariables';
import { EXPANSION_PREFIX, KEY_DELIMITER, preparseMergeArgsExpr } from './preparseMergeArgsExpr';

export interface PreparsedMergeArgsExpr {
  mergeArgsExpr: string;
  expansionExpressions: Record<string, string>;
}

type VariablePaths = Record<string, Array<string | number>>;

export function parseMergeArgsExpr(
  mergeArgsExpr: string,
  selectionSets: Array<SelectionSetNode> = []
): ParsedMergeArgsExpr {
  const { mergeArgsExpr: newMergeArgsExpr, expansionExpressions } = preparseMergeArgsExpr(mergeArgsExpr);

  const inputValue = parseValue(`{ ${newMergeArgsExpr} }`, { noLocation: true });

  const { inputValue: newInputValue, variablePaths } = extractVariables(inputValue);

  if (!Object.keys(expansionExpressions).length) {
    if (!Object.keys(variablePaths).length) {
      throw new Error('Merge arguments must declare a key.');
    }

    const keyDeclarations = getKeyDeclarations(variablePaths);

    const value = valueFromASTUntyped(newInputValue);

    const { value: finalValue, keyDeclarations: finalKeyDeclarations } = expandUnqualifiedKeys(
      value,
      keyDeclarations,
      selectionSets
    );

    return { args: finalValue, keyDeclarations: finalKeyDeclarations, expansions: [] };
  }

  const expansionRegEx = new RegExp(`${EXPANSION_PREFIX}[0-9]+`);
  Object.keys(variablePaths).forEach(variableName => {
    if (!variableName.match(expansionRegEx)) {
      throw new Error('Expansions cannot be mixed with single key declarations.');
    }
  });

  const expansions: Array<Expansion> = [];
  Object.keys(expansionExpressions).forEach(variableName => {
    const str = expansionExpressions[variableName];
    const valuePath = variablePaths[variableName];
    const { inputValue: expansionInputValue, variablePaths: expansionVariablePaths } = extractVariables(
      parseValue(`${str}`, { noLocation: true })
    );

    if (!Object.keys(expansionVariablePaths).length) {
      throw new Error('Merge arguments must declare a key.');
    }

    const keyDeclarations = getKeyDeclarations(expansionVariablePaths);

    const value = valueFromASTUntyped(expansionInputValue);

    const { value: finalValue, keyDeclarations: finalKeyDeclarations } = expandUnqualifiedKeys(
      value,
      keyDeclarations,
      selectionSets
    );

    expansions.push({
      valuePath: assertNotWithinList(valuePath),
      value: finalValue,
      keyDeclarations: finalKeyDeclarations,
    });
  });

  return { args: valueFromASTUntyped(newInputValue), keyDeclarations: [], expansions };
}

function getKeyDeclarations(variablePaths: VariablePaths): Array<KeyDeclaration> {
  const keyDeclarations: Array<KeyDeclaration> = [];
  Object.entries(variablePaths).forEach(([keyPath, valuePath]) => {
    const splitKeyPath = keyPath.split(KEY_DELIMITER).slice(1);

    keyDeclarations.push({
      valuePath: assertNotWithinList(valuePath),
      keyPath: splitKeyPath,
    });
  });

  return keyDeclarations;
}

function assertNotWithinList(path: Array<string | number>): Array<string> {
  path.forEach(pathSegment => {
    if (typeof pathSegment === 'number') {
      throw new Error('Insertions cannot be made into a list.');
    }
  });
  return path as Array<string>;
}
