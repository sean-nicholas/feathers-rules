import { Forbidden } from '@feathersjs/errors'
import { Params } from '@feathersjs/feathers'
import * as _ from 'lodash'

export interface ICheckAllowedConfig {
  /**
   * Lodash _.get format supported. Example: user.details.password
   */
  protectedFields: string[]
  protectWord: string
}

export const defaultConfig: ICheckAllowedConfig = {
  protectWord: '[HIDDEN]',
  protectedFields: ['password', 'newPassword', 'oldPassword'],
}

export function checkAllowed(config: ICheckAllowedConfig = defaultConfig) {
  return (params: Params) => {
    if (params.allowed === true) return
    if (!params.provider) return

    let errorDetails = ''
    if (params.name) errorDetails += ` service: ${params.name}`
    if (params.method) errorDetails += ` method: ${params.method}`
    if (params.id) errorDetails += ` id: ${params.id}`

    if (params.data) {
      const data = { ...params.data }

      for (const protectedField of config.protectedFields) {
        if (_.get(data, protectedField)) {
          _.set(data, protectedField, config.protectWord)
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
