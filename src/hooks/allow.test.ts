import { Rules } from './allow'
import { AllowHookRequestSimulator } from '../../tests/allow-hook-request-simulator'

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

const FIND_QUERY_THAT_IS_ALLOWED = { test: true }

describe('allow hook', () => {
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

  describe('with single letter rules', () => {
    it('runs f rule', async () => {
      const rule = jest.fn()

      await simulate('find')
        .withRules({
          f: rule,
        })
        .run()

      expect(rule).toBeCalled()
    })

    it('runs rule with multiple single letters in name', async () => {
      const rule = jest.fn()

      await simulate('find')
        .withRules({
          fg: rule,
        })
        .run()

      expect(rule).toBeCalled()
    })
  })

  describe('with special rule keywords', () => {
    it('runs read rule on find & get but not on create, update, patch, remove', async () => {
      const rule = jest.fn()
      const rules = { read: rule }

      await simulate('find').withRules(rules).run()
      await simulate('get').withRules(rules).run()

      // Should not run
      await simulate('create').withRules(rules).run()
      await simulate('update').withRules(rules).run()
      await simulate('patch').withRules(rules).run()
      await simulate('remove').withRules(rules).run()

      expect(rule).toBeCalledTimes(2)
    })

    it('runs write rule on create, update, patch, remove but not on find, get', async () => {
      const rule = jest.fn()
      const rules = { write: rule }

      await simulate('create').withRules(rules).run()
      await simulate('update').withRules(rules).run()
      await simulate('patch').withRules(rules).run()
      await simulate('remove').withRules(rules).run()

      // Should not run
      await simulate('find').withRules(rules).run()
      await simulate('get').withRules(rules).run()

      expect(rule).toBeCalledTimes(4)
    })

  })

})
