import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const useZoneController = (repository) => {
  const navigate = useNavigate();
  const [zones, setZones] = useState([]);
  const [selected, setSelected] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [filterText, setFilterText] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadZones();
  }, []);

  const loadZones = async () => {
    try {
      setLoading(true);
      const data = await repository.getAllZones();
      setZones(data.data.data);
    } catch (error) {
      console.error('Failed to load zones:', error);
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
      const newSelected = zones.map((n) => n.id);
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
    if (window.confirm('Are you sure you want to delete this zone?')) {
      try {
        await repository.deleteZone(zoneId);
        await loadZones();
      } catch (error) {
        console.error('Failed to delete zone:', error);
        alert('Failed to delete zone');
      }
    }
  };

  const isSelected = (id) => selected.indexOf(id) !== -1;

  const filteredZones = repository.filterZones(zones, filterText);
  const paginatedZones = repository.paginateZones(filteredZones, page, rowsPerPage);

  return {
    zones: paginatedZones,
    filteredCount: filteredZones.length,
    selected,
    page,
    rowsPerPage,
    filterText,
    loading,
    isSelected,
    handleChangePage,
    handleChangeRowsPerPage,
    handleSelectAllClick,
    handleRowClick,
    handleFilterChange,
    handleAddZone,
    handleViewZone,
    handleEditZone,
    handleDeleteZone
  };
};
