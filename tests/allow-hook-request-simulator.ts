import { HookContext, Params } from '@feathersjs/feathers'
import { Rules } from '../src/hooks/allow'
import { allow } from '../src'

export class AllowHookRequestSimulator {
  constructor(
    private context: Partial<HookContext>,
    private params: Partial<Params>,
    private rules: Rules,
  ) { }

  public async run() {
    const context = this.getContext()

    const allowHook = allow(this.rules)
    await allowHook(this.getContext())

    return {
      context,
      params: context.params,
    }
  }

  public getContext() {
    return {
      ...this.context,
      params: this.params,
    }
  }

  public withRules(rules: Rules) {
    this.rules = rules
    return this
  }

  public withParams(params: Partial<Params>) {
    this.params = params
    return this
  }

  public withContext(context: Partial<HookContext>) {
    this.context = context
    return this
  }

  public withAdditionalParams(params: Partial<Params>) {
    this.params = {
      ...this.params,
      ...params,
    }
    return this
  }

  public withAdditionalContext(context: Partial<HookContext>) {
    this.context = {
      ...this.context,
      ...context,
    }
    return this
  }
}
