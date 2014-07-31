possum protocol
================================================================================

Description of the message packets flowing over the WebSockets used by possum.



general packet structure
================================================================================

Every message packet is a JavaScript object serialied in JSON.  Every object
has a property `type` whose value is a String which further describes the
object.


from possum-agent to possum-server
================================================================================

type: connect
--------------------------------------------------------------------------------

properties:

* `key` - String - an API key - this value identifies the user and/or
  target application.  The key may be empty or ignored for a single-user
  system.

* `id` - String - an id previously returned from a `connect` command, to be
  used if you need to re-connect a runtime with the server
