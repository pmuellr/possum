/* Licensed under the Apache License. See footer for details. */

// see doc at the bottom; tl;dr -> API similarity to WebSocket.client

net    = require("net")
util   = require("util")
events = require("events")
timers = require("timers")

Q = require("q")

utils        = require("../utils")
V8Packetizer = require("./packetizer")

V8Socket = exports

V8Socket.client = V8SocketClient

//------------------------------------------------------------------------------
function V8SocketClient(clientConfig) {
  events.EventEmitter.call(this)

  clientConfig                = clientConfig || {}
  clientConfig.connectTimeout = clientConfig.connectTimeout || 1

  this._connectionTried = false
  this._connectionDone  = false
  this._config          = JSON.parse(JSON.stringify(clientConfig))

  if (typeof(this._config.connectTimeout) != "number") {
    throw new Error("clientConfig.connectTimeout needs to be a number, but was: "
      + this._config.connectTimeout)
  }
}

util.inherits(V8SocketClient, events.EventEmitter)

//------------------------------------------------------------------------------
V8SocketClient.prototype.connect = function(port) {
  this._port = port

  if (this._connectionTried) {
    throw new Error("connect() already attempted for this client")
  }

  this._connectionTried = true

  this._connect()
}

//------------------------------------------------------------------------------
V8SocketClient.prototype._connect = function() {
  var socket = net.createConnection(this._port, "localhost")

  socket.on("connect", onConnect)
  socket.on("close",   onClose)
  socket.on("error",   onError)

  this._connectTimeout = setTimeout(onTimeout, 1000 * this._config.connectTimeout)

  var self = this

  //-----------------------------------
  function onConnect() {
    var connection = new V8SocketConnection(self, socket)

    connection.on("handshake", function() {
      // self._emit_connect(connection)
    })
  }

  //-----------------------------------
  function onClose() {
    self._emit_connectFailed("socket closed")
  }

  //-----------------------------------
  function onError(error) {
    self._emit_connectFailed("" + error)
  }

  //-----------------------------------
  function onTimeout(error) {
    self._emit_connectFailed("v8 did not respond within " +
      self._config.connectTimeout + " seconds"
    )
  }
}

//------------------------------------------------------------------------------
V8SocketClient.prototype._validateFirstMessage = function(connection, v8packet) {
  var message = "the port connected to is not a v8 debug port"

  this._emit_connect(connection)

  if (v8packet.headers.Type != "connect") {
    self._emit_connectFailed(message)
    return
  }

  if (v8packet.headers["Content-Length"] !== "0") {
    self._emit_connectFailed(message)
    return
  }

  this._emit_connect(connection)
}

//------------------------------------------------------------------------------
V8SocketClient.prototype._emit_connect = function(connection) {
  if (this._connectionDone) return
  this._connectionDone = true

  this.emit("connect", connection)
}

//------------------------------------------------------------------------------
V8SocketClient.prototype._emit_connectFailed = function(errorDescription) {
  if (this._connectionDone) return
  this._connectionDone = true

  this.emit("connectFailed", errorDescription)
}

//------------------------------------------------------------------------------
function V8SocketConnection(client, socket) {
  events.EventEmitter.call(this)

  this._client = client
  this._seq    = 0

  this.socket           = socket
  this.connected        = true
  this.closeDescription = null
  this.closeReasonCode  = -1

  var self = this

  socket.on("data",    onData)
  socket.on("end",     onEnd)
  socket.on("error",   onError)
  socket.on("close",   onClose)

  self._packetizer = new V8Packetizer()
  self._packetizer.on("message", onMessage)

  var self = this

  //-----------------------------------
  function onData(buffer) {
    self._packetizer.addData(buffer)
  }

  //-----------------------------------
  function onEnd() {
    self.close()
  }

  //-----------------------------------
  function onError(error) {
    this.closeDescription = "" + error
    self.close()
  }

  //-----------------------------------
  function onClose() {
    self.close()
  }

  //-----------------------------------
  var firstMessageEmitted = false

  function onMessage(v8packet) {
    if (!firstMessageEmitted) {
      firstMessageEmitted = true
      self._client._validateFirstMessage(self, v8packet)
    }

    self.emit("message", v8packet)
  }
}

util.inherits(V8SocketConnection, events.EventEmitter)

//------------------------------------------------------------------------------
V8SocketConnection.prototype.close = function close() {
  if (!this.connected) return

  this.connected = false
  this.closeDescription = this.closeDescription || "socket closed"
  this.socket.close()
  this.socket = null

  this.emit("close", this.closeReasonCode, this.closeDescription)
}

//------------------------------------------------------------------------------
V8SocketConnection.prototype.drop = V8SocketConnection.prototype.close

//------------------------------------------------------------------------------
V8SocketConnection.prototype.send = function send(v8packet) {
  if (!this.connected) return

  v8packet = v8packet || {}

  var v8headers = v8packet.headers || {}
  var v8body    = v8packet.body    || {}

  v8body.seq  = this._seq++
  v8body.type = "request"

  v8body = JSON.stringify(v8body)

  var headers = []

  v8headers["Content-Length"] = v8body.length

  for (var key in v8headers) {
    var val = v8headers[key]
    headers.push(key + ": " + val)
  }

  var payload = headers.join("\r\n") + "\r\n\r\n" + v8body

  utils.log("V8SocketConnection::send: " + payload)

  this.socket.write(payload)
}

/*------------------------------------------------------------------------------
v8socket - provide a websocket-like API for communication with the v8 debug port

This module is intended to a `client` export which matches the API of the
node.js websocket package's [1] WebSocketClient API [2].

One primary difference are the methods sent via `send*()` methods, and received
via `message` events.  The objects in both cases are the same - a JSON-able
object which has two properties: `headers` and `body`; `headers` is an object
with a key for each header in the v8 packet, and `body` is the v8 payload.

These objects are referred to below as `v8packets`

Differences, assuming you've done the following (equivalent to the "websocket"
package):

    var V8Client = require("v8socket").client

So,
    V8Client           == WebSocketClient
    V8SocketConnection == WebSocketConnection

* V8Client:

  * V8Client's constructor takes a clientConfig object with the following
    properties:

    * `connectTimeout` - number of seconds to wait for v8 to respond after
      connecting; default: 1

  * V8Client::connect() takes only a port number (v8 debug port)

  * V8Client::connect() can only be called once per V8Client; if you need to
    connect again, create a new V8Client.  The WebSocket docs don't indicate
    if this is required or desired, but the way the eventing works, it's not
    easy to handle multiple connect() calls from one client.

* V8SocketConnection:

  * only the following properties are supported:
    * closeDescription
    * closeReasonCode
    * connected
    * socket
    * protocol - always "v8debug"

  * only the following methods are supported:
    * close()
    * drop() - same as close()
    * send(data) - data must be a v8packet

  * only the following events are supported:
    * message - the `message` parameter will be a v8packet
    * close
    * error

[1] https://www.npmjs.org/package/websocket
[2] https://github.com/Worlize/WebSocket-Node/wiki/Documentation#websocketclient
------------------------------------------------------------------------------*/

/*
#-------------------------------------------------------------------------------
# Copyright IBM Corp. 2014
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#    http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
//------------------------------------------------------------------------------
*/
