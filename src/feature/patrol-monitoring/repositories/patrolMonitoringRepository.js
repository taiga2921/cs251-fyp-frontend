import { unwrapPaginatedEnvelope } from '../datasources/patrolMonitoringService';

export class PatrolMonitoringRepository {
  constructor(dataSource) {
    this.dataSource = dataSource;
  }

  async getPatrolSessions(params = {}) {
    const envelope = await this.dataSource.getPatrolSessions(params);
    if (envelope?.success === false) {
      throw new Error(envelope?.message || 'Failed to load patrol sessions');
    }
    return unwrapPaginatedEnvelope(envelope);
  }

  async getPatrolSessionById(id) {
    const envelope = await this.dataSource.getPatrolSessionById(id);
    if (envelope?.success === false) {
      throw new Error(envelope?.message || 'Failed to load patrol session');
    }
    return envelope?.data ?? null;
  }

  async getPatrolSummary(id) {
    const envelope = await this.dataSource.getPatrolSummary(id);
    if (envelope?.success === false) {
      throw new Error(envelope?.message || 'Failed to load patrol summary');
    }
    return envelope?.data ?? null;
  }

  async validatePatrolSession(id) {
    const envelope = await this.dataSource.validatePatrolSession(id);
    if (envelope?.success === false) {
      throw new Error(envelope?.message || 'Patrol validation failed');
    }
    return envelope?.data ?? null;
  }

  async getCheckpointEvents(params = {}) {
    const envelope = await this.dataSource.getCheckpointEvents(params);
    if (envelope?.success === false) {
      throw new Error(envelope?.message || 'Failed to load checkpoint events');
    }
    return unwrapPaginatedEnvelope(envelope);
  }

  /**
   * Load all patrol route breadcrumbs for a session (paginated API, merged client-side).
   */
  async getPatrolRoutes(patrolSessionId) {
    const allRows = [];
    let page = 1;
    let lastPage = 1;

    do {
      const envelope = await this.dataSource.getPatrolRoutes({
        patrol_session_id: patrolSessionId,
        per_page: 500,
        page
      });

      if (envelope?.success === false) {
        throw new Error(envelope?.message || 'Failed to load patrol routes');
      }

      const { rows, meta } = unwrapPaginatedEnvelope(envelope);
      allRows.push(...rows);
      lastPage = meta.lastPage ?? 1;
      page += 1;
    } while (page <= lastPage);

    return allRows.sort((a, b) => {
      const ta = a?.recorded_at ? new Date(a.recorded_at).getTime() : 0;
      const tb = b?.recorded_at ? new Date(b.recorded_at).getTime() : 0;
      return ta - tb;
    });
  }

  async getZones() {
    const zones = await this.dataSource.getZones();
    return Array.isArray(zones) ? zones : [];
  }

  /** Client-side filter for guard/zone text search on loaded rows. */
  filterSessionsBySearch(sessions, searchText) {
    const needle = String(searchText ?? '')
      .trim()
      .toLowerCase();
    if (!needle) {
      return sessions;
    }
    return sessions.filter((session) => {
      const guard = session?.user?.name ?? '';
      const zone = session?.zone?.name ?? '';
      return guard.toLowerCase().includes(needle) || zone.toLowerCase().includes(needle);
    });
  }
}
