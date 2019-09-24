import { Application } from '@feathersjs/feathers'
import { checkAllowed } from './lib/check-allowed'
import { ServiceAugmenter, ServiceAugmenterOptions } from './lib/service-augmenter'

export interface ProtectServicesOptions extends ServiceAugmenterOptions {
  omitServices: string[]
}

export const defaultOptions: ProtectServicesOptions = {
  checkAllowed: checkAllowed(),
  omitServices: [
    'authentication',
  ],
  paramsExtractors: {
    find: ([params]) => ({ ...params }),
    get: ([id, params]) => ({ id, ...params }),
    create: ([data, params]) => ({ data, ...params }),
    update: ([id, data, params]) => ({ id, data, ...params }),
    patch: ([id, data, params]) => ({ id, data, ...params }),
    remove: ([id, params]) => ({ id, ...params }),
  },
}

export function protectServices(options: ProtectServicesOptions) {
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
