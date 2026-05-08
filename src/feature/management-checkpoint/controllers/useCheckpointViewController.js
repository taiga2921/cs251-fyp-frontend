import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const useCheckpointViewController = (repository, checkpointId) => {
   const navigate = useNavigate();
   const [checkpoint, setCheckpoint] = useState(null);
   const [loading, setLoading] = useState(true);

   useEffect(() => {
      loadCheckpoint();
   }, [checkpointId]);

   const loadCheckpoint = async () => {
      try {
         setLoading(true);
         const checkpointData = await repository.getCheckpointById(checkpointId);
         console.log(checkpointData.data);
         setCheckpoint(checkpointData);
      } catch (error) {
         console.error('Failed to load checkpoint:', error);
         alert('Failed to load checkpoint data');
      } finally {
         setLoading(false);
      }
   };

   const handleBack = () => {
      navigate(`/admin/management-zone/view/${checkpoint.data.zone.id}`);
   };

   const handleEdit = () => {
      navigate(`/admin/management-checkpoint/edit/${checkpoint.data.zone.id}/${checkpointId}`);
   };

   return {
      checkpoint,
      loading,
      handleBack,
      handleEdit
   };
};
