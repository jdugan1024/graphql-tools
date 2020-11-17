export interface SchemaPrintOptions {
  /**
   * Descriptions are defined as preceding string literals, however an older
   * experimental version of the SDL supported preceding comments as
   * descriptions. Set to true to enable this deprecated behavior.
   * This option is provided to ease adoption and will be removed in v16.
   *
   * Default: false
   */
  commentDescriptions?: boolean;
}

export type Maybe<T> = null | undefined | T;

export type Constructor<T> = new (...args: any[]) => T;

/**
 * Options for removing unused types from the schema
 */
export interface PruneSchemaOptions {
  /**
   * Set to `true` to skip pruning object types or interfaces with no no fields
   */
  skipEmptyCompositeTypePruning?: boolean;
  /**
   * Set to `true` to skip pruning interfaces that are not implemented by any
   * other types
   */
  skipUnimplementedInterfacesPruning?: boolean;
  /**
   * Set to `true` to skip pruning empty unions
   */
  skipEmptyUnionPruning?: boolean;
  /**
   * Set to `true` to skip pruning unused types
   */
  skipUnusedTypesPruning?: boolean;
}

export interface ParsedMergeArgsExpr {
  args: Record<string, any>;
  keyDeclarations: Array<KeyDeclaration>;
  expansions: Array<Expansion>;
}

export interface KeyDeclaration {
  valuePath: Array<string | number>;
  keyPath: Array<string>;
}

export interface Expansion {
  valuePath: Array<string | number>;
  value: any;
  keyDeclarations: Array<KeyDeclaration>;
}

export type VariablePaths = Record<string, Array<string | number>>;
