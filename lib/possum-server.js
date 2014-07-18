// Licensed under the Apache License. See footer for details.

fs      = require("fs")
path    = require("path")
http    = require("http")

ports     = require("ports")
express   = require("express")
websocket = require("websocket")

utils   = require("./utils")
getOpts = require("./getOpts")

server = exports

//------------------------------------------------------------------------------
server.main = function main(args) {
  utils.setProgramName(__filename)

  var optsSpec = {
    verbose: [ "v", Boolean ],
    help:    [ "h", Boolean ]
  }

  var argsOpts = getOpts.parse(args, optsSpec)
  var args     = argsOpts[0]
  var opts     = argsOpts[1]

  utils.log("args: " + utils.JS(args))
  utils.log("opts: " + utils.JS(opts))

  startServer()
}

//------------------------------------------------------------------------------
function startServer() {
  var port = ports.getPort(utils.PROGRAM)

  var app    = express()
  var server = http.createServer(app)

  var wwwPath = path.join(__dirname, "..", "www")

  app.use(express.static(wwwPath))

  // start server
  server.listen(port, "localhost", function() {
      utils.log("server starting on http://localhost:" + port + "/")
  })

  var wsServer = new websocket.server({
    httpServer:            server,
    autoAcceptConnections: true
  })

  wsServer.on("request", function(request) {
  })
}

//------------------------------------------------------------------------------
function onWSrequest(request) {
  var connection

  if (request.path == "/ws/client") {
    utils.log("client connected")
    connection = accept(null, request.origin)

    connection.on("message", function() { onClientMessage(connection, message) })
    connection.on("close",   function() { onClientClose(connection)            })
  }

  else if (request.path == "/ws/target") {
    utils.log("target connected")
    connection = accept(null, request.origin)

    connection.on("message", function() { onTargetMessage(connection, message) })
    connection.on("close",   function() { onTargetClose(connection)            })
  }

  else {
    request.reject(404, "WebSocket not found")
  }
}

//------------------------------------------------------------------------------
function onClientMessage(connection, message) {
  utils.log("message from client: `" + message + "`")
}

//------------------------------------------------------------------------------
function onClientClose(connection) {
  utils.log("client closed")
}

//------------------------------------------------------------------------------
function onTargetMessage(connection, message) {
  utils.log("message from target: `" + message + "`")
}

//------------------------------------------------------------------------------
function onTargetClose() {
  utils.log("target closed")
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
