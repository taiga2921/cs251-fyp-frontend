import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import AuthLogin from './AuthLogin';
import { AUTH_TOKEN_KEY, AUTH_USER_KEY } from 'utils/auth';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate
  };
});

vi.mock('api/api', () => ({
  default: {
    post: vi.fn()
  }
}));

import api from 'api/api';

describe('AuthLogin password setup routing', () => {
  beforeEach(() => {
    localStorage.clear();
    mockNavigate.mockReset();
    vi.mocked(api.post).mockReset();
  });

  it('routes setup-required login to first-login setup without storing access token', async () => {
    vi.mocked(api.post).mockResolvedValue({
      data: {
        success: true,
        data: {
          next_step: 'password_setup_required',
          setup_token: 'setup-token-abc',
          expires_in: 3600,
          user: { email: 'new@example.com', setup_required: true }
        }
      }
    });

    render(
      <MemoryRouter>
        <AuthLogin />
      </MemoryRouter>
    );

    await userEvent.type(screen.getByLabelText(/email address/i), 'new@example.com');
    await userEvent.type(screen.getByLabelText(/^password$/i), 'TempPassword1!');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/first-login/setup', {
        replace: true,
        state: {
          setupToken: 'setup-token-abc',
          email: 'new@example.com',
          expiresIn: 3600
        }
      });
    });

    expect(localStorage.getItem(AUTH_TOKEN_KEY)).toBeNull();
    expect(localStorage.getItem(AUTH_USER_KEY)).toBeNull();
  });
});
