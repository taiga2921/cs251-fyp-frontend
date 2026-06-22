import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const DEFAULT_FILTERS = {
  plateSearch: '',
  validity: 'all',
  flagged: 'all'
};

export const useAnprMonitoringController = (repository) => {
  const navigate = useNavigate();

  const [events, setEvents] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, perPage: 10, lastPage: 1 });
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const loadEvents = useCallback(
    async ({ isRefresh = false } = {}) => {
      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }
        setError(null);

        const params = repository.buildListQueryParams(filters, page, rowsPerPage);
        const { events: rows, pagination: meta } = await repository.getAnprEvents(params);

        setEvents(rows);
        setPagination({
          total: meta.total,
          page: meta.page,
          perPage: meta.perPage,
          lastPage: meta.lastPage
        });
      } catch (err) {
        setError(err.message || 'Failed to load ANPR events');
        setEvents([]);
        setPagination({ total: 0, page: 1, perPage: rowsPerPage, lastPage: 1 });
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [repository, filters, page, rowsPerPage]
  );

  useEffect(() => {
    void loadEvents();
  }, [loadEvents]);

  const handlePlateSearchChange = (value) => {
    setFilters((prev) => ({ ...prev, plateSearch: value }));
    setPage(0);
  };

  const handleValidityFilterChange = (value) => {
    setFilters((prev) => ({ ...prev, validity: value }));
    setPage(0);
  };

  const handleFlaggedFilterChange = (value) => {
    setFilters((prev) => ({ ...prev, flagged: value }));
    setPage(0);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleViewDetails = (anprEventId) => {
    navigate(`/admin/anpr-monitoring/${anprEventId}`);
  };

  const handleRefresh = () => {
    void loadEvents({ isRefresh: true });
  };

  return {
    events,
    pagination,
    filters,
    page,
    rowsPerPage,
    loading,
    refreshing,
    error,
    handlePlateSearchChange,
    handleValidityFilterChange,
    handleFlaggedFilterChange,
    handleChangePage,
    handleChangeRowsPerPage,
    handleViewDetails,
    handleRefresh
  };
};

export const useAnprEventDetailController = (repository) => {
  const { anprEventId } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const loadEvent = useCallback(
    async ({ isRefresh = false } = {}) => {
      if (!anprEventId) {
        setError('ANPR event id is missing');
        setLoading(false);
        return;
      }

      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }
        setError(null);

        let normalized = await repository.getAnprEventById(anprEventId);

        if (!normalized) {
          throw new Error('ANPR event not found');
        }

        if (!normalized.images?.length) {
          const images = await repository.getAnprImagesForEvent(anprEventId);
          if (images.length) {
            normalized = {
              ...normalized,
              images,
              imageMap: images.reduce((acc, image) => {
                if (image.imageType) acc[image.imageType] = image;
                return acc;
              }, {}),
              evidenceCount: images.length,
              hasEvidence: images.length > 0
            };
          }
        }

        setEvent(normalized);
      } catch (err) {
        setEvent(null);
        setError(err.message || 'Failed to load ANPR event');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [repository, anprEventId]
  );

  useEffect(() => {
    void loadEvent();
  }, [loadEvent]);

  const handleBack = () => {
    navigate('/admin/anpr-monitoring');
  };

  const handleRefresh = () => {
    void loadEvent({ isRefresh: true });
  };

  return {
    anprEventId,
    event,
    loading,
    refreshing,
    error,
    handleBack,
    handleRefresh
  };
};
