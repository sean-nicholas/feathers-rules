export interface ErrorInfo {
  message: string
  code?: string
  field?: string
  [additionalKeys: string]: any
}
