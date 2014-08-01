// Licensed under the Apache License. See footer for details.

net = require("net")

utils = require("../utils")

scanner = exports

//------------------------------------------------------------------------------
scanner.scan = function scan(port, onConnectCB) {
  if (!onConnectCB) throw new Error("no connect callback")

  var scanState = {}
  scanState.connected = false

  setInterval(onInterval, 1000)

  //-----------------------------------
  function onInterval() {
    if (scanState.connected) return

    scanOnce(scanState, port, onConnectCB)
  }
}

//------------------------------------------------------------------------------
function scanOnce(scanState, port, onConnectCB) {

  var socket = net.createConnection(port, "localhost")

  utils.log("scanOnce on port " + port + "...")

  socket.on("connect", onConnect)
  socket.on("close",   onClose)
  socket.on("error",   onError)

  //-----------------------------------
  function onConnect() {
    scanState.connected = true
    onConnectCB(port, socket)
  }

  //-----------------------------------
  function onClose() {
    scanState.connected = false
  }

  //-----------------------------------
  function onError(error) {
    scanState.connected = false

    if (error.code == "EADDRINUSE")   return
    if (error.code == "ECONNREFUSED") return

    utils.log("error scanning port " + port + ": " + error.code)
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
