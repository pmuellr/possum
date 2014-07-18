// Licensed under the Apache License. See footer for details.

fs      = require("fs")
path    = require("path")

ports   = require("ports")
express = require("express")

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
  var app  = express()

  var wwwPath = path.join(__dirname, "..", "www")

  app.get("/api/client",  apiClient)
  app.get("/api/target",  apiTarget)

  app.use(express.static(wwwPath))

  // start server
  app.listen(port, "localhost", function() {
      utils.log("server starting on http://localhost:" + port + "/")
  })
}

//------------------------------------------------------------------------------
function apiClient(request, response) {
  response.send(500)
}

//------------------------------------------------------------------------------
function apiTarget(request, response) {
  response.send(500)
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
