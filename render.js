'use strict';

var diff = require('virtual-dom/diff');
var patch = require('virtual-dom/patch');
var createElement = require('virtual-dom/create-element');
var tree;
var $main;

function init(domtree) {
  tree = domtree;
  $main = createElement(tree);
  document.body.appendChild($main);
}

function render(domtree) {
  var newTree = domtree;
  var patches = diff(tree, newTree);
  $main = patch($main, patches);
  tree = newTree;
}

module.exports = function(view) {
  view.DOM.take(1).subscribe(init);
  view.DOM.skip(1).subscribe(render);
};

