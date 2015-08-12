/* jshint -W079 */
'use strict';

var Rx = require('rx');

var moment = require('moment');
var _ = require('lodash');
var $ = require('jquery');

var u = require('./util');
var action = require('./action')(document.body);
var model = require('./model')(action);
var view = require('./view')(model);

console.print = console.log.bind(console);


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


formS.take(1).subscribe(view.init);
formS.skip(1).subscribe(view.render);


function createMilestone(query) {
  var key = [query.repo, query.title].join(':');
  var url = ['https://api.github.com', '/repos/', query.repo, '/milestones',
    u.yes(query.token, '?access_token=' + query.token)]
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
