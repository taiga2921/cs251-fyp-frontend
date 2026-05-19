import { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { DEFAULT_MAP_CENTER, RECOMMENDED_RADIUS } from '../utils/checkpointConstants';
import {
  buildCheckpointPayload,
  extractBackendErrorMessage,
  extractBackendValidationErrors,
  normalizeValidationErrorsForForm,
  validateCheckpointForm
} from '../utils/checkpointValidation';

const defaultFormData = (zoneId = '') => ({
  zone_id: zoneId,
  name: '',
  latitude: '',
  longitude: '',
  radius: RECOMMENDED_RADIUS.outdoor,
  location_type: 'outdoor',
  is_active: true
});

export const useCheckpointFormController = (repository, checkpointId = null) => {
  const navigate = useNavigate();
  const location = useLocation();
  const initialZoneId = location.state?.zoneId ?? '';

  const isEdit = Boolean(checkpointId);
  const [formData, setFormData] = useState(() => defaultFormData(initialZoneId));
  const [zones, setZones] = useState([]);
  const [zonesLoading, setZonesLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEdit);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [savedCheckpointId, setSavedCheckpointId] = useState(null);

  const noZones = !zonesLoading && zones.length === 0;

  const loadZones = useCallback(async () => {
    try {
      setZonesLoading(true);
      const payload = await repository.getZones();
      setZones(repository.normalizeZonesList(payload));
    } catch (err) {
      console.error('Failed to load zones:', err);
      setSubmitError(err?.message || 'Failed to load zones.');
    } finally {
      setZonesLoading(false);
    }
  }, [repository]);

  const loadCheckpoint = useCallback(async () => {
    if (!checkpointId) return;
    try {
      setInitialLoading(true);
      const response = await repository.getCheckpointById(checkpointId);
      const cp = response?.data ?? response;
      if (!cp) return;

      setFormData({
        zone_id: cp.zone_id ?? '',
        name: cp.name ?? '',
        latitude: cp.latitude ?? '',
        longitude: cp.longitude ?? '',
        radius: cp.radius ?? RECOMMENDED_RADIUS.outdoor,
        location_type: cp.location_type ?? 'outdoor',
        is_active: cp.is_active !== false
      });
    } catch (err) {
      console.error('Failed to load checkpoint:', err);
      setSubmitError(err?.message || 'Failed to load checkpoint.');
    } finally {
      setInitialLoading(false);
    }
  }, [repository, checkpointId]);

  useEffect(() => {
    loadZones();
  }, [loadZones]);

  useEffect(() => {
    if (isEdit) {
      loadCheckpoint();
    }
  }, [isEdit, loadCheckpoint]);

  useEffect(() => {
    let timer;
    if (showSuccessModal) {
      timer = setTimeout(() => handleModalClose(), 2000);
    }
    return () => timer && clearTimeout(timer);
  }, [showSuccessModal]);

  const handleChange = (field) => (eventOrValue) => {
    let value = eventOrValue?.target !== undefined ? eventOrValue.target.value : eventOrValue;

    if (field === 'is_active' && eventOrValue?.target) {
      value = eventOrValue.target.checked;
    }

    setFormData((prev) => {
      const next = { ...prev, [field]: value };

      if (field === 'location_type' && !isEdit) {
        next.radius = RECOMMENDED_RADIUS[value] ?? prev.radius;
      }

      return next;
    });

    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
    setSubmitError('');
  };

  const handleCoordinatesChange = ({ latitude, longitude }) => {
    setFormData((prev) => ({
      ...prev,
      latitude: latitude ?? prev.latitude,
      longitude: longitude ?? prev.longitude
    }));
    setErrors((prev) => ({ ...prev, latitude: '', longitude: '' }));
  };

  const handleApplyRecommendedRadius = () => {
    const recommended = RECOMMENDED_RADIUS[formData.location_type] ?? RECOMMENDED_RADIUS.outdoor;
    setFormData((prev) => ({ ...prev, radius: recommended }));
    if (errors.radius) {
      setErrors((prev) => ({ ...prev, radius: '' }));
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitError('');

    const { errors: validationErrors, isValid } = validateCheckpointForm(formData, { isEdit });
    if (!isValid) {
      setErrors(validationErrors);
      return;
    }

    if (noZones) {
      setSubmitError('Create at least one zone before adding checkpoints.');
      return;
    }

    try {
      setLoading(true);
      const payload = buildCheckpointPayload(formData);

      if (isEdit) {
        await repository.updateCheckpoint(checkpointId, payload);
        setSavedCheckpointId(checkpointId);
      } else {
        const response = await repository.createCheckpoint(payload);
        const created = response?.data ?? response;
        setSavedCheckpointId(created?.id ?? null);
      }

      setShowSuccessModal(true);
    } catch (err) {
      console.error('Failed to save checkpoint:', err);
      const backendValidationErrors = extractBackendValidationErrors(err);
      if (backendValidationErrors) {
        setErrors((prev) => ({ ...prev, ...normalizeValidationErrorsForForm(backendValidationErrors) }));
      }
      setSubmitError(extractBackendErrorMessage(err, 'Failed to save checkpoint.'));
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/admin/management-checkpoint');
  };

  const handleModalClose = () => {
    setShowSuccessModal(false);
    if (savedCheckpointId) {
      navigate(`/admin/management-checkpoint/${savedCheckpointId}`);
      return;
    }
    navigate('/admin/management-checkpoint');
  };

  const mapLatitude =
    formData.latitude === '' || formData.latitude == null
      ? DEFAULT_MAP_CENTER.latitude
      : Number(formData.latitude);
  const mapLongitude =
    formData.longitude === '' || formData.longitude == null
      ? DEFAULT_MAP_CENTER.longitude
      : Number(formData.longitude);

  return {
    formData,
    errors,
    loading,
    initialLoading,
    submitError,
    zones,
    zonesLoading,
    noZones,
    isEdit,
    showSuccessModal,
    mapLatitude,
    mapLongitude,
    handleChange,
    handleCoordinatesChange,
    handleApplyRecommendedRadius,
    handleSubmit,
    handleCancel,
    handleModalClose
  };
};
