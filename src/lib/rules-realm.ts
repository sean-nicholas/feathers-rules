// Typing hack because TS does currently not support indexing with symbols:
// https://github.com/microsoft/TypeScript/issues/1863
export const rulesRealm: string = Symbol('Rules Realm') as unknown as string
