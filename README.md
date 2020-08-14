# Favorites microservice

## Local environment

### Dependencies

- Azure function cli tools (and it's dependencies) https://github.com/Azure/azure-functions-core-tools

### Install dependencies

Install project dependencies using yarn / npm

```bash
yarn
```

### Configuration

Create file `local.settings.json` in project root.

This file should contain the following for local development. Please make sure to include backend client id and credentials:

```
{
  "IsEncrypted": false,
  "Values": {
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "clientId": "<client id>",
    "clientCredentials": "Basic <base64encoded string here>",
    "hslIdUrl": "https://hslid-dev.t5.fi",
    "FAVORITES_HOST": "localhost:7071",
    "redisHost": "localhost",
    "redisPort": "6379",
    "redisPass": ""
  }
}
```

FAVORITES_HOST is used in proxies.json to emulate rest api structure. For example in azure dev following address is used: `fav-service-dev.azurewebsites.net`

### Start dev server

```bash
yarn start
```

### How to use

The service uses data model defined in https://gist.github.com/joonasrissanen/ed99e15a49ad9ae1dd8e5ca94bbe5612.

Requests are done to endpoint `https://dev-api.digitransit.fi/favourites/{user's_hsl_id}` in development environment.
Production environment endpoint is at `https://api.digitransit.fi/favourites/{user's_hsl_id}`.
In dev environment it requires user to sign in to https://hslid-dev.t5.fi/.


GET
```
Authorization: Bearer <JWT_Access_token>
Method: GET
```

PUT
```
Authorization: Bearer <JWT_Access_token>
Method: PUT
Body: [<favourite_objects>]
```

DELETE
```
Authorization: Bearer <JWT_Access_token>
Method: DELETE
Body: [<favouriteIds>]
```
