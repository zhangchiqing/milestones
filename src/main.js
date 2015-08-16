'use strict';

var mountNode = document.body;
var action = require('./action')(mountNode);
var model = require('./model')(action);
var view = require('./view')(model);
var render = require('./render')(mountNode);
render(view);
