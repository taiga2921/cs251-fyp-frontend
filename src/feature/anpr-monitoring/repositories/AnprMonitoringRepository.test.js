import { describe, expect, it, vi } from 'vitest';

import { AnprMonitoringRepository } from '../repositories/AnprMonitoringRepository';

const paginatedEnvelope = (rows, meta = {}) => ({
  success: true,
  data: {
    data: rows,
    total: meta.total ?? rows.length,
    current_page: meta.current_page ?? 1,
    last_page: meta.last_page ?? 1,
    per_page: meta.per_page ?? rows.length
  }
});

describe('AnprMonitoringRepository', () => {
  it('builds list query params with sort=detection_time and direction=desc', () => {
    const repo = new AnprMonitoringRepository({});
    const params = repo.buildListQueryParams({}, 0, 10);
    expect(params).toMatchObject({
      page: 1,
      per_page: 10,
      sort: 'detection_time',
      direction: 'desc'
    });
  });

  it('converts filters into backend query params', () => {
    const repo = new AnprMonitoringRepository({});
    const params = repo.buildListQueryParams({ plateSearch: ' ABC ', validity: 'valid', flagged: 'flagged' }, 2, 25);
    expect(params).toEqual({
      page: 3,
      per_page: 25,
      sort: 'detection_time',
      direction: 'desc',
      plate_number: 'ABC',
      is_valid: 1,
      is_flagged: 1
    });
  });

  it('normalizes paginated Laravel envelopes', async () => {
    const dataSource = {
      getAnprEvents: vi.fn().mockResolvedValue(
        paginatedEnvelope([
          {
            id: 'evt-1',
            plate_number: 'ABC1234',
            confidence: 0.9,
            detection_time: '2026-01-01T10:00:00Z',
            is_valid: true,
            is_flagged: false
          }
        ])
      )
    };
    const repo = new AnprMonitoringRepository(dataSource);
    const result = await repo.getAnprEvents({});
    expect(result.events).toHaveLength(1);
    expect(result.events[0].plateNumber).toBe('ABC1234');
    expect(result.pagination.total).toBe(1);
  });

  it('handles missing vehicle and images safely', () => {
    const repo = new AnprMonitoringRepository({});
    const normalized = repo.normalizeEvent({
      id: 'evt-2',
      plate_number: 'PMK8811',
      confidence: '0.5',
      detection_time: null
    });
    expect(normalized.vehicle).toBeNull();
    expect(normalized.images).toEqual([]);
    expect(normalized.hasEvidence).toBe(false);
    expect(normalized.confidencePercent).toBe('50.0%');
  });

  it('sorts images in full, plate, annotated order', () => {
    const repo = new AnprMonitoringRepository({});
    const normalized = repo.normalizeEvent({
      id: 'evt-3',
      plate_number: 'JKE9900',
      confidence: 0.8,
      images: [
        { id: '3', image_type: 'annotated', url: 'https://example.com/a.jpg' },
        { id: '1', image_type: 'full', url: 'https://example.com/f.jpg' },
        { id: '2', image_type: 'plate', url: 'https://example.com/p.jpg' }
      ]
    });
    expect(normalized.images.map((image) => image.imageType)).toEqual(['full', 'plate', 'annotated']);
  });

  it('does not crash on partial backend payloads', () => {
    const repo = new AnprMonitoringRepository({});
    expect(repo.normalizeEvent(null)).toBeNull();
    expect(repo.normalizeEvent({})).toMatchObject({
      plateNumber: '—',
      evidenceCount: 0,
      hasEvidence: false
    });
  });
});
