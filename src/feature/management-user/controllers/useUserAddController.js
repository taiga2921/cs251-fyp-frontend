import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * useUserAddController
 * -------------------
 * Controller hook dedicated to "Add User" use case.
 */
export const useUserAddController = (repository) => {
   // Navigation handler
   const navigate = useNavigate();

   // Reference to file input (used to manually reset file selection)
   const fileInputRef = useRef(null);

   /**
    * Form state aligned with backend contract for user creation.
    * Password is required here (unlike edit flow).
    */
   const [formData, setFormData] = useState({
      full_name: '',
      username: '',
      phone_number: '',
      email: '',
      address: '',
      role: '',
      password: ''
      // profilePicture: null   // injected dynamically when selected
   });

   const [loading, setLoading] = useState(false);
   const [errors, setErrors] = useState({});
   const [showSuccessModal, setShowSuccessModal] = useState(false);
   const [previewUrl, setPreviewUrl] = useState(null);
   const [newUserId, setNewUserId] = useState(null);

   /**
    * Auto-redirect after successful creation.
    * Shows confirmation briefly before navigating.
    */
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

   /**
    * Generic change handler for controlled inputs.
    * Clears validation error for the field being edited.
    */
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

   /**
    * Handle profile image selection.
    * - Stores file for submission
    * - Generates client-side preview
    */
   const handleImageUpload = (event) => {
      const file = event.target.files[0];

      if (file) {
         const reader = new FileReader();

         reader.onloadend = () => {
            setPreviewUrl(reader.result);
            setFormData({ ...formData, profilePicture: file });
         };

         reader.readAsDataURL(file);
      }
   };

   /**
    * Remove selected image and reset related state.
    */
   const handleRemoveImage = () => {
      setPreviewUrl(null);
      setFormData({ ...formData, profilePicture: null });

      // File inputs cannot be reset via state
      if (fileInputRef.current) {
         fileInputRef.current.value = '';
      }
   };

   /**
    * Client-side validation for user creation.
    * Prevents invalid data from reaching the API.
    */
   const validate = () => {
      const newErrors = {};

      if (!formData.full_name.trim()) {
         newErrors.full_name = 'Name is required';
      }

      if (!formData.username.trim()) {
         newErrors.username = 'Username is required';
      }

      if (!formData.email.trim()) {
         newErrors.email = 'Email is required';
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
         newErrors.email = 'Email is invalid';
      }

      if (!formData.phone_number.trim()) {
         newErrors.phone_number = 'Phone number is required';
      } else if (!/^\d{10,15}$/.test(formData.phone_number.replace(/\D/g, ''))) {
         newErrors.phone_number = 'Phone number must be 10–15 digits';
      }

      if (!formData.address.trim()) {
         newErrors.address = 'Home address is required';
      }

      if (!formData.role.trim()) {
         newErrors.role = 'Role is required';
      }

      if (!formData.password.trim()) {
         newErrors.password = 'Password is required';
      } else if (formData.password.length < 8) {
         newErrors.password = 'Password must be at least 8 characters';
      }

      // Optional stronger password policy (intentionally disabled)
      // else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      //    newErrors.password =
      //       'Password must contain uppercase, lowercase letters and numbers';
      // }

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
   };

   /**
    * Form submission handler.
    * Executes user creation flow.
    */
   const handleSubmit = async (event) => {
      event.preventDefault();

      if (!validate()) {
         return;
      }

      try {
         setLoading(true);

         // Delegate user creation to repository
         const newUser = await repository.createUser(formData);

         // Capture new user ID for redirect
         setNewUserId(newUser.data.id);

         setShowSuccessModal(true);
      } catch (error) {
         console.error('Failed to create user:', error);
         alert('Failed to create user: ' + error.message);
      } finally {
         setLoading(false);
      }
   };

   /**
    * Cancel creation and return to user list.
    */
   const handleCancel = () => {
      navigate('/admin/userManagement');
   };

   /**
    * Close success modal and navigate accordingly.
    */
   const handleModalClose = () => {
      setShowSuccessModal(false);

      if (newUserId) {
         navigate(`/admin/userManagement/view/${newUserId}`);
      } else {
         navigate('/admin/userManagement');
      }
   };

   /**
    * Public API exposed to the UI layer.
    * Keeps UI dumb and controller testable.
    */
   return {
      formData,
      errors,
      loading,
      showSuccessModal,
      previewUrl,
      fileInputRef,
      handleChange,
      handleImageUpload,
      handleRemoveImage,
      handleSubmit,
      handleCancel,
      handleModalClose
   };
};
