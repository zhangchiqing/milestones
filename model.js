'use strict';

var Rx = require('rx');
var u = require('./util');
var _ = require('lodash');

var start = {
  repo: 'zhangchiqing/milestones',
  duration: 7,
  day: 1,
  weeks: 1,
  token: '93189dc467d5c7cb1db4efaa999bef3e1fda5357',
  days: _.range(1, 8).map(function(day) {
    return {
      day: day,
      name: ['', 'Monday', 'Tuesday', 'Wednesday',
        'Thursday', 'Friday', 'Saturday', 'Sunday'][day],
    };
  }),
};


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

function makeModification(action) {
  var mods = [];

  var modEditRepo = action.editRepo.map(function(repo) {
    return function(query) {
      query.repo = repo;
      return query;
    };
  });
  mods.add(modEditRepo);

  var modEditDuration = action.editDuration.map(function(days) {
    return function(query) {
      query.days = days;
      return query;
    };
  });
  mods.add(modEditDuration);

  var modSelectDay = action.selectDay.map(function(duration) {
    return function(query) {
      query.duration = duration;
      return query;
    };
  });
  mods.add(modSelectDay);

  return Rx.Observable.merge.apply(Rx.Observable, mods);
}

module.export = function(action) {

  /**
   * ---m-----m--------
   * ------d-------d---
   * ---q--q--q----q---
   * -----------s--------------s------
   * -------------r-r-r-r-r-c-----e-c
   * -------------t-t-t-t-t-o-----e-o
   * ---q--q--q-s-tqt-t-t-t-o--s--e-o
   */
  var modificationS = makeModification(action);
  var queryS = modificationS.startWith(start)
  .scan(function(query, modify) {
    return modify(query);
  });

  var submitS = action.submit.withLatestFrom(queryS, function(click, query) {
    return query;
  });

  var respS = submitS.flatMap(function createMilestones(querys) {
    return sequence(querys, createMilestone)
    .reduce(_.extend, {});
  });

  return queryS.combineLatest(respS, function(query, resp) {
    return _.extend(query, resp);
  });
};
