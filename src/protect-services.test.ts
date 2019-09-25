import feathers, { Application, Params, HookContext } from '@feathersjs/feathers'
import { protectServices } from './protect-services'
import { MockService } from '../tests/mock-service'
import { Forbidden } from '@feathersjs/errors'
import { allow } from './hooks/allow'

describe('protectServices', () => {
  it('runs the checkAllowed function before a service method is run', () => {
    const checkAllowed = jest.fn()
    const app = feathers().configure(protectServices({
      checkAllowed,
    }))
    app.use('/test', new MockService())
    app.service('test').find()
    expect(checkAllowed).toBeCalledTimes(1)
  })

  it('the service method throws if not allowed', () => {
    const app = feathers().configure(protectServices())
    app.use('/test', new MockService())
    const params: Params = {
      provider: 'rest',
    }
    const doFind = () => app.service('test').find(params)
    expect(doFind).toThrow(Forbidden)
  })

  it('rules are run and grant access', () => {
    const app = feathers().configure(protectServices())
    app.use('/test', new MockService())
    const service = app.service('test')
    service.hooks({
      before: {
        find: [
          allow({
            find: (context: HookContext<any>) => {
              return !!(context.params.query && context.params.query.testQuery === 'yes')
            },
          }),
        ],
      },
    })

    const params: Params = {
      provider: 'rest',
    }
    app.service('test').find(params)

    const doFindWithoutQuery = () => app.service('test').find(params)
    expect(doFindWithoutQuery).toThrow(Forbidden)

    const doFindWithQuery = () => service.find({
      ...params,
      query: {
        testQuery: 'yes',
      },
    })
    expect(doFindWithQuery).not.toThrow(Forbidden)
  })

})
