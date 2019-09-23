import { Forbidden } from '@feathersjs/errors'
import { Params } from '@feathersjs/feathers'
import * as _ from 'lodash'

export interface ICheckAllowedOptions {
  /**
   * Lodash _.get format supported. Example: user.details.password
   */
  protectedFields: string[]
  protectWord: string
}

export const defaultOptions: ICheckAllowedOptions = {
  protectWord: '[HIDDEN]',
  protectedFields: ['password', 'newPassword', 'oldPassword'],
}

export function checkAllowed(options: ICheckAllowedOptions = defaultOptions) {
  return (params: Params) => {
    if (params.allowed === true) return
    if (!params.provider) return

    let errorDetails = ''
    if (params.name) errorDetails += ` service: ${params.name}`
    if (params.method) errorDetails += ` method: ${params.method}`
    if (params.id) errorDetails += ` id: ${params.id}`

    if (params.data) {
      const data = { ...params.data }

      for (const protectedField of options.protectedFields) {
        if (_.get(data, protectedField)) {
          _.set(data, protectedField, options.protectWord)
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
