// @flow

export type Request = {
  body: Object,
  query: Object,
  headers: Object,
  params: Object,
}

export type AzureContext = {
  log: Function,
  done: Function,
  res: Object,
}
