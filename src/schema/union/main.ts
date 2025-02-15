/*
 * @vinejs/vine
 *
 * (c) VineJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import camelcase from 'camelcase'
import { RefsStore, UnionNode } from '@vinejs/compiler/types'

import { UnionConditional } from './conditional.js'
import { OTYPE, COTYPE, PARSE } from '../../symbols.js'
import type {
  ConstructableSchema,
  ParserOptions,
  SchemaTypes,
  UnionNoMatchCallback,
} from '../../types.js'

/**
 * Vine union represents a union data type. A union is a collection
 * of conditionals and each condition has an associated schema
 */
export class VineUnion<Conditional extends UnionConditional<SchemaTypes>>
  implements ConstructableSchema<Conditional[typeof OTYPE], Conditional[typeof COTYPE]>
{
  declare [OTYPE]: Conditional[typeof OTYPE];
  declare [COTYPE]: Conditional[typeof COTYPE]

  #conditionals: Conditional[]
  #otherwiseCallback?: UnionNoMatchCallback<Record<string, unknown>>

  constructor(conditionals: Conditional[]) {
    this.#conditionals = conditionals
  }

  /**
   * Define a fallback method to invoke when all of the union conditions
   * fail. You may use this method to report an error.
   */
  otherwise(callback: UnionNoMatchCallback<Record<string, unknown>>): this {
    this.#otherwiseCallback = callback
    return this
  }

  /**
   * Clones the VineUnion schema type.
   */
  clone(): this {
    const cloned = new VineUnion<Conditional>(this.#conditionals)
    if (this.#otherwiseCallback) {
      cloned.otherwise(this.#otherwiseCallback)
    }

    return cloned as this
  }

  /**
   * Compiles to a union
   */
  [PARSE](propertyName: string, refs: RefsStore, options: ParserOptions): UnionNode {
    return {
      type: 'union',
      fieldName: propertyName,
      propertyName: options.toCamelCase ? camelcase(propertyName) : propertyName,
      elseConditionalFnRefId: this.#otherwiseCallback
        ? refs.trackConditional(this.#otherwiseCallback)
        : undefined,
      conditions: this.#conditionals.map((conditional) =>
        conditional[PARSE](propertyName, refs, options)
      ),
    }
  }
}
