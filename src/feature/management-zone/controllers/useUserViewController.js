import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const useUserViewController = (repository, userId) => {
   const navigate = useNavigate();
   const [user, setUser] = useState(null);
   const [loading, setLoading] = useState(true);

   useEffect(() => {
      loadUser();
   }, [userId]);

   const loadUser = async () => {
      try {
         setLoading(true);
         const userData = await repository.getUserById(userId);
         setUser(userData);
      } catch (error) {
         console.error('Failed to load user:', error);
         alert('Failed to load user data');
      } finally {
         setLoading(false);
      }
   };

   const handleBack = () => {
      navigate('/admin/user-management');
   };

   const handleEdit = () => {
      navigate(`/admin/user-management/edit/${userId}`);
   };

   return {
      user,
      loading,
      handleBack,
      handleEdit
   };
};
