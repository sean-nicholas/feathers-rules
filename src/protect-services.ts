import { Application, HookContext, Service, HooksObject } from '@feathersjs/feathers'
import { checkAllowed } from './lib/check-allowed'
import { ServiceAugmenter, ServiceAugmenterOptions } from './lib/service-augmenter'
import * as _ from 'lodash'

export interface ProtectServicesOptions extends ServiceAugmenterOptions {
  omitServices: string[]
}

export const defaultOptions: ProtectServicesOptions = {
  checkAllowed: checkAllowed(),
  omitServices: [
    'authentication',
  ],
  methodsToProtect: ['find', 'get', 'create', 'update', 'patch', 'remove'],
}

export function protectServices(options?: Partial<ProtectServicesOptions>) {
  const opts = {
    ...defaultOptions,
    ...options,
  }

  return (app: Application) => {
    app.mixins.push((service, path) => {
      if (opts.omitServices.includes(path)) return

      const augmenter = new ServiceAugmenter(opts, service)
      augmenter.augmentService()
    })
  }
}
