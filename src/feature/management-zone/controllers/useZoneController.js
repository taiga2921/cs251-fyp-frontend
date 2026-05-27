import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export const useZoneController = (repository) => {
  const navigate = useNavigate();
  const [zones, setZones] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [totalCount, setTotalCount] = useState(0);
  const [filterText, setFilterText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  const loadZones = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const payload = await repository.getAllZones({
        page: page + 1,
        per_page: rowsPerPage,
        search: filterText.trim() || undefined,
        sort: 'latest'
      });

      const normalized = repository.normalizeZoneListResponse(payload);
      setZones(normalized.items);
      setTotalCount(normalized.total);
    } catch (err) {
      console.error('Failed to load zones:', err);
      setError(err?.message || 'Failed to load zones.');
      setZones([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [repository, page, rowsPerPage, filterText]);

  useEffect(() => {
    loadZones();
  }, [loadZones]);

  const handleChangePage = (_event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleFilterChange = (text) => {
    setFilterText(text);
    setPage(0);
  };

  const handleAddZone = () => {
    navigate('/admin/management-zone/add');
  };

  const handleViewZone = (zoneId) => {
    navigate(`/admin/management-zone/view/${zoneId}`);
  };

  const handleEditZone = (zoneId) => {
    navigate(`/admin/management-zone/edit/${zoneId}`);
  };

  const handleDeleteZone = async (zoneId) => {
    if (!window.confirm('Are you sure you want to delete this zone?')) return;

    try {
      await repository.deleteZone(zoneId);
      setFeedback({ type: 'success', message: 'Zone deleted successfully.' });
      await loadZones();
    } catch (err) {
      console.error('Failed to delete zone:', err);
      setFeedback({ type: 'error', message: err?.message || 'Failed to delete zone.' });
    }
  };

  const clearFeedback = () => {
    setFeedback({ type: '', message: '' });
  };

  return {
    zones,
    totalCount,
    page,
    rowsPerPage,
    filterText,
    loading,
    error,
    feedback,
    handleChangePage,
    handleChangeRowsPerPage,
    handleFilterChange,
    handleAddZone,
    handleViewZone,
    handleEditZone,
    handleDeleteZone,
    clearFeedback
  };
};
