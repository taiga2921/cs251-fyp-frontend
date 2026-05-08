import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const useCheckpointController = (repository, zoneId) => {
  const navigate = useNavigate();
  const [checkpoints, setCheckpoints] = useState([]);
  const [zone, setZone] = useState([]);
  const [selected, setSelected] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [filterText, setFilterText] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCheckpoints();
  }, [zoneId]);

  const loadCheckpoints = async () => {
    try {
      setLoading(true);
      const checkpointData = await repository.getAllCheckpointsByZoneId(zoneId);
      const zoneData = await repository.getZoneById(zoneId);
      console.log(checkpointData.data.data);
      console.log(zoneData.data);
      setCheckpoints(checkpointData.data.data);
      setZone(zoneData.data);
    } catch (error) {
      console.error('Failed to load checkpoints:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSelectAllClick = (event) => {
    if (event.target.checked) {
      const newSelected = checkpoints.map((n) => n.id);
      setSelected(newSelected);
      return;
    }
    setSelected([]);
  };

  const handleRowClick = (event, id) => {
    const selectedIndex = selected.indexOf(id);
    let newSelected = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, id);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1));
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(selected.slice(0, selectedIndex), selected.slice(selectedIndex + 1));
    }

    setSelected(newSelected);
  };

  const handleFilterChange = (text) => {
    setFilterText(text);
    setPage(0);
  };

  const handleAddCheckpoint = () => {
    navigate(`/admin/management-checkpoint/add/${zoneId}`);
  };

  const handleViewCheckpoint = (checkpointId) => {
    navigate(`/admin/management-checkpoint/view/${checkpointId}`);
  };

  const handleEditCheckpoint = (checkpointId) => {
    navigate(`/admin/management-checkpoint/edit/${zoneId}/${checkpointId}`);
  };

  const handleDeleteCheckpoint = async (checkpointId) => {
    if (window.confirm('Are you sure you want to delete this checkpoint?')) {
      try {
        await repository.deleteCheckpoint(checkpointId);
        await loadCheckpoints();
      } catch (error) {
        console.error('Failed to delete checkpoint:', error);
        alert('Failed to delete checkpoint');
      }
    }
  };

  const handleBack = () => {
    navigate('/admin/management-zone');
  };

  const isSelected = (id) => selected.indexOf(id) !== -1;

  const filteredCheckpoints = repository.filterCheckpoints(checkpoints, filterText);
  const paginatedCheckpoints = repository.paginateCheckpoints(filteredCheckpoints, page, rowsPerPage);

  return {
    checkpoints: paginatedCheckpoints,
    zone,
    filteredCount: filteredCheckpoints.length,
    selected,
    page,
    rowsPerPage,
    filterText,
    loading,
    isSelected,
    handleBack,
    handleChangePage,
    handleChangeRowsPerPage,
    handleSelectAllClick,
    handleRowClick,
    handleFilterChange,
    handleAddCheckpoint,
    handleViewCheckpoint,
    handleEditCheckpoint,
    handleDeleteCheckpoint
  };
};
