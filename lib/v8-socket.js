/* Licensed under the Apache License. See footer for details. */

net    = require("net")
util   = require("util")
events = require("events")

Q = require("q")

utils        = require("./utils")
scanner      = require("./target-scanner")
V8Packetizer = require("./v8-packetizer")

V8Socket        = exports
V8Socket.client = V8SocketClient

//------------------------------------------------------------------------------
// V8SocketClient - modelled after WebSocketClient
//------------------------------------------------------------------------------
// events:
//    "connect",       v8SocketConnection
//    "connectFailed", errorDescription
//------------------------------------------------------------------------------
function V8SocketClient() {
  events.EventEmitter.call(this)
}

util.inherits(V8SocketClient, events.EventEmitter)

//------------------------------------------------------------------------------
V8SocketClient.prototype.connect = function connect(port) {
  var self   = this
  var socket = net.createConnection(port, "localhost")

  self._deferred  = Q.defer()
  self._connected = false

  socket.on("connect", function onConnect() {
    self._deferred.resolve(socket)
  })

  socket.on("error", function onError(error) {
    // so we don't "handle" errors after connection
    if (self._deferred.promise.isFulfilled()) return

    self._deferred.reject(error.code)
  })

  //-----------------------------------
  self._deferred.promise

  //-----------------------------------
  .then(function(socket) {
    var connection = new V8SocketConnection(socket)
    self.emit("connect", connection)
  })

  //-----------------------------------
  .fail(function(err) {
    self.emit("connectFailed", err)
  })

  //-----------------------------------
  .done()
}

//------------------------------------------------------------------------------
// V8Socket - modelled after WebSocketConnection
//------------------------------------------------------------------------------
// events:
//    "message",       {type: "utf8", utf8Data: "..."}
//    "close",         reasonCode, description
//    "error",         error
//------------------------------------------------------------------------------

function V8SocketConnection(socket) {
  var self = this

  events.EventEmitter.call(self)

  self.socket           = socket
  self.connected        = true
  self.closeDescription = null
  self.closeReasonCode  = -1

  socket.on("data",    function(buffer) { self._onData(buffer) })
  socket.on("end",     function()       { self._onEnd()        })
  socket.on("error",   function(error)  { self._onError(error) })
  socket.on("close",   function()       { self._onClose()      })

  self._packetizer = new V8Packetizer()
  self._packetizer.on("message", function(message){
    self.emit("message", {type: "utf8", utf8Data: message})
  })

}

util.inherits(V8SocketConnection, events.EventEmitter)

//------------------------------------------------------------------------------
V8SocketConnection.prototype.close = function close() {
  if (!this.connected) return

  this.socket.close()
}

//------------------------------------------------------------------------------
V8SocketConnection.prototype.send = function send(data) {
  if (!this.connected) return

  this.socket.write(data)
}

//------------------------------------------------------------------------------
V8SocketConnection.prototype._onData = function _onData(buffer) {
  this._packetizer.addData(buffer)
}

//------------------------------------------------------------------------------
V8SocketConnection.prototype._onEnd = function _onEnd() {
  this.close()
}

//------------------------------------------------------------------------------
V8SocketConnection.prototype._onError = function _onError(error) {
  this.emit("error", error)
  this.close()
}

//------------------------------------------------------------------------------
V8SocketConnection.prototype._onClose = function _onClose() {
  this.connected        = false
  this.closeDescription = "?"
  this.closeReasonCode  = 0

  this.emit("close", this.closeReasonCode, this.closeDescription)
}

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