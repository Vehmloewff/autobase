# Example

The code in `db.cluster.ts`, `methods/notebook.controller.ts`, and `methods/user.controller.ts` is read by the CLI and used to generate a server and `glue.generated.ts`.

`glue.generated.ts` is intended to be imported by the client using the server.  It contains interfaces representing the database Models defined on the server and it exports function that call the correspond to the methods defined in the `*.controller.ts` files.
