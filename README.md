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

### Data model

1. route
```
{
	favouriteId: string,	optional (must be in uuid format, the service generates this value if it is not defined)
	type: "route", required
	gtfsId: string, required (in a feed scoped format <feedId>:<gtfsId>)
	lastUpdated: number, required (unix time when favourite was last updated)
}
```
example:
```
{
	favouriteId: "3b668af9-87ec-47f4-8a84-44565a0469da",
	type: "route",
	gtfsId: "HSL:2552",
	lastUpdated: 1602145125
}
```

2. place
```
{
	favouriteId: string,	optional (must be in uuid format, the service generates this value if it is not defined)
	type: "place", required
	gid: string, optional (from geocoder)
	name: string, optional (name given by user)
	address: string, required (label from geocoding result)
	lat: number, required
	lon: number, required
	selectedIconId: string, optional (icon-icon_place, icon-icon_home, icon-icon_work, icon-icon_school, icon-icon_sport or icon-icon_shopping)
	lastUpdated: number, required (unix time when favourite was last updated)
	layer: string, optional (from geocoding, describes the type of the place, for example venue, address)
}
```
example:
```
{
	favouriteId: "e1d9d2ee-8431-4575-a5a0-b0c53d0974c2",
	type: "place",
	gid: "openstreetmap:address:node:472906011",
	name: "Mäkelänkatu",
	address: "Mäkelänkatu 34, Helsinki",
	lat: 60.194814,
	lon: 24.95569,
	selectedIconId: "icon-icon_work",
	lastUpdated: 1602147439,
	layer: "address"
}
```
3. station
```
{
	favouriteId: string,	optional (must be in uuid format, the service generates this value if it is not defined)
	type: "station", required
	gtfsId: string, required (in a feed scoped format <feedId>:<gtfsId>)
	address: string, optional (label from geocoding result)
	lat: number, optional
	lon: number, optional
	lastUpdated: number, required (unix time when favourite was last updated)
}
```
example:
```
{
	favouriteId: "2e968157-df03-4f22-89a4-d87c3d82799b",
	type: "station"
	gtfsId: "HSL:1000004",
	address: "Pasila, Helsinki",
	lat: 60.198118,
	lon: 24.934074,
	lastUpdated: 1602158421
}
```

4. stop
```
{
	favouriteId: string,	optional (must be in uuid format, the service generates this value if it is not defined)
	type: "stop", required
	gtfsId: string, required (in a feed scoped format <feedId>:<gtfsId>)
	address: string, optional (label from geocoding result)
  code: string, optional (stop code)
	lat: number, optional
	lon: number, optional
	lastUpdated: number, required (unix time when favourite was last updated)
}
```
example:
```
{
	favouriteId: "b9e6808b-8adf-4216-b327-b4262301949a",
	type: "stop"
	gtfsId: "HSL:1180444",
	address: "Kuusitie H0132, Helsinki",
  code: "H0132",
	lat: 60.194881,
	lon: 24.90245,
	lastUpdated: 1602159968
}
```
5. bike station
```
{
	favouriteId: string,	optional (must be in uuid format, the service generates this value if it is not defined)
	type: "bikeStation", required
	stationId: string, required
  name: string, optional
  networks: array<string>, required
	lastUpdated, (unix time when favourite was last updated),
}
```
example:
```
{
	favouriteId: "171425a1-2aa5-4952-bcfc-5c72e313d086",
	type: "bikeStation",
  stationId: "022",
	name: "Rautatientori / länsi",
	networks: ["smoove"],
	lastUpdated: 1602161141
}
```
