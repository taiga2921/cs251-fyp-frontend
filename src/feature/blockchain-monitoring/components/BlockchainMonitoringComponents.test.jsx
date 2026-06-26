import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import BlockchainStatusChip from '../components/BlockchainStatusChip';
import BlockchainNetworkBadge from '../components/BlockchainNetworkBadge';
import BlockchainPayloadSummary from '../components/BlockchainPayloadSummary';

describe('Blockchain monitoring components', () => {
  it('renders record status chip labels', () => {
    render(<BlockchainStatusChip value="confirmed" />);
    expect(screen.getByText('Confirmed')).toBeInTheDocument();
  });

  it('renders backend job status labels', () => {
    render(<BlockchainStatusChip kind="job" value="success" />);
    expect(screen.getByText('Success')).toBeInTheDocument();

    render(<BlockchainStatusChip kind="job" value="cancelled" />);
    expect(screen.getByText('Cancelled')).toBeInTheDocument();
  });

  it('renders backend verification result labels', () => {
    render(<BlockchainStatusChip kind="verification" value="tampered" />);
    expect(screen.getByText('Tampered')).toBeInTheDocument();

    render(<BlockchainStatusChip kind="verification" value="onchain_missing" />);
    expect(screen.getByText('On-chain Missing')).toBeInTheDocument();

    render(<BlockchainStatusChip kind="verification" value="failed" />);
    expect(screen.getAllByText('Failed').length).toBeGreaterThanOrEqual(1);
  });

  it('renders unknown status values safely', () => {
    render(<BlockchainStatusChip kind="job" value="custom_state" />);
    expect(screen.getByText('Custom State')).toBeInTheDocument();
  });

  it('renders network badge with environment', () => {
    render(<BlockchainNetworkBadge network="sepolia" environment="staging" />);
    expect(screen.getByText('sepolia · staging')).toBeInTheDocument();
  });

  it('renders payload summary key-value rows', () => {
    render(
      <BlockchainPayloadSummary
        items={[
          { key: 'plate_number', label: 'Plate Number', value: 'ABC1234' },
          { key: 'event_id', label: 'Event Id', value: 'evt-1' }
        ]}
      />
    );
    expect(screen.getByText('Plate Number')).toBeInTheDocument();
    expect(screen.getByText('ABC1234')).toBeInTheDocument();
  });
});
