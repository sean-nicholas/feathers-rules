import { Service, HookContext, HooksObject } from '@feathersjs/feathers'
import { CheckAllowedParams, AdditionalCheckAllowedParams } from './check-allowed'
import { hooks } from '@feathersjs/commons'
const { getHooks } = hooks
import * as _ from 'lodash'

export interface ServiceAugmenterOptions {
  checkAllowed: (params: CheckAllowedParams) => void
  paramsExtractors: {
    [methodName: string]: (args: any[]) => AdditionalCheckAllowedParams,
  }
}

export class ServiceAugmenter {
  constructor(
    private options: ServiceAugmenterOptions,
    private service: Service<any>,
  ) { }

  private methodsToAugment = Object.keys(this.options.paramsExtractors)
  private originalHooks: any = null

  public augmentService() {
    this.originalHooks = this.service.hooks.bind(this.service)

    this.addLastHooks(this.service)

    const self = this
    const augmentedHooks = function augmentedHooks(hooks: Partial<HooksObject>) {
      const res = self.originalHooks(hooks)
      self.removeLastHooks(self.service)
      self.addLastHooks(self.service)
      return res
    }
    this.service.hooks = augmentedHooks.bind(this.service)

    // for (const methodName of this.methodsToAugment) {
    //   this.augmentMethod(methodName)
    // }
  }

  private removeLastHooks(service: Service<any>) {
    const currentHooks: any[] = service.__hooks.before
    const withoutLastHook = _.mapValues(currentHooks, hooks => {
      return _.without(hooks, this.lastHook)
    })
    service.__hooks.before = withoutLastHook
  }

  private addLastHooks(service: Service<any>) {
    const hookObject = {
      before: this.methodsToAugment.reduce((obj, methodName) => ({
        ...obj,
        [methodName]: [this.lastHook.bind(this)],
      }), {}),
    }
    this.originalHooks(hookObject)
  }

  private lastHook(context: HookContext<any>) {
    // TODO: Second argument
    // this.checkAllowed(context.method, context.params)
    console.log('lastHook')
    this.options.checkAllowed({
      name: this.service.constructor.name,
      method: context.method,
      ...context.params,
    })
  }

  private augmentMethod(methodName: string) {
    const original = this.service[methodName]
    this.service[methodName] = (...args: any[]) => {
      this.checkAllowed(methodName, args)
      return original.bind(this.service)(...args)
    }
  }

  private checkAllowed(methodName: string, args: any[]) {
    const params = this.extractParams(methodName, args)
    this.options.checkAllowed({
      name: this.service.constructor.name,
      method: methodName,
      ...params,
    })
  }

  private extractParams(methodName: string, args: any[]) {
    const extractor = this.options.paramsExtractors[methodName]
    return extractor(args)
  }
}
