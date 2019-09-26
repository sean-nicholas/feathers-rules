import { Application, HookContext, Service, HooksObject } from '@feathersjs/feathers'
import { allowedChecker, CheckAllowedParams } from './lib/allowed-checker'
import * as _ from 'lodash'
import { checkAllowedHook } from './hooks/check-allowed'

export interface ProtectServicesOptions {
  checkAllowed: (params: CheckAllowedParams) => void,
  omitServices: string[]
}

const METHODS = ['find', 'get', 'create', 'update', 'patch', 'remove']

export const defaultOptions: ProtectServicesOptions = {
  checkAllowed: allowedChecker(),
  omitServices: [
    'authentication',
  ],
}

function addHooks(service: Service<any>, opts: ProtectServicesOptions) {
  service.hooks({
    before: {
      ...METHODS.reduce((obj: any, methodName: string) => ({
        ...obj,
        [methodName]: [checkAllowedHook(opts)],
      }), {}),
    },
  })
}

export function protectServices(options?: Partial<ProtectServicesOptions>) {
  const opts = {
    ...defaultOptions,
    ...options,
  }

  return (app: Application) => {
    for (const serviceName of Object.keys(app.services)) {
      if (opts.omitServices.includes(serviceName)) continue
      const service = app.service(serviceName)
      addHooks(service, opts)
    }
  }
}
