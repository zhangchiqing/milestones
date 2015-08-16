/* jshint -W079 */
'use strict';

var Rx = require('rx');
var $ = require('jquery');
var _ = require('lodash');
var moment = require('moment');
var u = require('./util');

var init = {
  repo: 'zhangchiqing/milestones',
  duration: 7,
  day: 1,
  weeks: 1,
  // TODO: remove token
  token: '93189dc467d5c7cb1db4efaa999bef3e1fda5357',
  days: _.range(1, 8).map(function(day) {
    return {
      day: day,
      name: ['', 'Monday', 'Tuesday', 'Wednesday',
        'Thursday', 'Friday', 'Saturday', 'Sunday'][day],
    };
  }),
};

function toQuery(args) {
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
}

function createMilestone(query) {
  var key = [query.repo, query.title].join(':');
  var url = ['https://api.github.com', '/repos/', query.repo, '/milestones',
    u.yes(query.token, '?access_token=' + query.token)]
    .join('');
  var body = _.pick(query, ['title', 'state', 'description', 'due_on']);
  // TODO: validation

  return $.ajax({
    url: url,
    data: JSON.stringify(body),
    dataType: 'json',
    method: 'POST',
  })
  .then(function(milestone) {
    var report = {};

    report[key] = {
      key: key,
      url: milestone.html_url,
    };
    return report;
  });
}

function sequence(list, returnPromise) {
  return Rx.Observable.fromArray(list)
  .flatMap(function(item) {
    return Rx.Observable.fromPromise(returnPromise(item));
  });
}

function makeModification(action) {
  var mods = [];

  var modEditRepo = action.editRepo.map(function(repo) {
    return function(query) {
      query.repo = repo;
      return query;
    };
  });
  mods.push(modEditRepo);

  var modEditDuration = action.editDuration.map(function(duration) {
    return function(query) {
      query.duration = duration;
      return query;
    };
  });
  mods.push(modEditDuration);

  var modSelectDay = action.selectDay.map(function(day) {
    return function(query) {
      query.day = day;
      return query;
    };
  });
  mods.push(modSelectDay);

  var modEditWeeks = action.editWeeks.map(function(weeks) {
    return function(query) {
      query.weeks = weeks;
      return query;
    };
  });
  mods.push(modEditWeeks);

  return Rx.Observable.merge.apply(Rx.Observable, mods);
}

module.exports = function(action) {

  /**
   * ---m-----m--------
   * ------d-------d---
   * i--q--q--q----q---
   * -----------s--------------s------
   *            --r-r-r-r-r-c  ---e-c
   * -------------t-t-t-t-t-o-----e-o
   * i--q--q--q-s-tqt-t-t-t-o--s--e-o
   */
  var modificationS = makeModification(action);
  var queryS = modificationS.startWith(init)
  .scan(function(query, modify) {
    return modify(query);
  });

  var submitS = action.submit.withLatestFrom(queryS, function(click, query) {
    query.processing = true;
    query.error = null;
    return query;
  });

  var batchQueryS = submitS.map(toQuery);

  var respS = batchQueryS.flatMap(function createMilestones(querys) {
    return sequence(querys, createMilestone)
    .catch(function(error) {
      error = error.responseJSON ? error.responseJSON : error;
      return Rx.Observable.just({ error: error.message });
    });
    //.reduce(function(memo, resp) {
    //  return _.extend(memo, resp);
    //}, {});
  })
  .withLatestFrom(queryS, function(resp, query) {
    _.extend(query, resp);
    query.processing = false;
    return query;
  });

  return queryS.merge(submitS).merge(respS);
};
