import { unwrapPaginatedEnvelope } from '../datasources/anprMonitoringService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
const BACKEND_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');

const IMAGE_TYPE_ORDER = { full: 0, plate: 1, annotated: 2 };

const parseConfidence = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

const formatDetectionTime = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat('en-MY', {
    timeZone: 'Asia/Kuala_Lumpur',
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date);
};

const resolvePreviewUrl = (image) => {
  if (!image || typeof image !== 'object') return null;

  const candidates = [image.url, image.image_url, image.public_url, image.file_url, image.file_path].filter(Boolean);

  for (const candidate of candidates) {
    const value = String(candidate).trim();
    if (!value) continue;
    if (/^https?:\/\//i.test(value)) return value;
    if (value.startsWith('/storage/')) return `${BACKEND_ORIGIN}${value}`;
  }

  return null;
};

const normalizeCamera = (camera) => {
  if (!camera || typeof camera !== 'object') return null;
  return {
    id: camera.id ?? null,
    name: camera.name ?? 'Unknown camera',
    location: camera.location ?? null,
    ipAddress: camera.ip_address ?? null,
    isActive: Boolean(camera.is_active),
    latitude: camera.latitude ?? null,
    longitude: camera.longitude ?? null,
    raw: camera
  };
};

const normalizeVehicle = (vehicle) => {
  if (!vehicle || typeof vehicle !== 'object') return null;
  return {
    id: vehicle.id ?? null,
    plateNumber: vehicle.plate_number ?? null,
    ownerName: vehicle.owner_name ?? null,
    vehicleType: vehicle.vehicle_type ?? null,
    status: vehicle.status ?? null,
    source: vehicle.source ?? null,
    notes: vehicle.notes ?? null,
    raw: vehicle
  };
};

const normalizeImage = (image) => {
  if (!image || typeof image !== 'object') return null;

  const imageType = String(image.image_type ?? '').toLowerCase();
  const previewUrl = resolvePreviewUrl(image);

  return {
    id: image.id ?? null,
    anprEventId: image.anpr_event_id ?? null,
    imageType,
    filePath: image.file_path ?? null,
    fileSize: image.file_size ?? null,
    resolution: image.resolution ?? null,
    expiresAt: image.expires_at ?? null,
    previewUrl,
    raw: image
  };
};

const normalizeLog = (log) => {
  if (!log || typeof log !== 'object') return null;

  return {
    id: log.id ?? null,
    anprEventId: log.anpr_event_id ?? null,
    stage: log.stage ?? 'unknown',
    message: log.message ?? null,
    createdAt: log.created_at ?? null,
    formattedCreatedAt: formatDetectionTime(log.created_at),
    raw: log
  };
};

const sortImages = (images) =>
  [...images].sort((a, b) => {
    const orderA = IMAGE_TYPE_ORDER[a.imageType] ?? 99;
    const orderB = IMAGE_TYPE_ORDER[b.imageType] ?? 99;
    if (orderA !== orderB) return orderA - orderB;
    return String(a.id ?? '').localeCompare(String(b.id ?? ''));
  });

const sortLogs = (logs) =>
  [...logs].sort((a, b) => {
    const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return ta - tb;
  });

export class AnprMonitoringRepository {
  constructor(dataSource) {
    this.dataSource = dataSource;
  }

  assertSuccess(envelope, fallbackMessage) {
    if (envelope?.success === false) {
      throw new Error(envelope?.message || fallbackMessage);
    }
    return envelope;
  }

  async getAnprEvents(params = {}) {
    const envelope = this.assertSuccess(
      await this.dataSource.getAnprEvents(params),
      'Failed to load ANPR events'
    );
    const { rows, meta } = unwrapPaginatedEnvelope(envelope);
    return {
      events: rows.map((event) => this.normalizeEvent(event)),
      pagination: {
        total: meta.total,
        page: meta.currentPage,
        perPage: meta.perPage,
        lastPage: meta.lastPage
      }
    };
  }

  async getAnprEventById(id) {
    const envelope = this.assertSuccess(
      await this.dataSource.getAnprEventById(id),
      'Failed to load ANPR event'
    );
    return this.normalizeEvent(envelope?.data ?? null);
  }

  async getAnprImagesForEvent(anprEventId) {
    const envelope = this.assertSuccess(
      await this.dataSource.getAnprImages({ anpr_event_id: anprEventId, per_page: 100 }),
      'Failed to load ANPR images'
    );
    const { rows } = unwrapPaginatedEnvelope(envelope);
    return sortImages(rows.map((image) => normalizeImage(image)).filter(Boolean));
  }

  async getAnprEventLogsFallback(anprEventId) {
    const envelope = this.assertSuccess(
      await this.dataSource.getAnprEventLogs({ per_page: 100 }),
      'Failed to load ANPR event logs'
    );
    const { rows } = unwrapPaginatedEnvelope(envelope);
    return sortLogs(
      rows
        .filter((log) => String(log?.anpr_event_id) === String(anprEventId))
        .map((log) => normalizeLog(log))
        .filter(Boolean)
    );
  }

  normalizeEvent(event) {
    if (!event || typeof event !== 'object') return null;

    const images = sortImages(
      (Array.isArray(event.images) ? event.images : [])
        .map((image) => normalizeImage(image))
        .filter(Boolean)
    );

    const imageMap = images.reduce((acc, image) => {
      if (image.imageType) acc[image.imageType] = image;
      return acc;
    }, {});

    const logs = sortLogs(
      (Array.isArray(event.logs) ? event.logs : [])
        .map((log) => normalizeLog(log))
        .filter(Boolean)
    );

    const confidence = parseConfidence(event.confidence);
    const evidenceCount = images.length;

    return {
      id: event.id ?? null,
      plateNumber: event.plate_number ?? '—',
      confidence,
      confidencePercent: `${(confidence * 100).toFixed(1)}%`,
      detectionTime: event.detection_time ?? null,
      formattedDetectionTime: formatDetectionTime(event.detection_time),
      isValid: Boolean(event.is_valid),
      isFlagged: Boolean(event.is_flagged),
      latitude: event.latitude ?? null,
      longitude: event.longitude ?? null,
      camera: normalizeCamera(event.camera),
      vehicle: normalizeVehicle(event.vehicle),
      images,
      imageMap,
      logs,
      evidenceCount,
      hasEvidence: evidenceCount > 0,
      raw: event
    };
  }

  filterEvents(events, filters = {}) {
    const plateNeedle = String(filters.plateSearch ?? '')
      .trim()
      .toLowerCase();
    const validityFilter = filters.validity ?? 'all';
    const flaggedFilter = filters.flagged ?? 'all';

    return events.filter((event) => {
      if (plateNeedle) {
        const plate = String(event.plateNumber ?? '').toLowerCase();
        if (!plate.includes(plateNeedle)) return false;
      }

      if (validityFilter === 'valid' && !event.isValid) return false;
      if (validityFilter === 'invalid' && event.isValid) return false;

      if (flaggedFilter === 'flagged' && !event.isFlagged) return false;
      if (flaggedFilter === 'unflagged' && event.isFlagged) return false;

      return true;
    });
  }

  paginateEvents(events, page, rowsPerPage) {
    const start = page * rowsPerPage;
    return events.slice(start, start + rowsPerPage);
  }
}
