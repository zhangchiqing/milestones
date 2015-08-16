'use strict';

var diff = require('virtual-dom/diff');
var patch = require('virtual-dom/patch');
var createElement = require('virtual-dom/create-element');

module.exports = function(mountNode) {
  var tree;
  var $main;

  function init(domtree) {
    tree = domtree;
    $main = createElement(tree);
    mountNode.appendChild($main);
  }

  function render(domtree) {
    var newTree = domtree;
    var patches = diff(tree, newTree);
    $main = patch($main, patches);
    tree = newTree;
  }

  return function(view) {
    view.take(1).subscribe(init);
    view.skip(1).subscribe(render);
  };
};
