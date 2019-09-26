import { HookContext } from '@feathersjs/feathers'
import { CheckAllowedParams } from '../lib/allowed-checker'

export interface CheckAllowedHookOptions {
  checkAllowed: (params: CheckAllowedParams) => void,
}

export function checkAllowedHook(opts: CheckAllowedHookOptions) {
  return async (context: HookContext<any>) => {
    opts.checkAllowed({
      name: context.service.constructor.name,
      ...(context as any),
      ...(context.params as any),
    })
  }
}
