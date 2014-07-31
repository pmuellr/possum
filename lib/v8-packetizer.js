/* Licensed under the Apache License. See footer for details. */

util   = require("util")
events = require("events")

//------------------------------------------------------------------------------
// events:
//    "message", string - JSON({headers:[], body: string})
//    "error",   error
//------------------------------------------------------------------------------
function V8Packetizer() {
  events.EventEmitter.call(this)

  this._buffer = ""
  this._initMessage()
}

module.exports = V8Packetizer

util.inherits(V8Packetizer, events.EventEmitter)

//------------------------------------------------------------------------------
V8Packetizer.prototype._initMessage = function _initMessage() {
  this._inHeaders     = true
  this._headers       = {}
  this._contentLength = 0
}

//------------------------------------------------------------------------------
V8Packetizer.prototype._emitMessage = function _emitMessage(body) {
  var message = {headers: this._headers, body: body }
  this.emit("message", utils.JS(message))
  this._initMessage()
}

//------------------------------------------------------------------------------
V8Packetizer.prototype.addData = function addData(data) {
  var line
  var body
  var delim
  var key
  var val

  this._buffer += data

  while (true) {

    // reading the body
    if (!this._inHeaders) {

      // if we don't have enough content, return
      if (this._buffer.length < this._contentLength) return

      // got enough content, emit message, start over
      body         = this._buffer.substr(0, this._contentLength)
      this._buffer = this._buffer.substr(this._contentLength)

      this._emitMessage(body)
      continue
    }

    // reading headers
    delim = this._buffer.indexOf("\r\n")

    // dangling header, return
    if (-1 == delim) return

    // split line
    line         = this._buffer.substr(line, delim)
    this._buffer = this._buffer.substr(delim + 2)

    // empty line, now reading body so start over
    if (line == "") {
      this._inHeaders = false
      continue
    }

    // header line, split it
    delim = line.indexOf(":")
    if (-1 == delim) {
      key = line
      val = ""
    }
    else {
      key = line.substr(0, delim).trim()
      val = line.substr(delim + 1).trim()
    }

    // set the header, and check for Content-Length
    this._headers[key] = val

    if (key == "Content-Length") {
      this._contentLength = parseInt(val)
    }
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
//------------------------------------------------------------------------------
*/
