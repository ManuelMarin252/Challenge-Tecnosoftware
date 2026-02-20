
// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { AuthProvider } from './AuthContext';
import { useAuth } from './auth-context';
import type { AuthResponse } from '../types/api';

// Test Component to consume AuthContext
const TestComponent = () => {
  const { user, token, login, logout, isAuthenticated } = useAuth();

  return (
    <div>
      <div data-testid="user-email">{user?.email || 'No User'}</div>
      <div data-testid="token">{token || 'No Token'}</div>
      <div data-testid="auth-status">{isAuthenticated ? 'Authenticated' : 'Not Authenticated'}</div>
      <button onClick={() => login(mockAuthResponse)}>Login</button>
      <button onClick={logout}>Logout</button>
    </div>
  );
};

const mockUser = {
  id: 1,
  email: 'test@example.com',
  roles: [{ id: 1, name: 'Admin' }],
};

const mockAuthResponse: AuthResponse = {
  accessToken: 'fake-jwt-token',
  user: mockUser,
};

describe('AuthContext', () => {
  it('provides initial unauthenticated state', () => {
    localStorage.clear();
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId('user-email').textContent).toBe('No User');
    expect(screen.getByTestId('auth-status').textContent).toBe('Not Authenticated');
  });

  it('updates state and localStorage on login', async () => {
    const { getByText, getByTestId } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await act(async () => {
      getByText('Login').click();
    });

    expect(getByTestId('user-email').textContent).toBe('test@example.com');
    expect(getByTestId('token').textContent).toBe('fake-jwt-token');
    expect(getByTestId('auth-status').textContent).toBe('Authenticated');
    
    expect(localStorage.getItem('token')).toBe('fake-jwt-token');
    expect(JSON.parse(localStorage.getItem('user')!)).toEqual(mockUser);
  });

  it('clears state and localStorage on logout', async () => {
    // Setup initial state
    localStorage.setItem('token', 'fake-jwt-token');
    localStorage.setItem('user', JSON.stringify(mockUser));

    const { getByText, getByTestId } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Verify initial logged in state
    expect(getByTestId('auth-status').textContent).toBe('Authenticated');

    await act(async () => {
      getByText('Logout').click();
    });

    expect(getByTestId('user-email').textContent).toBe('No User');
    expect(getByTestId('token').textContent).toBe('No Token');
    expect(getByTestId('auth-status').textContent).toBe('Not Authenticated');
    
    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
  });
});
