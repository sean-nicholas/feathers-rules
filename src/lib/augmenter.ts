import { Service } from '@feathersjs/feathers'
import { CheckAllowedParams, AdditionalCheckAllowedParams } from './check-allowed'

export interface AugmenterOptions {
  checkAllowed: (params: CheckAllowedParams) => void
  paramsExtractors: {
    [methodName: string]: (args: any[]) => AdditionalCheckAllowedParams,
  }
}

export class Augmenter {
  constructor(
    private options: AugmenterOptions,
    private service: Service<any>,
  ) { }

  private methodsToAugment = Object.keys(this.options.paramsExtractors)

  public augmentService() {
    for (const methodName of this.methodsToAugment) {
      this.augmentMethod(methodName)
    }
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
