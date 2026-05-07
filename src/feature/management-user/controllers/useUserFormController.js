import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * useUserFormController
 * --------------------
 * Controller hook for Edit User forms.
 */
export const useUserFormController = (repository, userId = null) => {
   // Navigation handler
   const navigate = useNavigate();

   // Reference to file input element (used to reset file selection)
   const fileInputRef = useRef(null);

   /**
    * Form state.
    * This structure matches backend expectations,
    * not UI component structure.
    */
   const [formData, setFormData] = useState({
      full_name: '',
      username: '',
      phone_number: '',
      email: '',
      address: '',
      role: ''
      // password: ''            // intentionally excluded for edit mode
      // profilePicture: null     // added dynamically when image selected
   });

   const [loading, setLoading] = useState(false);
   const [initialLoading, setInitialLoading] = useState(!!userId);
   const [errors, setErrors] = useState({});
   const [showSuccessModal, setShowSuccessModal] = useState(false);
   const [previewUrl, setPreviewUrl] = useState(null);

   /**
    * Load existing user data when editing.
    * This effect does NOT run in create mode.
    */
   useEffect(() => {
      if (userId) {
         loadUser();
      }
   }, [userId]);

   /**
    * Auto-redirect after successful save.
    * Modal is shown briefly, then user is redirected.
    * Cleanup prevents memory leaks if component unmounts.
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
    * Fetch user data for edit mode and populate form.
    */
   const loadUser = async () => {
      try {
         setInitialLoading(true);

         const user = await repository.getUserById(userId);

         if (user) {
            setFormData({
               full_name: user.data.full_name,
               phone_number: user.data.phone_number,
               username: user.data.username,
               email: user.data.email,
               address: user.data.address,
               role: user.data.role
            });
         }
      } catch (error) {
         console.error('Failed to load user:', error);
         alert('Failed to load user data');
      } finally {
         setInitialLoading(false);
      }
   };

   /**
    * Generic change handler for text inputs.
    * Clears field-specific validation error on change.
    */
   const handleChange = (field) => (event) => {
      setFormData({
         ...formData,
         [field]: event.target.value
      });

      // Clear validation error once user starts correcting input
      if (errors[field]) {
         setErrors({
            ...errors,
            [field]: ''
         });
      }
   };

   /**
    * Handle profile image upload.
    * - Stores the file for submission
    * - Generates a local preview without uploading
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
    * Remove selected image and reset input state.
    */
   const handleRemoveImage = () => {
      setPreviewUrl(null);
      setFormData({ ...formData, profilePicture: null });

      // Clear file input value manually (browser limitation)
      if (fileInputRef.current) {
         fileInputRef.current.value = '';
      }
   };

   /**
    * Client-side validation.
    * Prevents unnecessary API calls with invalid data.
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

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
   };

   /**
    * Form submission handler.
    * Decides between CREATE and UPDATE based on presence of userId.
    */
   const handleSubmit = async (event) => {
      event.preventDefault();

      if (!validate()) {
         return;
      }

      try {
         setLoading(true);

         if (userId) {
            await repository.updateUser(userId, formData);
         } else {
            await repository.createUser(formData);
         }

         setShowSuccessModal(true);
      } catch (error) {
         console.error('Failed to save user:', error);
         alert('Failed to save user: ' + error.message);
      } finally {
         setLoading(false);
      }
   };

   /**
    * Cancel form and return to user list.
    */
   const handleCancel = () => {
      navigate('/admin/userManagement');
   };

   /**
    * Close success modal and redirect appropriately.
    */
   const handleModalClose = () => {
      setShowSuccessModal(false);

      if (userId) {
         navigate(`/admin/userManagement/view/${userId}`);
      } else {
         navigate('/admin/userManagement');
      }
   };

   /**
    * Public API exposed to the UI layer.
    */
   return {
      formData,
      errors,
      loading,
      initialLoading,
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
