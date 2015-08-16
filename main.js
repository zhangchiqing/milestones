'use strict';

var action = require('./action')(document.body);
var model = require('./model')(action);
var view = require('./view')(model);

view(model(action));
