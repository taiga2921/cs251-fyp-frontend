import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';

import AuthAuditLogTable from './AuthAuditLogTable';

describe('AuthAuditLogTable', () => {
  it('renders audit rows without sensitive token fields', () => {
    render(
      <AuthAuditLogTable
        logs={[
          {
            id: '1',
            action: 'refresh_success',
            status: 'success',
            email: 'guard@example.com',
            ip_address: '127.0.0.1',
            user_agent: 'PHPUnit',
            metadata: { session_id: 'session-1' },
            occurred_at: '2026-07-02T10:00:00+00:00'
          }
        ]}
      />
    );

    expect(screen.getByText('refresh_success')).toBeInTheDocument();
    expect(screen.queryByText(/token_hash/i)).toBeNull();
    expect(screen.queryByText(/refresh_token/i)).toBeNull();
  });
});
