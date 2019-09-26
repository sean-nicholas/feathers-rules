import { HookContext } from '@feathersjs/feathers'
import { AllowedCheckerParams } from '../lib/allowed-checker'

export interface CheckAllowedOptions {
  allowedChecker: (params: AllowedCheckerParams) => void,
}

export function checkAllowed(opts: CheckAllowedOptions) {
  return async (context: HookContext<any>) => {
    opts.allowedChecker({
      name: context.service.constructor.name,
      ...(context as any),
      ...(context.params as any),
    })
  }
}
