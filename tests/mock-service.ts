export class MockService {
  private internal = 'test'
  public async find(...args: any[]) { return `${this.internal}-find` }
  public async get(...args: any[]) { return `${this.internal}-get` }
  public async create(...args: any[]) { return `${this.internal}-create` }
  public async update(...args: any[]) { return `${this.internal}-update` }
  public async patch(...args: any[]) { return `${this.internal}-patch` }
  public async remove(...args: any[]) { return `${this.internal}-remove` }
  public setup(app: any, path: string) { }
}
