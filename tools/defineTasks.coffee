# Licensed under the Apache License. See footer for details.

logger = require "./logger"

#-------------------------------------------------------------------------------
# Takes a `taskDefs` object, returns a new object which should have run
# functions for the tasks added to, by name.
#
# A `taskDef` object has a key:value for every task, where the key is the
# name of the task, and the value is the short description.
#
# Example:
#
#     tasks = defineTasks
#       foo: "this task does foo"
#       bar: "this task does bar"
#
#     tasks.foo = -> console.log "just foo'd"
#     tasks.bar = -> console.log "just bar'd"
#
#-------------------------------------------------------------------------------
global.defineTasks = (taskDefs) ->
  tasks = {}

  for taskName, taskDesc of taskDefs
    task taskName, taskDesc, getTaskRunner(tasks, taskName)

  return tasks

#-------------------------------------------------------------------------------
getTaskRunner = (tasks, taskName) ->
  (options) ->
    taskFn = tasks[taskName]

    unless taskFn?
      logger.logError "task `#{taskName}` does not have a function defined"

    taskFn(options)

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
