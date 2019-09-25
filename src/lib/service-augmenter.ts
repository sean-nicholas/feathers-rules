import { Service, HookContext, HooksObject, Hook } from '@feathersjs/feathers'
import { CheckAllowedParams } from './check-allowed'
import * as _ from 'lodash'

export interface ServiceAugmenterOptions {
  checkAllowed: (params: CheckAllowedParams) => void,
  methodsToProtect: string[]
}

type ServiceHooksMethod = (hooks: Partial<HooksObject>) => Service<any>

export function checkAllowedFactory(opts: ServiceAugmenterOptions) {
  return async (context: HookContext<any>) => {
    opts.checkAllowed({
      name: context.service.constructor.name,
      ...(context as any),
      ...(context.params as any),
    })
  }
}

export class ServiceAugmenter {
  constructor(
    private options: ServiceAugmenterOptions,
    private service: Service<any>,
  ) { }

  private originalHooks = this.service.hooks.bind(this.service)
  private hookFunc = checkAllowedFactory(this.options)

  public augmentService() {
    this.initiallyAddHook()
    this.augmentHooksMethod()
  }

  private augmentHooksMethod() {
    const self = this

    const hooksMethod = function augmentedHooks(hooks: Partial<HooksObject>) {
      const res = self.originalHooks(hooks)
      self.addLastHookToLastPosition()
      return res
    }

    this.service.hooks = hooksMethod.bind(this.service)
  }

  private initiallyAddHook() {
    this.addLastHook()
  }

  private addLastHookToLastPosition() {
    this.removeLastHooks()
    this.addLastHook()
  }

  private addLastHook() {
    const hookObject = {
      before: ['find', 'get'].reduce((obj, methodName) => ({
        ...obj,
        [methodName]: [this.hookFunc],
      }), {}),
    }
    this.originalHooks(hookObject)
  }

  private removeLastHooks() {
    const currentHooks: any[] = this.service.__hooks.before
    const withoutLastHook = _.mapValues(currentHooks, hooks => {
      return _.without(hooks, this.hookFunc)
    })
    this.service.__hooks.before = withoutLastHook
  }
}
