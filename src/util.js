'use strict';

function yes(ifTrue, returnMe) { return ifTrue ? returnMe : ''; }
function no(ifFalse, returnMe) { return ifFalse ? '' : returnMe; }

module.exports = {
  yes: yes,
  no: no,
};
