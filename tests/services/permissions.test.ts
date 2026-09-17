import assert from 'node:assert/strict';
import test from 'node:test';
import { hasPermission } from '../../lib/permissions';

test('course administrators can approve prices and export reports', () => {
  assert.equal(hasPermission('COURSE_ADMIN', 'pricing:approve'), true);
  assert.equal(hasPermission('COURSE_ADMIN', 'report:export'), true);
});

test('staff can operate tee times and reservations but cannot administer pricing', () => {
  assert.equal(hasPermission('STAFF', 'tee-time:write'), true);
  assert.equal(hasPermission('STAFF', 'reservation:write'), true);
  assert.equal(hasPermission('STAFF', 'course:update'), false);
  assert.equal(hasPermission('STAFF', 'pricing:approve'), false);
});
