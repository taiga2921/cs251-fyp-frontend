import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * useUserViewController
 * ---------------------
 * Controller hook for the User View page.
 */
export const useUserViewController = (repository, userId) => {
  // Navigation handler from React Router
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  /**
   * Side effect:
   * Fetch user data when:
   * - The component mounts
   * - The userId changes (route param update)
   */
  useEffect(() => {
    loadUser();
  }, [userId]);

  /**
   * Fetch a single user by ID from the repository.
   */
  const loadUser = async () => {
    try {
      setLoading(true);

      // Delegate data access to repository (abstraction over API)
      const userData = await repository.getUserById(userId);
      // Store result in controller state
      setUser(userData);
    } catch (error) {
      // Log for developers
      console.error('Failed to load user:', error);

      // Crude but explicit user feedback (can be improved later)
      alert('Failed to load user data');
    } finally {
      // Always stop loading, success or failure
      setLoading(false);
    }
  };

  /**
   * Navigate back to the user management list
   */
  const handleBack = () => {
    navigate('/admin/management-user');
  };

  /**
   * Navigate to edit page for the current user
   */
  const handleEdit = () => {
    navigate(`/admin/management-user/edit/${userId}`);
  };

  /**
   * Public API exposed to the View
   * Only what the UI needs—nothing more
   */
  return {
    user,
    loading,
    handleBack,
    handleEdit
  };
};
