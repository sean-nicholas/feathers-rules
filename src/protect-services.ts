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
  paramsExtractors: {
    find: ([params]) => ({ ...params }),
    get: ([id, params]) => ({ id, ...params }),
    create: ([data, params]) => ({ data, ...params }),
    update: ([id, data, params]) => ({ id, data, ...params }),
    patch: ([id, data, params]) => ({ id, data, ...params }),
    remove: ([id, params]) => ({ id, ...params }),
  },
}

export function runLastHook(opts: ProtectServicesOptions) {
  return async (context: HookContext<any>) => {
    opts.checkAllowed({
      name: context.service.constructor.name,
      ...(context as any),
      ...(context.params as any),
    })
  }
}

function addLastHook(originalHooks: any, hookFunc: any) {
  const hookObject = {
    before: ['find', 'get'].reduce((obj, methodName) => ({
      ...obj,
      [methodName]: [hookFunc],
    }), {}),
  }
  originalHooks(hookObject)
}

function removeLastHooks(service: Service<any>, hookFunc: any) {
  const currentHooks: any[] = service.__hooks.before
  const withoutLastHook = _.mapValues(currentHooks, hooks => {
    return _.without(hooks, hookFunc)
  })
  service.__hooks.before = withoutLastHook
}

export function protectServices(options?: Partial<ProtectServicesOptions>) {
  const opts = {
    ...defaultOptions,
    ...options,
  }

  return (app: Application) => {
    // app.mixins.push((service, path) => {
    //   if (opts.omitServices.includes(path)) return

    //   const augmenter = new ServiceAugmenter(opts, service)
    //   augmenter.augmentService()
    // })

    app.mixins.push((service, path) => {
      const originalHook = service.hooks.bind(service)
      const hookFunc = runLastHook(opts)
      addLastHook(originalHook, hookFunc)
      const augmentedHooks = function augmentedHooks(hooks: Partial<HooksObject>) {
        const res = originalHook(hooks)
        removeLastHooks(service, hookFunc)
        addLastHook(originalHook, hookFunc)
        return res
      }
      service.hooks = augmentedHooks.bind(service)
    })
  }
}
