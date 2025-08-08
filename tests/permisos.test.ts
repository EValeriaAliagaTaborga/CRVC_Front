// @ts-nocheck

import { beforeEach, describe, it } from 'node:test';
import assert from 'node:assert';
import { tienePermiso } from '../src/services/permisos.js';
import { LocalStorageMock, createToken } from './test-utils.js';

beforeEach(() => {
  // @ts-ignore
  globalThis.localStorage = new LocalStorageMock();
});

describe('permisos service', () => {
  it('returns true when user has permitted role', () => {
    const payload = { id: 1, rol: '1', nombre: 'Admin', email: 'a@example.com', exp: Math.floor(Date.now() / 1000) + 3600 };
    const token = createToken(payload);
    localStorage.setItem('accessToken', token);
    assert.strictEqual(tienePermiso(['Administrador']), true);
  });

  it('returns false when user lacks permitted role', () => {
    const payload = { id: 1, rol: '2', nombre: 'Vend', email: 'v@example.com', exp: Math.floor(Date.now() / 1000) + 3600 };
    const token = createToken(payload);
    localStorage.setItem('accessToken', token);
    assert.strictEqual(tienePermiso(['Administrador']), false);
  });

  it('returns false when no user token', () => {
    assert.strictEqual(tienePermiso(['Administrador']), false);
  });
});
