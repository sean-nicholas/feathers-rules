import feathers, { Params, HookContext } from '@feathersjs/feathers'
import { protectServices } from './protect-services'
import { MockService, FIND_RETURN } from '../tests/mock-service'
import { Forbidden } from '@feathersjs/errors'
import { allow } from './hooks/allow'

describe('protectServices', () => {
  it('runs the allowedChecker function before a service method is run', async () => {
    const allowedChecker = jest.fn()
    const app = feathers()
    app.use('/test', new MockService())
    app.configure(protectServices({
      allowedChecker,
    }))
    await app.service('test').find()
    expect(allowedChecker).toBeCalledTimes(1)
  })

  it('the service method throws if not allowed', async () => {
    const app = feathers()
    app.use('/test', new MockService())
    app.configure(protectServices())
    const params: Params = {
      provider: 'rest',
    }

    const service = app.service('test')

    const findRes = service.find(params)
    await expect(findRes).rejects.toBeInstanceOf(Forbidden)

    const getRes = service.get(null, params)
    await expect(getRes).rejects.toBeInstanceOf(Forbidden)

    const createRes = service.create({}, params)
    await expect(createRes).rejects.toBeInstanceOf(Forbidden)

    const updateRes = service.update(null, {}, params)
    await expect(updateRes).rejects.toBeInstanceOf(Forbidden)

    const patchRes = service.patch(null, {}, params)
    await expect(patchRes).rejects.toBeInstanceOf(Forbidden)

    const removeRes = service.remove(null, params)
    await expect(removeRes).rejects.toBeInstanceOf(Forbidden)
  })

  it('rules are run and grant access', async () => {
    const app = feathers()
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
    app.configure(protectServices())

    const params: Params = {
      provider: 'rest',
    }

    const negativeResult = app.service('test').find(params)
    await expect(negativeResult).rejects.toBeInstanceOf(Forbidden)

    const positiveResult = service.find({
      ...params,
      query: {
        testQuery: 'yes',
      },
    })
    await expect(positiveResult).resolves.toBe(FIND_RETURN)
  })

  it('does not add the allowHook on omitted services', async () => {
    const app = feathers()
    app.use('/test', new MockService())
    app.use('/omit', new MockService())
    app.configure(protectServices({ omitServices: ['omit'] }))

    const params: Params = {
      provider: 'rest',
    }

    const testSrv = app.service('test')
    const omitSrv = app.service('omit')

    const testResult = testSrv.find(params)
    await expect(testResult).rejects.toBeInstanceOf(Forbidden)

    const omitResult = omitSrv.find(params)
    await expect(omitResult).resolves.toBe(FIND_RETURN)
  })

})
