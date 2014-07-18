// Licensed under the Apache License. See footer for details.

_         = require("underscore")
websocket = require("websocket")

utils    = require("./utils")
getOpts  = require("./getOpts")
v8socket = require("./v8-socket")
scanner  = require("./target-scanner")

agent = exports

ServerURL    = null
V8Port       = null
V8Client     = null
WSClient     = null
V8Connection = null
WSConnection = null

//------------------------------------------------------------------------------
agent.main = function main(args) {
  utils.setProgramName(__filename)
  utils.log("starting")

  var optsSpec = {
    key:       [ "k", String ],
    v8port:    [ "8", Number, 5858 ],
    verbose:   [ "v", Boolean ],
    help:      [ "h", Boolean ]
  }

  var argsOpts = getOpts.parse(args, optsSpec)
  var args     = argsOpts[0] || []
  var opts     = argsOpts[1] || {}

  ServerURL = args[0]
  V8Port    = opts.port

  if (!ServerURL) return getOpts.printHelp()

  V8Client = new v8socket.client()
  WSClient = new websocket.client()

  V8Client.on("connect", function(connection) {
    utils.log("v8 connected")
    V8Connection = connection
    initConnectionV8(connection)
  })

  WSClient.on("connect", function(connection) {
    utils.log("ws connected")
    WSConnection = connection
    initConnectionWS(connection)
  })

  utils.log("initial connection attempts to v8 and ws")
  V8Client.connect(V8Port)
  WSClient.connect(ServerURL)

  setInterval(onInterval, 1000)
}

//------------------------------------------------------------------------------
function onInterval() {
  if (V8Connection && WSConnection) return

  if (!V8Connection) {
    // utils.log("trying to connect to v8")
    V8Client.connect(V8Port)
  }

  if (!WSConnection) {
    // utils.log("trying to connect to ws")
    WSClient.connect(ServerURL)
  }
}

//------------------------------------------------------------------------------
function initConnectionV8(connection) {
  initConnection(connection)

  connection.on("message", function(message) {
    if (!WSConnection) return

    WSConnection.send(message)
  })

  connection.on("close"), function() {
    V8Connection = null
  }
}

//------------------------------------------------------------------------------
function initConnectionWS(connection) {
  initConnection(connection)

  connection.on("message", function(message) {
    if (!V8Connection) return

    V8Connection.send(message)
  })

  connection.on("close"), function() {
    WSConnection = null
  }
}

//------------------------------------------------------------------------------
function initConnection(connection) {
  connection.on("error"), function(error) {
    connection.close()
  }
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
#-------------------------------------------------------------------------------
*/
