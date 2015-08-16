/* jshint -W079 */
'use strict';

var _ = require('lodash');
var Rx = require('rx');
var $ = require('jquery');

function fromEventOfRootElm(mountNode, evt, selector) {
  var hasClass = _.partialRight(_.contains, selector);

  return Rx.Observable.fromEvent(mountNode, evt)
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

module.exports = function(mountNode) {
  var fromInputOfBody = _.partial(fromEventOfRootElm, mountNode, 'input');

  return {
    editRepo: fromInputOfBody('js-repo'),
    editDuration: fromInputOfBody('js-duration'),

    selectDay: Rx.Observable.fromEvent(mountNode, 'click')
      .filter(function(e) {
        return _.contains(e.target.className.split(' '), 'js-day');
      })
      .map(function(e) {
        return parseInt($(e.target).attr('data-day'), 10);
      }),

    editWeeks: mapFilterNumber(fromInputOfBody('js-weeks')),
    submit: fromEventOfRootElm(mountNode, 'click', 'js-submit')
      .map(function() {
        return $(mountNode).find('.js-token').val();
      }),
  };
};
