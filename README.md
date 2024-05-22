# Welcome to Colyseus!

This project has been created using [⚔️ `create-colyseus-app`](https://github.com/colyseus/create-colyseus-app/) - an npm init template for kick starting a Colyseus project in TypeScript.

[Documentation](http://docs.colyseus.io/)

This repo provides a basic example of storing walking and talking Bumpkins on your island.

## Usage

```
yarn start
```

## Structure

- `index.ts`: main entry point, register an empty room handler and attach [`@colyseus/monitor`](https://github.com/colyseus/colyseus-monitor)
- `src/rooms/TestRoom.ts`: a room handler for you to implement your logic with a basic configuration
- `src/rooms/RoomState.ts`: a schema used on your room's state.
- `loadtest/example.ts`: scriptable client for the loadtest tool (see `npm run loadtest`)
- `package.json`:
  - `scripts`:
    - `npm start`: runs `ts-node-dev index.ts`
    - `npm test`: runs mocha test suite
    - `npm run loadtest`: runs the [`@colyseus/loadtest`](https://github.com/colyseus/colyseus-loadtest/) tool for testing the connection, using the `loadtest/example.ts` script.
- `tsconfig.json`: TypeScript configuration file

## Deployment

Deploying this server is out of scope, further guides coming soon.

## License

MIT
