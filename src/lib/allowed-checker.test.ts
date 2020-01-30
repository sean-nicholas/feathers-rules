import { allowedChecker, AllowedCheckerParams } from './allowed-checker'
import { Forbidden, BadRequest } from '@feathersjs/errors'
import { getAllowedInRealm, setAllowedToTrueInRealm, addErrorsToRealm } from './rules-realm'
import { ErrorInfo } from '../errors/error-info'

describe('allowedChecker', () => {
  const defaultParams: AllowedCheckerParams = { provider: 'rest' }
  let check: (params: AllowedCheckerParams) => void

  beforeEach(() => {
    check = allowedChecker()
  })

  it('does not change params.allowed if an earlier rule already allowed access', () => {
    const params = setAllowedToTrueInRealm({
      ...defaultParams,
    })
    check(params)

    expect(getAllowedInRealm(params)).toBe(true)
  })

  it('does throw forbidden if allowed is not true', () => {
    const doCheck = () => check(defaultParams)
    expect(doCheck).toThrow(Forbidden)
  })

  it('does not throw if it is an internal call', () => {
    const doCheck = () => check({
      provider: undefined,
    })
    expect(doCheck).not.toThrow()
  })

  describe('BadRequest errors (for validation)', () => {

    it('throws BadRequest with errors if errors exist', () => {
      const errors: ErrorInfo[] = [
        { message: 'First error' },
        { message: 'Second Error' },
      ]
      const params = addErrorsToRealm({ ...defaultParams }, errors)

      const doCheck = () => check({
        ...params,
        query: {
          first: {
            second: 'second-value',
          },
        },
      })

      expect(doCheck).toThrow(BadRequest)
    })

    it('does not throw if errors exist but allowed is true', () => {
      const errors: ErrorInfo[] = [{ message: 'First error' }]

      let params = addErrorsToRealm({ ...defaultParams }, errors)
      params = setAllowedToTrueInRealm(params)

      const doCheck = () => check(params)

      expect(doCheck).not.toThrow()
    })

    it('throws only the first array of errors if errors exist', () => {
      const firstErrors: ErrorInfo[] = [
        { message: 'First error' },
        { message: 'Second error' },
      ]
      const secondErrors: ErrorInfo[] = [...firstErrors]

      let params = addErrorsToRealm({ ...defaultParams }, firstErrors)
      params = addErrorsToRealm(params, secondErrors)

      // There might be better ways to test this synchronously
      const doCheck = async () => check({
        ...params,
        query: {
          first: {
            second: 'second-value',
          },
        },
      })

      expect(doCheck()).rejects.toBeInstanceOf(BadRequest)
      expect(doCheck()).rejects.toMatchObject({ errors: firstErrors })
    })

  })

  describe('message formatting', () => {

    it('does hide passwords', () => {
      const doCheck = () => check({
        ...defaultParams,
        data: {
          password: 'SECRET',
          newPassword: 'SECRET',
          oldPassword: 'SECRET',
        },
      })
      expect(doCheck).toThrow('Request is not allowed for data: {"password":"[HIDDEN]","newPassword":"[HIDDEN]","oldPassword":"[HIDDEN]"}')
    })

    it('does hide additional fields', () => {
      const checker = allowedChecker({
        protectedFields: [
          'secret',
          'deep.field.secret',
        ],
      })

      const doCheck = () => checker({
        ...defaultParams,
        data: {
          secret: 'SECRET',
          deep: { field: { secret: 'SECRET' } },
        },
      })
      expect(doCheck).toThrow('Request is not allowed for data: {"secret":"[HIDDEN]","deep":{"field":{"secret":"[HIDDEN]"}}}')
    })

    it('uses custom word to hide fields', () => {
      const checker = allowedChecker({
        protectWord: 'PSSSST',
      })

      const doCheck = () => checker({
        ...defaultParams,
        data: {
          password: 'SECRET',
        },
      })
      expect(doCheck).toThrow('Request is not allowed for data: {"password":"PSSSST"}')
    })

    it('shows params.data in exception message', () => {
      const doCheck = () => check({
        ...defaultParams,
        data: {
          information: 'important',
        },
      })
      expect(doCheck).toThrow('Request is not allowed for data: {"information":"important"}')
    })

    it('shows the service name in the exception message', () => {
      const doCheck = () => check({
        ...defaultParams,
        name: 'UserService',
      })
      expect(doCheck).toThrow('Request is not allowed for service: UserService')
    })

    it('shows the id in the exception message', () => {
      const doCheck = () => check({
        ...defaultParams,
        id: 'test',
      })
      expect(doCheck).toThrow('Request is not allowed for id: test')
    })

    it('shows the query in the exception message', () => {
      const doCheck = () => check({
        ...defaultParams,
        query: {
          first: {
            second: 'second-value',
          },
        },
      })
      expect(doCheck).toThrow('Request is not allowed for query: {"first":{"second":"second-value"}}')
    })

  })

})
