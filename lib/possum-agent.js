// Licensed under the Apache License. See footer for details.

_ = require("underscore")

utils   = require("./utils")
getOpts = require("./getOpts")
scanner = require("./target-scanner")

agent = exports

//------------------------------------------------------------------------------
agent.main = function main(args) {
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

  utils.log("not yet functional much")

  scanner.scan(5858, onConnect)
}

//------------------------------------------------------------------------------
function onConnect(port, socket) {
  utils.log("connected to port " + port)
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
