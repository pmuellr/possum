// Licensed under the Apache License. See footer for details.

_         = require("underscore")
websocket = require("websocket")

utils    = require("./utils")
getOpts  = require("./getOpts")
v8socket = require("./v8/socket")

agent = exports

ServerURL    = null
WSConnection = null

V8Port       = null
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
  connectWS()

  //-----------------------------------

  //-----------------------------------
  setInterval(onInterval, 1000)
}

//------------------------------------------------------------------------------
function connectV8() {
  var client = new v8socket.client()

  client.on("connect", function(connection){
    utils.log("connected to v8")
    V8Connection = connection
    initConnectionV8(connection)

    sendScriptsCommand(connection)
  })
}

//------------------------------------------------------------------------------
function connectWS() {
  var client = new websocket.client()

  client.on("connect", function(connection) {
    utils.log("connected to server")
    WSConnection = connection
    initConnectionWS(connection)
  })
}

//------------------------------------------------------------------------------
function onInterval() {
  if (!WSConnection) {
    utils.log("connecting to server")
    connectWS()
    return
  }

  if (!V8Connection) {
    utils.log("connecting to v8")
    connectV8()
    return
  }
}

//------------------------------------------------------------------------------
function sendScriptsCommand(connection) {

  v8cmd = {
    command:         "scripts",
    arguments: {
      includeSource: false,
      types:         4
    }
  }

  connection.send({body: v8cmd})

  connection.on("message", function(message) {
    message = message.body

    if (message.command != "scripts") return

    utils.log("scripts:")

    var body = message.body
    for (var i=0; i<body.length; i++) {
      var script = body[i]
      if (script.type != "script") continue
      utils.log("  script: " + script.name)
    }

  })
}

//------------------------------------------------------------------------------
function initConnectionV8(connection, v8port) {
  initConnection(connection)

  connection.on("message", function(message) {
    if (!WSConnection) return

    WSConnection.send(message)
  })

  connection.on("close", function() {
    V8Connection = null
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

    if (!V8Connection) return

    V8Connection.close()
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
