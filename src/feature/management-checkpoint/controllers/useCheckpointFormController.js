import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

// Setup dayjs plugins
dayjs.extend(utc);
dayjs.extend(timezone);

export const useCheckpointFormController = (repository, zoneId, checkpointId = null) => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    // zone_id: zoneId,
    name: '',
    description: '',
    latitude: '',
    longitude: ''
  });

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(!!checkpointId);
  const [errors, setErrors] = useState({});
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const extractBackendValidationErrors = (error) => {
    return error?.validationErrors || error?.data?.data?.errors || error?.data?.errors || null;
  };

  const extractBackendErrorMessage = (error) => {
    const validationErrors = extractBackendValidationErrors(error);
    if (validationErrors && typeof validationErrors === 'object') {
      const firstFieldErrors = Object.values(validationErrors).find((messages) => Array.isArray(messages) && messages.length > 0);
      if (Array.isArray(firstFieldErrors)) {
        return firstFieldErrors[0];
      }
    }

    return error?.data?.message || error?.message || 'Failed to save checkpoint.';
  };

  const normalizeValidationErrorsForForm = (validationErrors) => {
    if (!validationErrors || typeof validationErrors !== 'object') return {};

    return Object.entries(validationErrors).reduce((acc, [field, messages]) => {
      acc[field] = Array.isArray(messages) ? messages[0] : messages;
      return acc;
    }, {});
  };

  useEffect(() => {
    if (checkpointId) {
      loadCheckpoint();
    }
  }, [checkpointId]);

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

  const loadCheckpoint = async () => {
    try {
      setInitialLoading(true);
      const checkpoint = await repository.getCheckpointById(checkpointId);
      if (checkpoint && checkpoint.data) {
        setFormData({
          name: checkpoint.data.name || '',
          description: checkpoint.data.description || '',
          latitude: checkpoint.data.latitude || '',
          longitude: checkpoint.data.longitude || ''
        });
      }
    } catch (error) {
      console.error('Failed to load checkpoint:', error);
      alert('Failed to load checkpoint data');
    } finally {
      setInitialLoading(false);
    }
  };

  const handleChange = (field) => (eventOrValue) => {
    let value;

    // Handle both regular input events and time picker values
    if (eventOrValue && eventOrValue.target) {
      // Regular input field
      value = eventOrValue.target.value;
    } else {
      // Time picker or direct value
      value = eventOrValue;
    }

    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));

    // Clear error for this field if it exists
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: ''
      }));
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

    if (!formData.latitude.trim()) {
      newErrors.latitude = 'Latitude is required';
    }

    if (!formData.longitude.trim()) {
      newErrors.longitude = 'Longitude is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const prepareFormDataForAPI = () => {
    const data = {
      ...formData,
      latitude: Number.parseFloat(formData.latitude),
      longitude: Number.parseFloat(formData.longitude)
    };

    // Make sure we have zone_id
    data.zone_id = zoneId;

    if (!checkpointId) {
      data.radius = 20;
      data.location_type = 'outdoor';
      data.is_active = true;
    }

    return data;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validate()) {
      return;
    }

    try {
      setLoading(true);
      const apiData = prepareFormDataForAPI();

      if (checkpointId) {
        await repository.updateCheckpoint(checkpointId, apiData);
        setShowSuccessModal(true);
      } else {
        const newCheckpoint = await repository.createCheckpoint(apiData);
        setShowSuccessModal(true);
      }
    } catch (error) {
      console.error('Failed to save checkpoint:', error);
      const backendValidationErrors = extractBackendValidationErrors(error);
      if (backendValidationErrors) {
        const normalizedErrors = normalizeValidationErrorsForForm(backendValidationErrors);
        setErrors((prev) => ({ ...prev, ...normalizedErrors }));
      }
      alert('Failed to save checkpoint: ' + extractBackendErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate(`/admin/management-zone/view/${zoneId}`);
  };

  const handleModalClose = () => {
    setShowSuccessModal(false);
    if (checkpointId) {
      navigate(`/admin/management-checkpoint/view/${checkpointId}`);
    } else {
      navigate(`/admin/management-zone/view/${zoneId}`);
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
