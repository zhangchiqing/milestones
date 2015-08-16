'use strict';

var _ = require('lodash');
var h = require('virtual-dom/h');
var u = require('./util');

function attr(attrs) {
  return { attributes: attrs };
}

function renderWithContext(c) {
  return h('.container.p2', [
    h('h1', 'GitHub Milestone Generator'),
    h('hr'),

    h('h3', 'Your repo name?'),
    h('input.js-repo.field.p1.col-10', {
      placeholder: 'zhangchiqing/milestones',
      value: c.repo }),

    h('h3', 'How many days is your sprint?'),
    h('input.js-duration.field.p1', { value: c.duration }),

    h('h3', 'Your sprint starts from?'),
    h('.clearfix', [
      _.map(c.days, function(day) {
        return h('button.js-day.btn.left.border.p1.mr2' +
            u.yes(day.day === c.day, '.btn-primary'),
          attr({ 'data-day': day.day }),
          day.name);
      }),
    ]),

    h('h3', 'How many weeks you want to loop?'),
    h('input.js-weeks.field.p1', { value: c.weeks }),


    h('h3', [
      'Token',
      h('a.ml2.h5', {
target: '_blank',
href: 'https://help.github.com/articles/creating-an-access-token-for-command-line-use/'
      }, 'How to create')
    ]),
    h('input.js-token.field.p1.col-10', { value: c.token }),

    h('h3', 'Milestones to create'),
    h('div', _.map(c.querys, function(query) {
      return h('div', [
        h('div', query.repo),
        h('div', query.title),
      ]);
    })),

    u.yes(c.error, h('.red.mt2', c.error)),
    u.yes(c.success, h('.green.mt2', 'Successfully created')),
    h('button.js-submit.block.btn.btn-primary.mt2.p1.px3' +
      u.yes(c.processing, '.is-disabled'),
      'Create!'),
  ]);
}

module.exports = function(model) {
  return model.map(renderWithContext);
};
