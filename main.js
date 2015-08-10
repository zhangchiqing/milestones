/* jshint -W079 */
'use strict';

var Rx = require('rx');
Rx.DOM = require('rx-dom').DOM;

var moment = require('moment');
var h = require('virtual-dom/h');
var diff = require('virtual-dom/diff');
var patch = require('virtual-dom/patch');
var createElement = require('virtual-dom/create-element');
var _ = require('lodash');
var $ = require('jquery');

console.print = console.log.bind(console);

function yes(ifTrue, returnMe) { return ifTrue ? returnMe : ''; }
function no(ifFalse, returnMe) { return ifFalse ? '' : returnMe; }
function attr(attrs) {
  return { attributes: attrs };
}

function renderWithContext(c) {
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
            yes(day.day === c.day, '.btn-primary'),
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
      yes(c.processing, '.is-disabled'),
      'Create!'),
  ]);
}

var tree;
var $main;

function initUI(data) {
  tree = renderWithContext(data);
  $main = createElement(tree);
  document.body.appendChild($main);
}

function render(data) {
  var newTree = renderWithContext(data);
  var patches = diff(tree, newTree);
  $main = patch($main, patches);
  tree = newTree;
}

function evtS(selector, evt, pluck) {
  var elm = document.querySelector(selector);
  var eS = Rx.DOM.fromEvent(elm, evt);

  return pluck ? eS.pluck('target', pluck) : eS;
}

var inputS = _.partialRight(evtS, 'input', 'value');

function fromEventOfRootElm(root, evt, selector) {
  var hasClass = _.partialRight(_.contains, selector);

  return Rx.DOM.fromEvent(root, evt)
  .filter(function(e) {
    return hasClass(e.target.className.split(' '));
  })
  .pluck('target', 'value');
}

var fromInputOfBody = _.partial(fromEventOfRootElm, document.body, 'input');

function mapFilterNumber(stream) {
  return stream
    .map(_.ary(parseInt, 1))
    .filter(_.negate(_.isNaN));
}


var repoS = fromInputOfBody('js-repo').startWith('zhangchiqing/milestones');
var durationS = mapFilterNumber(fromInputOfBody('js-duration')).startWith(7);
var dayS = Rx.DOM.fromEvent(document.body, 'click')
  .filter(function(e) {
    return _.contains(e.target.className.split(' '), 'js-day');
  })
  .map(function(e) {
    return parseInt($(e.target).attr('data-day'), 10);
  })
  .startWith(1);
var weeksS = mapFilterNumber(fromInputOfBody('js-weeks')).startWith(1);
var tokenS = fromInputOfBody('js-token')
  .startWith('93189dc467d5c7cb1db4efaa999bef3e1fda5357');

var submitS = fromEventOfRootElm(document.body, 'click', 'js-submit');
function zipObject() {
  var keys = Array.prototype.slice.call(arguments);
  return function() {
    var values = Array.prototype.slice.call(arguments);
    return keys.reduce(function(zip, key, i) {
      zip[key] = values[i];
      return zip;
    }, {});
  };
}

var formS = Rx.Observable.combineLatest([
  repoS, durationS, dayS, weeksS, tokenS],
  function(repo, duration, day, weeks, token) {
    return {
      repo: repo,
      duration: duration,
      day: day,
      days: _.range(1, 8).map(function(day) {
        return {
          day: day,
          name: ['', 'Monday', 'Tuesday', 'Wednesday',
            'Thursday', 'Friday', 'Saturday', 'Sunday'][day],
        };
      }),
      weeks: weeks,
      token: token,
    };
  });

var queryS = formS.map(function toQuery(args) {
  var base = moment().day(args.day);
  while (base.isBefore()) {
    base.add(args.duration, 'days');
  }

  return _.map(_.range(args.weeks), function(i) {
    var daysToAdd = args.duration * i;
    var due = base.clone().add(daysToAdd, 'days');
    return {
      repo: args.repo,
      token: args.token,
      title: due.format('MMM DD, YYYY'),
      due_on: due.toDate().toISOString(),
    };
  });
});


formS.take(1).subscribe(initUI);
formS.skip(1).subscribe(render);


function createMilestone(query) {
  var key = [query.repo, query.title].join(':');
  var url = ['https://api.github.com', '/repos/', query.repo, '/milestones',
    yes(query.token, '?access_token=' + query.token)]
    .join('');
  var body = _.pick(query, ['title', 'state', 'description', 'due_on']);

  return Rx.Observable.fromPromise($.ajax({
    url: url,
    data: JSON.stringify(body),
    dataType: 'json',
    method: 'POST',
  }))
  .map(function(milestone) {
    var report = {};

    report[key] = {
      key: key,
      url: milestone.html_url,
    };
    return report;
  });
}

function sequence(list, returnObservable) {
  return Rx.Observable.fromArray(list)
  .flatMap(returnObservable);
}


var processingS = submitS
.withLatestFrom(queryS, function(click, query) {
  return query;
})
.flatMap(function createMilestones(querys) {
  return sequence(querys, createMilestone)
  .reduce(_.extend, {});
})
.subscribe(console.print);
