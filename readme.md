# methodology

Create a server that has at least one `*.dictionary.ts` file that exports a number of interfaces.  These represent documents in the database.  The server should also export at leas on `*.model.ts` file that export a number of functions that either:

- start with a `$` and take one argument of type `Connection`, or
- have a first argument of type `Context` and an optional second argument.  If the second argument has a type that is not native, it must be export from that file as well.

You can then run the cli to generate the project.

```sh
# start server
autobase run path/to/server/dir --glue path/to/write/glue/code/to.ts --watch --prefix="deno run -A --unstable"

# bundle server into single Js file
autobase bundle path/to/server/dir --glue path/to/write/glue/code/to.ts --output out/server.js

# output run command
autobase run path/to/server/dir --glue path.ts --output command.sh
cat output.sh
# deno run -A --unstable --importmap .autobase/alias.json https://denopkg.com/Vehmloewff/autobase/server/main.ts --data-dir /var/db

# compile server into a standalone binary
autobase compile path/to/server/dir --glue path/to/write/glue/code/to.ts --output out/Server
```

The CLI then generates a server for you and starts it in dev mode - watching for changes and recompiling.
The CLI also generates client clue code, a file that exports a bunch of functions that you can then import and use right away.

# Authentication

This is how authentication works.

At the start, every client makes it's own client id.  This should be a uuid.  Any time a client sends a request, it sends that `clientId` with it.  To sign a user in, the clientId is just remembered as "verified".  Client ids should be long and secure because it is possible to get the privileges of another client by using that client's id.

# Todo

- MVP CLI (done)
- Glue Code (done)
- Permissions string to pass to Deno (done)
- Connections support in server (done)
- Params in conventional methods (done)
- Binary responses (done)
- File Storage
- TypeRef support so that not all types have to be defined "onsite"
