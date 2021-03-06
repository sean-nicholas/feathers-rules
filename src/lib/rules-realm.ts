import { ErrorInfo } from '../errors/error-info'
import { Params } from '@feathersjs/feathers'

// Typing hack because TS does currently not support indexing with symbols:
// https://github.com/microsoft/TypeScript/issues/1863
export const rulesRealm: string = Symbol('Rules Realm') as unknown as string

export function getAllowedInRealm(params: Params): boolean {
  return getRealm(params).allowed
}

export function getErrorsInRealm(params: Params): ErrorInfo[] {
  return getRealm(params).errors
}

export function setAllowedToTrueInRealm(params: Params) {
  initRealm(params)
  params[rulesRealm].allowed = true
  return params
}

export function addErrorsToRealm(params: Params, errors: ErrorInfo[]) {
  initRealm(params)
  if (!params[rulesRealm].errors) params[rulesRealm].errors = []
  params[rulesRealm].errors.push(errors)
  return params
}

function getRealm(params: Params) {
  return params[rulesRealm] || {}
}

function initRealm(params: Params) {
  if (!params[rulesRealm]) params[rulesRealm] = {}
}
