import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

export const useZoneAddController = (repository) => {
   const navigate = useNavigate();
   const fileInputRef = useRef(null);

   const [formData, setFormData] = useState({
      name: '',
      code: '',
      description: '',
      zone_type: '',
      priority_level: '',
      center_latitude: '',
      center_longitude: ''
   });

   const [loading, setLoading] = useState(false);
   const [errors, setErrors] = useState({});
   const [showSuccessModal, setShowSuccessModal] = useState(false);
   const [newZoneId, setNewZoneId] = useState(null);

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

      if (!formData.code.trim()) {
         newErrors.code = 'Code is required';
      }

      if (!formData.description.trim()) {
         newErrors.description = 'Description is required';
      }

      if (!formData.zone_type.trim()) {
         newErrors.zone_type = 'Zone type is required';
      }

      if (!formData.priority_level.trim()) {
         newErrors.priority_level = 'Priority level is required';
      }

      if (!formData.center_latitude.trim()) {
         newErrors.center_latitude = 'Latitude is required';
      }

      if (!formData.center_longitude.trim()) {
         newErrors.center_longitude = 'Longitude is required';
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
         const newZone = await repository.createZone(formData);
         setNewZoneId(newZone.data.id);
         setShowSuccessModal(true);
      } catch (error) {
         console.error('Failed to create zone:', error);
         alert('Failed to create zone: ' + error.message);
      } finally {
         setLoading(false);
      }
   };

   const handleCancel = () => {
      navigate('/admin/zoneManagement');
   };

   const handleModalClose = () => {
      setShowSuccessModal(false);
      if (newZoneId) {
         navigate(`/admin/zoneManagement/view/${newZoneId}`);
      } else {
         navigate('/admin/zoneManagement');
      }
      // navigate('/admin/zoneManagement');
   };

   return {
      formData,
      errors,
      loading,
      showSuccessModal,
      fileInputRef,
      handleChange,
      handleSubmit,
      handleCancel,
      handleModalClose
   };
};
