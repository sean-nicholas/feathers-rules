import { ErrorInfo } from '../errors/error-info'
import { Params } from '@feathersjs/feathers'

// Typing hack because TS does currently not support indexing with symbols:
// https://github.com/microsoft/TypeScript/issues/1863
export const rulesRealm: string = Symbol('Rules Realm') as unknown as string

export function getRealm(params: Params) {
  return params[rulesRealm] || {}
}

export function addErrors(params: Params, errors: ErrorInfo[]) {
  if (!params[rulesRealm]) params[rulesRealm] = {}
  if (!params[rulesRealm].errors) params[rulesRealm].errors = []
  params[rulesRealm].errors.push(errors)
}
