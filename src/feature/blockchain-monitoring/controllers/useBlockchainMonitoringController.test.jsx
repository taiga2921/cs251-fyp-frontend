import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

import { useBlockchainMonitoringController } from './useBlockchainMonitoringController';

const makeRepository = (overrides = {}) => ({
  buildListQueryParams: vi.fn(() => ({ page: 1, per_page: 10, sort_by: 'created_at', sort_order: 'desc' })),
  getBlockchainSummary: vi.fn().mockResolvedValue({
    total: 2,
    pending: 1,
    queued: 0,
    processing: 0,
    submitted: 0,
    confirmed: 1,
    failed: 0,
    inFlight: 1
  }),
  getBlockchainRecords: vi.fn().mockResolvedValue({
    records: [{ id: 'rec-1', status: 'confirmed' }],
    pagination: { total: 1, page: 1, perPage: 10, lastPage: 1 }
  }),
  ...overrides
});

const wrapper = ({ children }) => <MemoryRouter>{children}</MemoryRouter>;

describe('useBlockchainMonitoringController', () => {
  it('loads summary and records on mount', async () => {
    const repository = makeRepository();
    const { result } = renderHook(() => useBlockchainMonitoringController(repository), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.summary?.total).toBe(2);
    expect(result.current.records).toHaveLength(1);
    expect(repository.getBlockchainSummary).toHaveBeenCalled();
    expect(repository.getBlockchainRecords).toHaveBeenCalled();
  });

  it('manual refresh reloads data', async () => {
    const repository = makeRepository();
    const { result } = renderHook(() => useBlockchainMonitoringController(repository), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      result.current.handleRefresh();
    });
    await waitFor(() => expect(result.current.refreshing).toBe(false));

    expect(repository.getBlockchainSummary).toHaveBeenCalledTimes(2);
    expect(repository.getBlockchainRecords).toHaveBeenCalledTimes(2);
  });

  it('updates filters and resets page', async () => {
    const repository = makeRepository();
    const { result } = renderHook(() => useBlockchainMonitoringController(repository), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.handleStatusFilterChange('failed');
    });

    await waitFor(() => expect(result.current.filters.status).toBe('failed'));
    expect(result.current.page).toBe(0);
  });
});
