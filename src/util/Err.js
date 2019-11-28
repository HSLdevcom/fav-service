// @flow 
 
export default class Err extends Error { 
  status: number 
  message: string

  constructor(status: number, message?: string, ...args: Array<*>) {
    super([message, ...args])

    this.status = status
  }
}
