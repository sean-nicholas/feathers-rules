import { ServiceAugmenter } from './service-augmenter'
import { defaultOptions } from '../protect-services'

class MockService {
  private internal = 'test'
  public async find(...args: any[]) { return `${this.internal}-find` }
  public async get(...args: any[]) { return `${this.internal}-get` }
  public async create(...args: any[]) { return `${this.internal}-create` }
  public async update(...args: any[]) { return `${this.internal}-update` }
  public async patch(...args: any[]) { return `${this.internal}-patch` }
  public async remove(...args: any[]) { return `${this.internal}-remove` }
  public async custom(...args: any[]) { return `${this.internal}-custom` }
}

describe('ServiceAugmenter', () => {
  it('calls checkAllowed on all standard service methods', () => {
    const checkAllowed = jest.fn()
    const service = new MockService()

    const options = {
      checkAllowed,
      paramsExtractors: defaultOptions.paramsExtractors,
    }

    const augmenter = new ServiceAugmenter(options, service as any)
    augmenter.augmentService()

    service.find()
    expect(checkAllowed).toBeCalledTimes(1)

    service.get()
    expect(checkAllowed).toBeCalledTimes(2)

    service.create()
    expect(checkAllowed).toBeCalledTimes(3)

    service.patch()
    expect(checkAllowed).toBeCalledTimes(4)

    service.update()
    expect(checkAllowed).toBeCalledTimes(5)

    service.remove()
    expect(checkAllowed).toBeCalledTimes(6)
  })

  it('calls service\'s original method with correctly binded this', async () => {
    const checkAllowed = () => { }
    const service = new MockService()

    const options = {
      checkAllowed,
      paramsExtractors: defaultOptions.paramsExtractors,
    }

    const augmenter = new ServiceAugmenter(options, service as any)
    augmenter.augmentService()

    let res

    res = await service.find()
    expect(res).toBe('test-find')

    res = await service.get()
    expect(res).toBe('test-get')

    res = await service.create()
    expect(res).toBe('test-create')

    res = await service.patch()
    expect(res).toBe('test-patch')

    res = await service.update()
    expect(res).toBe('test-update')

    res = await service.remove()
    expect(res).toBe('test-remove')
  })

  it('calls service\'s original method with correct params', () => {
    const checkAllowed = () => { }
    const service = new MockService()
    const findSpy = jest.spyOn(service, 'find')
    const getSpy = jest.spyOn(service, 'get')
    const createSpy = jest.spyOn(service, 'create')
    const updateSpy = jest.spyOn(service, 'update')
    const patchSpy = jest.spyOn(service, 'patch')
    const removeSpy = jest.spyOn(service, 'remove')

    const options = {
      checkAllowed,
      paramsExtractors: defaultOptions.paramsExtractors,
    }

    const augmenter = new ServiceAugmenter(options, service as any)
    augmenter.augmentService()

    service.find('first', 'second', 'third')
    expect(findSpy).toBeCalledWith('first', 'second', 'third')

    service.get('first', 'second', 'third')
    expect(getSpy).toBeCalledWith('first', 'second', 'third')

    service.create('first', 'second', 'third')
    expect(createSpy).toBeCalledWith('first', 'second', 'third')

    service.update('first', 'second', 'third')
    expect(updateSpy).toBeCalledWith('first', 'second', 'third')

    service.patch('first', 'second', 'third')
    expect(patchSpy).toBeCalledWith('first', 'second', 'third')

    service.remove('first', 'second', 'third')
    expect(removeSpy).toBeCalledWith('first', 'second', 'third')
  })

  it('calls checkAllowed with correct parameters', () => {
    const checkAllowed = jest.fn()
    const service = new MockService()

    const options = {
      checkAllowed,
      paramsExtractors: defaultOptions.paramsExtractors,
    }

    const augmenter = new ServiceAugmenter(options, service as any)
    augmenter.augmentService()

    service.find({ some: 'params' })
    expect(checkAllowed).toBeCalledWith({
      name: 'MockService',
      method: 'find',
      some: 'params',
    })

    service.get('id', { some: 'params' })
    expect(checkAllowed).toBeCalledWith({
      name: 'MockService',
      method: 'get',
      id: 'id',
      some: 'params',
    })

    service.create({ username: 'test' }, { some: 'params' })
    expect(checkAllowed).toBeCalledWith({
      name: 'MockService',
      method: 'create',
      data: {
        username: 'test',
      },
      some: 'params',
    })

    service.update('id', { username: 'test' }, { some: 'params' })
    expect(checkAllowed).toBeCalledWith({
      name: 'MockService',
      method: 'update',
      id: 'id',
      data: {
        username: 'test',
      },
      some: 'params',
    })

    service.patch('id', { username: 'test' }, { some: 'params' })
    expect(checkAllowed).toBeCalledWith({
      name: 'MockService',
      method: 'update',
      id: 'id',
      data: {
        username: 'test',
      },
      some: 'params',
    })

    service.remove('id', { some: 'params' })
    expect(checkAllowed).toBeCalledWith({
      name: 'MockService',
      method: 'remove',
      id: 'id',
      some: 'params',
    })
  })

  it('supports custom methods', async () => {
    const checkAllowed = jest.fn()
    const service = new MockService()
    const spy = jest.spyOn(service, 'custom')

    const options = {
      checkAllowed,
      paramsExtractors: {
        ...defaultOptions.paramsExtractors,
        custom: ([id, data, params]: any) => ({ id, data, params }),
      },
    }

    const augmenter = new ServiceAugmenter(options, service as any)
    augmenter.augmentService()

    const res = await service.custom('first', 'second', 'third')
    expect(res).toBe('test-custom')
    expect(checkAllowed).toBeCalledWith({
      name: 'MockService',
      method: 'custom',
      id: 'first',
      data: 'second',
      params: 'third',
    })
    expect(spy).toBeCalledWith('first', 'second', 'third')
  })

})
