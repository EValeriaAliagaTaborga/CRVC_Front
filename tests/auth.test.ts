// @ts-nocheck

import { beforeEach, describe, it } from 'node:test';
import assert from 'node:assert';
import { setToken, getToken, removeToken, isTokenExpired, isAuthenticated } from '../src/services/auth.js';
import { LocalStorageMock, createToken } from './test-utils.js';

beforeEach(() => {
  // @ts-ignore
  globalThis.localStorage = new LocalStorageMock();
});

describe('auth service', () => {
  it('stores and retrieves a valid token', () => {
    const token = createToken({ exp: Math.floor(Date.now() / 1000) + 3600 });
    setToken(token);
    assert.strictEqual(getToken(), token);
  });

  it('does not store an invalid token', () => {
    setToken('invalid-token');
    assert.strictEqual(getToken(), null);
  });

  it('removes a stored token', () => {
    const token = createToken({ exp: Math.floor(Date.now() / 1000) + 3600 });
    setToken(token);
    removeToken();
    assert.strictEqual(getToken(), null);
  });

  it('detects expired tokens', () => {
    const expired = createToken({ exp: Math.floor(Date.now() / 1000) - 10 });
    setToken(expired);
    assert.strictEqual(isTokenExpired(), true);
  });

  it('checks authentication status', () => {
    const token = createToken({ exp: Math.floor(Date.now() / 1000) + 3600 });
    setToken(token);
    assert.strictEqual(isAuthenticated(), true);
    removeToken();
    assert.strictEqual(isAuthenticated(), false);
  });
});
