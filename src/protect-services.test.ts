import feathers, { Params, HookContext } from '@feathersjs/feathers'
import { protectServices } from './protect-services'
import { MockService } from '../tests/mock-service'
import { Forbidden } from '@feathersjs/errors'
import { allow } from './hooks/allow'

describe('protectServices', () => {
  it('runs the checkAllowed function before a service method is run', async () => {
    const checkAllowed = jest.fn()
    const app = feathers().configure(protectServices({
      checkAllowed,
    }))
    app.use('/test', new MockService())
    await app.service('test').find()
    expect(checkAllowed).toBeCalledTimes(1)
  })

  it('the service method throws if not allowed', () => {
    const app = feathers().configure(protectServices())
    app.use('/test', new MockService())
    const params: Params = {
      provider: 'rest',
    }

    const service = app.service('test')

    const findRes = service.find(params)
    expect(findRes).rejects.toBeInstanceOf(Forbidden)

    const getRes = service.get(null, params)
    expect(getRes).rejects.toBeInstanceOf(Forbidden)

    const createRes = service.create({}, params)
    expect(createRes).rejects.toBeInstanceOf(Forbidden)

    const updateRes = service.update(null, {}, params)
    expect(updateRes).rejects.toBeInstanceOf(Forbidden)

    const patchRes = service.patch(null, {}, params)
    expect(patchRes).rejects.toBeInstanceOf(Forbidden)

    const removeRes = service.remove(null, params)
    expect(removeRes).rejects.toBeInstanceOf(Forbidden)
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

    const negativeResult = app.service('test').find(params)
    expect(negativeResult).rejects.toBeInstanceOf(Forbidden)

    const positiveResult = service.find({
      ...params,
      query: {
        testQuery: 'yes',
      },
    })
    expect(positiveResult).resolves.toBe('test-find')
  })

  // TODO: Test if lastHook is always last --> 2x service.hooks
  // TODO: Test custom method
})
