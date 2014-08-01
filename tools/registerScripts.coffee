# Licensed under the Apache License. See footer for details.

path = require "path"

#-------------------------------------------------------------------------------
# given a directory, will add all the node_module scripts as global functions
# which act like shutil.exec().
#-------------------------------------------------------------------------------
global.registerScripts = (dir) ->
  scriptsPath = path.join dir, "node_modules", ".bin"
  scripts     = ls scriptsPath

  for script in scripts
    # log "registering script function `#{script}`"

    scriptPath = path.join scriptsPath, script

    global[script] = getScriptInvoker scriptPath

  return

#-------------------------------------------------------------------------------
getScriptInvoker = (scriptPath) ->
  (commandArgs, execArgs...) ->
    command = "#{scriptPath} #{commandArgs}"

    execArgs.unshift command

    exec.apply null, execArgs

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
