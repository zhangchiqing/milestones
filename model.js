'use strict';

var Rx = require('rx');
var u = require('./util');

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
    return function(model) {
      model.repo = repo;
      return model;
    };
  });
  mods.add(modEditRepo);

  var modEditDuration = action.editDuration.map(function(days) {
    return function(model) {
      model.days = days;
      return model;
    };
  });
  mods.add(modEditDuration);

  var modSelectDay = action.selectDay.map(function(duration) {
    return function(model) {
      model.duration = duration;
      return model;
    };
  });
  mods.add(modSelectDay);

  var modSend = action.clickSubmit.map(function(token) {
    return function(model) {
      model.progress = 0;
      return model;
    };
  });
  mods.add(modSend);

  var modProgress = action.clickSubmit.map(function(token) {
    return function(model) {
      model.progress = 1;
      return model;
    };
  });
  mods.add(modProgress);

  return Rx.Observable.merge.apply(Rx.Observable, mods);
}

module.export = function(action) {
  var modificationS = makeModification(action);
  return modificationS.startWith(start)
  .scan(function(model, modify) {
    return modify(model);
  });
};
