# Autobase

A server framework that does all the redundant stuff for you.

## Installation

```sh
deno install -A --unstable --name autobase https://denopkg.com/Vehmloewff/autobase@1.2.0/cli/main.ts
```

## Usage

Although, this project is fully functional, full documentation has not yet been made. (I would love a PR for this :sweat_smile:).

For now, just check the `example` folder for an example project.

```sh
cd example
sh dev.sh
```

The CLI then generates a server for you and starts it in dev mode - watching for changes and recompiling.

The CLI also generates client clue code, a file that exports a bunch of functions that are intended to be imported by the client.

## Authentication

This is how authentication works on the generated server.

Every client that connects must make it's own client id.  Any time a client sends a request, it sends that `clientId` with it.  To sign a user in, the clientId is just remembered as "verified".  Client ids should be long and secure because it is possible to get the privileges of another client by using that client's id.

# Todo

- MVP CLI (done)
- Glue Code (done)
- Permissions string to pass to Deno (done)
- Connections support in server (done)
- Params in conventional methods (done)
- Binary responses (done)
- File Storage
- TypeRef support so that not all types have to be defined "onsite"
- Support for admin upgrade
- Start server on a custom port (done)
- command: bundle
- command: compile
- command: output
- command: update
- error catcher for connections - including
