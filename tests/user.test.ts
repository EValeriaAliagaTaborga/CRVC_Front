// @ts-nocheck

import { beforeEach, describe, it } from 'node:test';
import assert from 'node:assert';
import { getUsuario } from '../src/services/user.js';
import { LocalStorageMock, createToken } from './test-utils.js';

beforeEach(() => {
  // @ts-ignore
  globalThis.localStorage = new LocalStorageMock();
});

describe('user service', () => {
  it('returns decoded user from token', () => {
    const payload = { id: 1, rol: '1', nombre: 'Test', email: 't@example.com', exp: Math.floor(Date.now() / 1000) + 3600 };
    const token = createToken(payload);
    localStorage.setItem('accessToken', token);
    assert.deepStrictEqual(getUsuario(), payload);
  });

  it('returns null for invalid token', () => {
    localStorage.setItem('accessToken', 'invalid.token');
    assert.strictEqual(getUsuario(), null);
  });
});
