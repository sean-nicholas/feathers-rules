import feathers, { Params, Service } from '@feathersjs/feathers'
import { allow, Rules } from './allow'
import { MockService } from '../../tests/mock-service'
import { protectServices } from '..'
import { Forbidden } from '@feathersjs/errors'

function setupApp(hook: any) {
  const app = feathers()
  app.use('/test', new MockService())
  const service: Service<any> = app.service('test')
  service.hooks({
    before: {
      all: [hook],
    },
  })
  app.configure(protectServices())
  return { app, service }
}

describe('allow hook', () => {
  const basicRules: Rules = {
    find: context => {
      return !!(context.params.query && context.params.query.test === true)
    },
  }

  const basicParams = {
    provider: 'rest',
  }

  it('does skip checking if it is an internal call', () => {
    const { service } = setupApp(allow(basicRules))
    const res = service.find()
    expect(res).resolves.toBe('test-find')
  })

  it('does throw if it is an external call & rules dont match', () => {
    const { service } = setupApp(allow(basicRules))
    const res = service.find(basicParams)
    expect(res).rejects.toBeInstanceOf(Forbidden)
  })

})
