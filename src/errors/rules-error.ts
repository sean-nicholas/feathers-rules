import { ErrorInfo } from './error-info'

export class RulesError extends Error {
  constructor(private errors: ErrorInfo[]) {
    super('Rules error')
  }

  public getErrors() {
    return this.errors
  }
}
