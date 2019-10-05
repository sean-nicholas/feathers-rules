import { Rules, AllowFunction } from './allow'
import { AllowHookRequestSimulator } from '../../tests/allow-hook-request-simulator'
import { HookContext } from '@feathersjs/feathers'

const basicParams = {
  provider: 'rest',
}

const basicRules: Rules = {
  find: context => !!(context.params.query && context.params.query.test === true),
}

function simulate(method: string) {
  const context = { method }
  const params = { ...basicParams }
  const rules = { ...basicRules }
  return new AllowHookRequestSimulator(context, params, rules)
}

async function expectRulesToBeRunOnMethods(ruleName: string, methodNames: string[]) {
  const calledMethods: string[] = []
  const rule: AllowFunction = context => {
    calledMethods.push(context.method)
    return true
  }
  await simulateForAllMethods({
    [ruleName]: rule,
  })
  expect(calledMethods).toEqual(methodNames)
}

async function simulateForAllMethods(rules: Rules) {
  await simulate('find').withRules(rules).run()
  await simulate('get').withRules(rules).run()
  await simulate('create').withRules(rules).run()
  await simulate('update').withRules(rules).run()
  await simulate('patch').withRules(rules).run()
  await simulate('remove').withRules(rules).run()
}

const FIND_QUERY_THAT_IS_ALLOWED = { test: true }

describe('allow hook', () => {
  it('runs rule with corresponding method name', async () => {
    const method = 'made-up-method'
    const rule = jest.fn()

    await simulate(method)
      .withRules({
        [method]: rule,
      })
      .run()

    expect(rule).toBeCalled()
  })

  describe('does skip rules checking', () => {
    it('if it is an internal call', async () => {
      const findRule = jest.fn()

      await simulate('find')
        .withParams({ provider: undefined })
        .withRules({ find: findRule })
        .run()

      expect(findRule).not.toBeCalled()
    })

    it('if it was allowed before', async () => {
      const findRule = jest.fn()

      await simulate('find')
        .withAdditionalParams({ allowed: true })
        .withRules({ find: findRule })
        .run()

      expect(findRule).not.toBeCalled()
    })
  })

  describe('with find rule', () => {
    it('does not set params.allow to true if rule does not match', async () => {
      const { params } = await simulate('find').run()
      expect(params.allowed).toBe(undefined)
    })

    it('does set params.allow to true if rule matches', async () => {
      const { params } = await simulate('find')
        .withAdditionalParams({ query: FIND_QUERY_THAT_IS_ALLOWED })
        .run()
      expect(params.allowed).toBe(true)
    })
  })

  describe('with method rule names', () => {
    it('runs only the rule for the corresponding method', async () => {
      await expectRulesToBeRunOnMethods('find', ['find'])
      await expectRulesToBeRunOnMethods('get', ['get'])
      await expectRulesToBeRunOnMethods('create', ['create'])
      await expectRulesToBeRunOnMethods('update', ['update'])
      await expectRulesToBeRunOnMethods('patch', ['patch'])
      await expectRulesToBeRunOnMethods('remove', ['remove'])
    })
  })

  describe('with single letter rules', () => {
    it('runs f rule on find but not on get, create, update, patch, remove', async () => {
      await expectRulesToBeRunOnMethods('f', ['find'])
    })

    it('runs fgc rule on find, get, create but not on update, patch, remove', async () => {
      await expectRulesToBeRunOnMethods('fgc', ['find', 'get', 'create'])
    })
  })

  describe('with special rule names', () => {
    it('runs read rule on find & get but not on create, update, patch, remove', async () => {
      await expectRulesToBeRunOnMethods('read', ['find', 'get'])
    })

    it('runs write rule on create, update, patch, remove but not on find, get', async () => {
      await expectRulesToBeRunOnMethods('write', ['create', 'update', 'patch', 'remove'])
    })

    it('runs all rule on all methods', async () => {
      await expectRulesToBeRunOnMethods('all', ['find', 'get', 'create', 'update', 'patch', 'remove'])
    })
  })

})
