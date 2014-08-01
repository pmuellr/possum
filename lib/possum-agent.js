// Licensed under the Apache License. See footer for details.

_         = require("underscore")
websocket = require("websocket")

utils    = require("./utils")
getOpts  = require("./getOpts")
v8socket = require("./v8/socket")
scanner  = require("./v8/target-scanner")

agent = exports

ServerURL    = null
WSClient     = null
WSConnection = null

V8Port       = null
V8Client     = null
V8Connection = null

//------------------------------------------------------------------------------
agent.main = function main(args) {
  utils.setProgramName(__filename)
  utils.log("starting")

  var optsSpec = {
    key:       [ "k", String  ],
    v8port:    [ "8", Number  , "5858" ],
    verbose:   [ "v", Boolean ],
    help:      [ "h", Boolean ]
  }

  var argsOpts = getOpts.parse(args, optsSpec)
  var args     = argsOpts[0] || []
  var opts     = argsOpts[1] || {}

  ServerURL = args[0]
  V8Port    = opts.v8port

  if (!ServerURL) return getOpts.printHelp()

  //-----------------------------------
  WSClient = new websocket.client()

  WSClient.on("connect", function(connection) {
    utils.log("connected to server")
    WSConnection = connection
    initConnectionWS(connection)
  })

  //-----------------------------------
  V8Client = new v8socket.client()

  V8Client.on("connect", function(connection){
    utils.log("connected to v8")
    V8Connection = connection
    initConnectionV8(connection)
  })

  //-----------------------------------
  setInterval(onInterval, 1000)
}

//------------------------------------------------------------------------------
function onInterval() {
  if (!WSConnection) {
    utils.log("(re)connecting to server")
    WSClient.connect(ServerURL)
  }

  if (!V8Connection) {
    utils.log("(re)connecting to v8")
    V8Client.connect(V8Port)
  }
}

//------------------------------------------------------------------------------
function initConnectionV8(port, socket) {
  utils.log("connecting to v8 at port " + port)

  var connection = v8socket.createConnection(port, socket)

  initConnection(connection)

  connection.on("message", function(message) {
    if (message.type != "utf8") {
      utils.log("v8 message ignored because not utf8: " + message)
      return
    }

    message = message.utf8Data
    message = JSON.parse(message)
    message = message.body
    // utils.log("v8 message received from port " + port + ": " + message)
    if (message == "") return

    message = JSON.parse(message)

    if (message.command == "scripts") {
      var body = message.body
      for (var i=0; i<body.length; i++) {
        var script = body[i]
        if (script.type != "script") continue
        utils.log("script: " + script.name)
      }
    }

    message = JSON.stringify(message, null, 4)
    // utils.log("v8 message received from port " + port + ": " + message)

    if (!WSConnection) return

    WSConnection.send(message)

  })

  connection.on("close", function() {
    utils.log("disconnected from v8 at port " + port)
  })

  connection.send({
    command:         "scripts",
    arguments: {
      includeSource: false,
      types:         4
    }
  })
}

//------------------------------------------------------------------------------
function initConnectionV8(connection, v8port) {
  initConnection(connection)

  connection.on("message", function(message) {
    v8
    if (!V8Connection) return

    V8Connection.send(message)
  })

  connection.on("close", function() {
    WSConnection = null
  })
}

//------------------------------------------------------------------------------
function initConnectionWS(connection) {
  initConnection(connection)

  connection.on("message", function(message) {
    if (!V8Connection) return

    V8Connection.send(message)
  })

  connection.on("close", function() {
    WSConnection = null
  })
}

//------------------------------------------------------------------------------
function initConnection(connection) {
  connection.on("error", function(error) {
    connection.close()
  })
}

//------------------------------------------------------------------------------
function getPorts(optValue) {
  var pattern = /^\s*(\d+)\s*(-\s*(\d+)\s*)?$/

  optValue = "" + optValue

  var match = optValue.match(pattern)
  if (!match) return null

  var start = match[1]
  var end   = match[3] || start

  start = parseInt(start, 10)
  end   = parseInt(end,   10)

  if (isNaN(start)) return null
  if (isNaN(end))   return null
  if (start > end)  return null

  var result = []
  for (var i=start; i<=end; i++) {
    result.push(i)
  }

  return result
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
