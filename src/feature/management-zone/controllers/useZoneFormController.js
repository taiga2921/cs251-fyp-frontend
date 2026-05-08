import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

export const useZoneFormController = (repository, zoneId = null) => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(!!zoneId);
  const [errors, setErrors] = useState({});
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    if (zoneId) {
      loadZone();
    }
  }, [zoneId]);

  // Auto-redirect effect
  useEffect(() => {
    let timer;
    if (showSuccessModal) {
      timer = setTimeout(() => {
        handleModalClose();
      }, 2000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [showSuccessModal]);

  const loadZone = async () => {
    try {
      setInitialLoading(true);
      const zone = await repository.getZoneById(zoneId);
      if (zone) {
        setFormData({
          name: zone.data.name,
          description: zone.data.description
        });
      }
    } catch (error) {
      console.error('Failed to load zone:', error);
      alert('Failed to load zone data');
    } finally {
      setInitialLoading(false);
    }
  };

  const handleChange = (field) => (event) => {
    setFormData({
      ...formData,
      [field]: event.target.value
    });
    if (errors[field]) {
      setErrors({
        ...errors,
        [field]: ''
      });
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validate()) {
      return;
    }

    try {
      setLoading(true);
      if (zoneId) {
        await repository.updateZone(zoneId, formData);
        setShowSuccessModal(true);
      } else {
        await repository.createZone(formData);
        setShowSuccessModal(true);
      }
    } catch (error) {
      console.error('Failed to save zone:', error);
      alert('Failed to save zone: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/admin/management-zone');
  };

  const handleModalClose = () => {
    setShowSuccessModal(false);
    if (zoneId) {
      navigate(`/admin/management-zone/view/${zoneId}`);
    } else {
      navigate('/admin/management-zone');
    }
  };

  return {
    formData,
    errors,
    loading,
    initialLoading,
    showSuccessModal,
    fileInputRef,
    handleChange,
    handleSubmit,
    handleCancel,
    handleModalClose
  };
};
