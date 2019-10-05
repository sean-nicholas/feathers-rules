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

    const { params } = await simulate(method)
      .withRules({
        [method]: rule,
      })
      .run()
    expect(rule).toBeCalled()
  })

})
