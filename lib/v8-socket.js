/* Licensed under the Apache License. See footer for details. */

net    = require("net")
util   = require("util")
events = require("events")

Q = require("q")

utils        = require("./utils")
scanner      = require("./target-scanner")
V8Packetizer = require("./v8-packetizer")

V8Socket = exports

//------------------------------------------------------------------------------
V8Socket.createConnection = function(port, socket) {
  return new V8SocketConnection(port, socket)
}

//------------------------------------------------------------------------------
// V8Socket - modelled after WebSocketConnection
//------------------------------------------------------------------------------
// events:
//    "message",       {type: "utf8", utf8Data: "..."}
//    "close",         reasonCode, description
//    "error",         error
//------------------------------------------------------------------------------

function V8SocketConnection(port, socket) {
  var self = this

  self._seq = 0

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

  data.seq  = this._seq++
  data.type = "request"

  var buffer = utils.JS(data)

  utils.log("V8SocketConnection::send: " + utils.JL(data))

  this.socket.write("Content-Length: " + buffer.length + "\r\n\r\n")
  this.socket.write(buffer)
}

//------------------------------------------------------------------------------
V8SocketConnection.prototype._onData = function _onData(buffer) {
  // utils.log("V8SocketConnection::_onData: " + buffer)
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
  utils.log("V8SocketConnection::_onClose()")
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
