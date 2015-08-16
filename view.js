'use strict';

var Rx = require('Rx');
var _ = require('lodash');
var h = require('virtual-dom/h');
var u = require('./util');

function attr(attrs) {
  return { attributes: attrs };
}

function renderWithContext(c) {
  console.log('render', c);
  return h('.container.p3', [
    h('h1', 'GitHub Milestone Generator'),
    h('hr'),

    h('h3', 'Your repo name?'),
    h('input.js-repo.field.p2.col-10', {
      placeholder: 'zhangchiqing/milestones',
      value: c.repo }),

    h('h3', 'How many days is your sprint?'),
    h('input.js-duration.field.p2', { value: c.duration }),

    h('h3', 'Your sprint starts from?'),
    h('.clearfix', [
      _.map(c.days, function(day) {
        return h('button.js-day.btn.left.border.p2.mr2' +
            u.yes(day.day === c.day, '.btn-primary'),
          attr({ 'data-day': day.day }),
          day.name);
      }),
    ]),

    h('h3', 'How many weeks you want to loop?'),
    h('input.js-weeks.field.p2', { value: c.weeks }),


    h('h3', [
      'Token',
      h('a.ml2.h5', {
target: '_blank',
href: 'https://help.github.com/articles/creating-an-access-token-for-command-line-use/'
      }, 'How to create')
    ]),
    h('input.js-token.field.p2.col-10', { value: c.token }),

    h('button.js-submit.block.btn.btn-primary.mt2.p2.px3' +
      u.yes(c.processing, '.is-disabled'),
      'Create!'),
  ]);
}

module.exports = function(model) {
  return {
    DOM: model.map(renderWithContext),
  };
};
