import { Service, HookContext, HooksObject, Hook } from '@feathersjs/feathers'
import { CheckAllowedParams } from './check-allowed'
import * as _ from 'lodash'

export interface ServiceAugmenterOptions {
  checkAllowed: (params: CheckAllowedParams) => void,
  methodsToProtect: string[]
}

// TODO: Put in own file in src/hooks
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
    const newHooksMethod = (hooks: Partial<HooksObject>) => {
      const res = this.originalHooks(hooks)
      this.addLastHookToLastPosition()
      return res
    }

    this.service.hooks = newHooksMethod
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
      // TODO: These shouldn't come from options. These should come from the service itself
      // TODO: Options should only omit methods
      before: this.options.methodsToProtect.reduce((obj, methodName) => ({
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
