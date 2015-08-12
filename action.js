'use strict';

var Rx = require('rx');
Rx.DOM = require('rx-dom').DOM;

function evtS(selector, evt, pluck) {
  var elm = document.querySelector(selector);
  var eS = Rx.DOM.fromEvent(elm, evt);

  return pluck ? eS.pluck('target', pluck) : eS;
}

function fromEventOfRootElm(root, evt, selector) {
  var hasClass = _.partialRight(_.contains, selector);

  return Rx.DOM.fromEvent(root, evt)
  .filter(function(e) {
    return hasClass(e.target.className.split(' '));
  })
  .pluck('target', 'value');
}

function mapFilterNumber(stream) {
  return stream
    .map(_.ary(parseInt, 1))
    .filter(_.negate(_.isNaN));
}

module.exports = function(root) {
  var fromInputOfBody = _.partial(fromEventOfRootElm, root, 'input');

  return {
    editRepo: fromInputOfBody('js-repo'),
    editDuration: fromInputOfBody('js-duration'),

    selectDay: fromEventOfRootElm(root, 'click')
      .filter(function(e) {
        return _.contains(e.target.className.split(' '), 'js-day');
      })
      .map(function(e) {
        return parseInt($(e.target).attr('data-day'), 10);
      }),

    editWeeks: mapFilterNumber(fromInputOfBody('js-weeks')),
    clickSubmit: fromEventOfRootElm(root, 'click', 'js-submit')
      .map(function() {
        return $(root).find('.js-token').val();
      }),
  };
};
