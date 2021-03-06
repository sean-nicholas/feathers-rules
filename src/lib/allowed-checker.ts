import { Forbidden, BadRequest } from '@feathersjs/errors'
import { Params } from '@feathersjs/feathers'
import * as _ from 'lodash'
import { getAllowedInRealm, getErrorsInRealm } from './rules-realm'

export interface AllowedCheckerOptions {
  /**
   * Lodash _.get format supported. Example: user.details.password
   */
  protectedFields: string[]
  protectWord: string
}

export const defaultOptions: AllowedCheckerOptions = {
  protectWord: '[HIDDEN]',
  protectedFields: ['password', 'newPassword', 'oldPassword'],
}

export interface AdditionalAllowedCheckParams {
  name?: string
  method?: string,
  data?: any
  id?: string
  allowed?: boolean
}

export type AllowedCheckerParams = AdditionalAllowedCheckParams & Params

export function allowedChecker(options?: Partial<AllowedCheckerOptions>) {
  const opts = {
    ...defaultOptions,
    ...options,
  }

  return (params: AllowedCheckerParams) => {
    if (!params.provider) return
    if (getAllowedInRealm(params) === true) return

    throwBadRequestErrorIfErrorsExist(params)
    throwForbiddenError(params)
  }

  function throwBadRequestErrorIfErrorsExist(params: AllowedCheckerParams) {
    const errors = getErrorsInRealm(params)
    if (!errors || errors.length === 0) return

    // Currently just return the errors from the first throwing rule
    const firstErrors = errors[0]
    throw new BadRequest('Validation Error', { errors: firstErrors })
  }

  function throwForbiddenError(params: AllowedCheckerParams) {
    let errorDetails = ''
    if (params.name) errorDetails += ` service: ${params.name}`
    if (params.method) errorDetails += ` method: ${params.method}`
    if (params.id) errorDetails += ` id: ${params.id}`

    if (params.data) {
      const data = { ...params.data }

      for (const protectedField of opts.protectedFields) {
        if (_.get(data, protectedField)) {
          _.set(data, protectedField, opts.protectWord)
        }
      }

      errorDetails += ` data: ${JSON.stringify(data)}`
    }

    if (typeof params.query === 'object' && Object.keys(params.query).length) {
      errorDetails += ` query: ${JSON.stringify(params.query)}`
    }

    throw new Forbidden('Request is not allowed for' + errorDetails)
  }
}
