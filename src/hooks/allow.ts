import { HookContext } from '@feathersjs/feathers'
import { rulesRealm, addErrors as addErrorsToRealm } from '../lib/rules-realm'
import { RulesError } from '../errors/rules-error'
import { BadRequest } from '@feathersjs/errors'

export type AllowFunction<T = any> = (context: HookContext<T>) => boolean | Promise<boolean>

export type Rules<T = any> = Partial<{
  read: AllowFunction<T>
  write: AllowFunction<T>
  all: AllowFunction<T>
  find: AllowFunction<T>
  get: AllowFunction<T>
  create: AllowFunction<T>
  update: AllowFunction<T>
  patch: AllowFunction<T>
  remove: AllowFunction<T>
  [ruleName: string]: AllowFunction<T>,
}>

const singleLetterToMethod: { [key: string]: string } = {
  c: 'create',
  f: 'find',
  g: 'get',
  p: 'patch',
  r: 'remove',
  u: 'update',
}

const ruleNames = [
  'read',
  'write',
  'all',
  'find',
  'get',
  'create',
  'update',
  'patch',
  'remove',
]

function singleLetterRuleNames(names: string, method: string) {
  if (ruleNames.includes(names)) return false

  const singleLetters = names.split('')
  const matchingMethods = singleLetters.map(ruleName => singleLetterToMethod[ruleName])
  return matchingMethods.includes(method)
}

export const allow = (allowFuncs: Rules) => {
  const func = async (context: HookContext<any>) => {
    // If it was an internal call then skip this hook
    if (!context.params.provider) return context

    if (!context.params[rulesRealm]) context.params[rulesRealm] = {}

    // Was previously allowed --> skip hook
    if (context.params[rulesRealm].allowed) return context

    const filteredFuncs = Object.entries(allowFuncs)
      .filter(([ruleName]) => {
        if (context.method === ruleName) return true
        if (ruleName === 'read' && ['find', 'get'].includes(context.method)) return true
        if (ruleName === 'write' && ['create', 'update', 'patch', 'remove'].includes(context.method)) return true
        if (ruleName === 'all') return true
        if (singleLetterRuleNames(ruleName, context.method) === true) return true
        return false
      })
      .map(([ruleName, allowFunc]) => allowFunc as AllowFunction)

    for (const allowFunc of filteredFuncs) {
      try {
        const allowed = await allowFunc(context)
        if (allowed) {
          context.params[rulesRealm].allowed = true
          return context
        }
      } catch (error) {
        if (!(error instanceof RulesError)) throw error
        addErrorsToRealm(context.params, error.getErrors())
      }
    }
  }
  return func as any
}
