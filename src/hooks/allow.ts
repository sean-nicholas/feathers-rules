import { HookContext } from '@feathersjs/feathers'

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
  [ruleKey: string]: AllowFunction<T>,
}>

const singleLetterToMethod: { [key: string]: string } = {
  c: 'create',
  f: 'find',
  g: 'get',
  p: 'patch',
  r: 'remove',
  u: 'update',
}

function singleLetterRuleNames(names: string, method: string) {
  const ruleNames = names.split('')
  const matchingMethods = ruleNames.map(ruleName => singleLetterToMethod[ruleName])
  return matchingMethods.includes(method)
}

export const allow = (allowFuncs: Rules) => {
  const func = async (context: HookContext<any>) => {
    // If it was an internal call then skip this hook
    if (!context.params.provider) return context

    // Was previously allowed --> skip hook
    if (context.params.allowed) return context

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
      const allowed = await allowFunc(context)
      if (allowed) {
        context.params.allowed = true
        return context
      }
    }
  }
  return func as any
}
