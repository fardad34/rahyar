'use strict';
exports.handler=require('../lib/http-adapter.cjs').adapt(require('../../api/shared-trip.js'));
