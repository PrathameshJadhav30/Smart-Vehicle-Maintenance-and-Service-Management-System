import {
  createJobCard,
  getAllJobCards,
  getCompletedJobCards,
  getJobCardById,
  getJobCardByBookingId,
  getJobCardNotes,
  addTaskToJobCard,
  assignMechanicToJobCard,
  addSparePartToJobCard,
  updateJobCardStatus,
  updateJobCardProgress,
  deleteJobCard,
  getMechanicJobCards,
  completeJobCard
} from '../../services/jobcardService';
import api from '../../services/api';

// Mock the api module
vi.mock('../../services/api');

// Mock window.dispatchEvent
const mockDispatchEvent = vi.spyOn(window, 'dispatchEvent').mockImplementation(() => {});

describe('jobcardService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    mockDispatchEvent.mockClear();
  });

  describe('createJobCard', () => {
    test('should call api.post with correct endpoint and data', async () => {
      const jobCardData = { title: 'Engine Repair', vehicleId: '123' };
      const mockResponse = { id: '1', ...jobCardData };
      api.post.mockResolvedValue({ data: mockResponse });

      const result = await createJobCard(jobCardData);

      expect(api.post).toHaveBeenCalledWith('/jobcards', jobCardData);
      expect(result).toEqual(mockResponse);
    });

    test('should handle API errors gracefully', async () => {
      const jobCardData = { title: 'Engine Repair', vehicleId: '123' };
      const mockError = new Error('Network error');
      api.post.mockRejectedValue(mockError);

      await expect(createJobCard(jobCardData)).rejects.toThrow('Network error');
    });
  });

  describe('getAllJobCards', () => {
    test('should call api.get with correct endpoint and return jobcards array', async () => {
      const mockResponse = { jobcards: [{ id: '1', title: 'Engine Repair' }], pagination: { page: 1, limit: 10, total: 1 } };
      api.get.mockResolvedValue({ data: mockResponse });

      const result = await getAllJobCards();

      expect(api.get).toHaveBeenCalledWith('/jobcards?page=1&limit=10');
      expect(result).toEqual(mockResponse);
    });

    test('should return empty array when no jobcards in response', async () => {
      const mockResponse = {};
      api.get.mockResolvedValue({ data: mockResponse });

      const result = await getAllJobCards();

      expect(result).toEqual({});
    });

    test('should handle API errors gracefully', async () => {
      const mockError = new Error('Network error');
      api.get.mockRejectedValue(mockError);

      await expect(getAllJobCards()).rejects.toThrow('Network error');
    });
  });

  describe('getCompletedJobCards', () => {
    test('should call api.get with correct endpoint and return jobcards array', async () => {
      const mockResponse = { jobcards: [{ id: '1', title: 'Engine Repair', status: 'completed' }], pagination: { page: 1, limit: 10, total: 1 } };
      api.get.mockResolvedValue({ data: mockResponse });

      const result = await getCompletedJobCards();

      expect(api.get).toHaveBeenCalledWith('/jobcards/completed?page=1&limit=10');
      expect(result).toEqual(mockResponse);
    });

    test('should return empty array when no jobcards in response', async () => {
      const mockResponse = {};
      api.get.mockResolvedValue({ data: mockResponse });

      const result = await getCompletedJobCards();

      expect(result).toEqual({});
    });

    test('should handle API errors gracefully', async () => {
      const mockError = new Error('Network error');
      api.get.mockRejectedValue(mockError);

      await expect(getCompletedJobCards()).rejects.toThrow('Network error');
    });
  });

  describe('getJobCardById', () => {
    test('should call api.get with correct endpoint and return data', async () => {
      const jobCardId = '123';
      const mockResponse = { id: jobCardId, title: 'Engine Repair' };
      api.get.mockResolvedValue({ data: mockResponse });

      const result = await getJobCardById(jobCardId);

      expect(api.get).toHaveBeenCalledWith(`/jobcards/${jobCardId}`);
      expect(result).toEqual(mockResponse);
    });

    test('should handle API errors gracefully', async () => {
      const jobCardId = '123';
      const mockError = new Error('Network error');
      api.get.mockRejectedValue(mockError);

      await expect(getJobCardById(jobCardId)).rejects.toThrow('Network error');
    });
  });

  describe('getJobCardByBookingId', () => {
    test('should call api.get with correct endpoint and return data', async () => {
      const bookingId = '456';
      const mockResponse = { id: '123', bookingId, title: 'Engine Repair' };
      api.get.mockResolvedValue({ data: mockResponse });

      const result = await getJobCardByBookingId(bookingId);

      expect(api.get).toHaveBeenCalledWith(`/jobcards/booking/${bookingId}`);
      expect(result).toEqual(mockResponse);
    });

    test('should handle API errors gracefully', async () => {
      const bookingId = '456';
      const mockError = new Error('Network error');
      api.get.mockRejectedValue(mockError);

      await expect(getJobCardByBookingId(bookingId)).rejects.toThrow('Network error');
    });
  });

  describe('getJobCardNotes', () => {
    test('should call api.get with correct endpoint and return data', async () => {
      const jobCardId = '123';
      const mockResponse = [{ id: '1', content: 'Check engine oil' }];
      api.get.mockResolvedValue({ data: mockResponse });

      const result = await getJobCardNotes(jobCardId);

      expect(api.get).toHaveBeenCalledWith(`/jobcards/${jobCardId}/notes`);
      expect(result).toEqual(mockResponse);
    });

    test('should handle API errors gracefully', async () => {
      const jobCardId = '123';
      const mockError = new Error('Network error');
      api.get.mockRejectedValue(mockError);

      await expect(getJobCardNotes(jobCardId)).rejects.toThrow('Network error');
    });
  });

  describe('updateJobCardStatus', () => {
    test('should call api.put with correct endpoint and data', async () => {
      const jobCardId = '123';
      const statusData = { status: 'in_progress' };
      const mockResponse = { id: jobCardId, status: 'in_progress' };
      api.put.mockResolvedValue({ data: mockResponse });

      const result = await updateJobCardStatus(jobCardId, statusData);

      expect(api.put).toHaveBeenCalledWith(`/jobcards/${jobCardId}/update-status`, statusData);
      expect(result).toEqual(mockResponse);
    });

    test('should handle API errors gracefully', async () => {
      const jobCardId = '123';
      const statusData = { status: 'in_progress' };
      const mockError = new Error('Network error');
      api.put.mockRejectedValue(mockError);

      await expect(updateJobCardStatus(jobCardId, statusData)).rejects.toThrow('Network error');
    });
  });

  describe('addTaskToJobCard', () => {
    test('should call api.put with correct endpoint and data', async () => {
      const jobCardId = '123';
      const taskData = { task_name: 'Oil Change', task_cost: 50 };
      const mockResponse = { id: jobCardId, tasks: [taskData] };
      api.put.mockResolvedValue({ data: mockResponse });

      const result = await addTaskToJobCard(jobCardId, taskData);

      expect(api.put).toHaveBeenCalledWith(`/jobcards/${jobCardId}/add-task`, taskData);
      expect(result).toEqual(mockResponse);
    });

    test('should throw error when jobCardId is missing', async () => {
      const taskData = { task_name: 'Oil Change', task_cost: 50 };

      await expect(addTaskToJobCard(null, taskData)).rejects.toThrow('Job card ID is required');
    });

    test('should throw error when task data is invalid', async () => {
      const jobCardId = '123';
      const taskData = { task_name: '', task_cost: 0 };

      await expect(addTaskToJobCard(jobCardId, taskData)).rejects.toThrow('Task name and cost are required');
    });

    test('should handle API errors gracefully', async () => {
      const jobCardId = '123';
      const taskData = { task_name: 'Oil Change', task_cost: 50 };
      const mockError = new Error('Network error');
      api.put.mockRejectedValue(mockError);

      await expect(addTaskToJobCard(jobCardId, taskData)).rejects.toThrow('Network error');
    });
  });

  describe('assignMechanicToJobCard', () => {
    test('should call api.put with correct endpoint and data', async () => {
      const jobCardId = '123';
      const mechanicData = { mechanicId: '456' };
      const mockResponse = { id: jobCardId, mechanicId: '456' };
      api.put.mockResolvedValue({ data: mockResponse });

      const result = await assignMechanicToJobCard(jobCardId, mechanicData);

      expect(api.put).toHaveBeenCalledWith(`/jobcards/${jobCardId}/add-mechanic`, mechanicData);
      expect(result).toEqual(mockResponse);
    });

    test('should handle API errors gracefully', async () => {
      const jobCardId = '123';
      const mechanicData = { mechanicId: '456' };
      const mockError = new Error('Network error');
      api.put.mockRejectedValue(mockError);

      await expect(assignMechanicToJobCard(jobCardId, mechanicData)).rejects.toThrow('Network error');
    });
  });

  describe('addSparePartToJobCard', () => {
    test('should call api.put with correct endpoint and data', async () => {
      const jobCardId = '123';
      const partData = { part_id: '789', quantity: 2 };
      const mockResponse = { id: jobCardId, parts: [partData] };
      api.put.mockResolvedValue({ data: mockResponse });

      const result = await addSparePartToJobCard(jobCardId, partData);

      expect(api.put).toHaveBeenCalledWith(`/jobcards/${jobCardId}/add-sparepart`, partData);
      expect(result).toEqual(mockResponse);
    });

    test('should dispatch sparePartAdded event after successful addition', async () => {
      const jobCardId = '123';
      const partData = { part_id: '789', quantity: 2 };
      const mockResponse = { id: jobCardId, parts: [partData] };
      api.put.mockResolvedValue({ data: mockResponse });

      await addSparePartToJobCard(jobCardId, partData);

      expect(mockDispatchEvent).toHaveBeenCalledWith(expect.objectContaining({
        type: 'sparePartAdded'
      }));
    });

    test('should throw error when jobCardId is missing', async () => {
      const partData = { part_id: '789', quantity: 2 };

      await expect(addSparePartToJobCard(null, partData)).rejects.toThrow('Job card ID is required');
    });

    test('should throw error when part data is invalid', async () => {
      const jobCardId = '123';
      const partData = { part_id: '', quantity: 0 };

      await expect(addSparePartToJobCard(jobCardId, partData)).rejects.toThrow('Part ID and quantity are required');
    });

    test('should handle API errors gracefully', async () => {
      const jobCardId = '123';
      const partData = { part_id: '789', quantity: 2 };
      const mockError = new Error('Network error');
      api.put.mockRejectedValue(mockError);

      await expect(addSparePartToJobCard(jobCardId, partData)).rejects.toThrow('Network error');
    });
  });

  describe('updateJobCardProgress', () => {
    test('should call api.put with correct endpoint and data', async () => {
      const jobCardId = '123';
      const progressData = { progress: 50 };
      const mockResponse = { id: jobCardId, progress: 50 };
      api.put.mockResolvedValue({ data: mockResponse });

      const result = await updateJobCardProgress(jobCardId, progressData);

      expect(api.put).toHaveBeenCalledWith(`/jobcards/${jobCardId}/update-progress`, progressData);
      expect(result).toEqual(mockResponse);
    });

    test('should dispatch jobCardProgressUpdated event after successful update', async () => {
      const jobCardId = '123';
      const progressData = { progress: 50 };
      const mockResponse = { id: jobCardId, progress: 50 };
      api.put.mockResolvedValue({ data: mockResponse });

      await updateJobCardProgress(jobCardId, progressData);

      expect(mockDispatchEvent).toHaveBeenCalledWith(expect.objectContaining({
        type: 'jobCardProgressUpdated'
      }));
    });

    test('should handle API errors gracefully', async () => {
      const jobCardId = '123';
      const progressData = { progress: 50 };
      const mockError = new Error('Network error');
      api.put.mockRejectedValue(mockError);

      await expect(updateJobCardProgress(jobCardId, progressData)).rejects.toThrow('Network error');
    });
  });

  describe('completeJobCard', () => {
    test('should call api.put with correct endpoint and data', async () => {
      const jobCardId = '123';
      const completionData = { notes: 'Work completed successfully' };
      const mockResponse = { id: jobCardId, status: 'completed' };
      api.put.mockResolvedValue({ data: mockResponse });

      const result = await completeJobCard(jobCardId, completionData);

      expect(api.put).toHaveBeenCalledWith(`/jobcards/${jobCardId}/complete`, completionData);
      expect(result).toEqual(mockResponse);
    });

    test('should dispatch jobCardCompleted event after successful completion', async () => {
      const jobCardId = '123';
      const completionData = { notes: 'Work completed successfully' };
      const mockResponse = { id: jobCardId, status: 'completed' };
      api.put.mockResolvedValue({ data: mockResponse });

      await completeJobCard(jobCardId, completionData);

      expect(mockDispatchEvent).toHaveBeenCalledWith(expect.objectContaining({
        type: 'jobCardCompleted'
      }));
    });

    test('should handle API errors gracefully', async () => {
      const jobCardId = '123';
      const completionData = { notes: 'Work completed successfully' };
      const mockError = new Error('Network error');
      api.put.mockRejectedValue(mockError);

      await expect(completeJobCard(jobCardId, completionData)).rejects.toThrow('Network error');
    });
  });

  describe('deleteJobCard', () => {
    test('should call api.delete with correct endpoint and return data', async () => {
      const jobCardId = '123';
      const mockResponse = { message: 'Job card deleted successfully' };
      api.delete.mockResolvedValue({ data: mockResponse });

      const result = await deleteJobCard(jobCardId);

      expect(api.delete).toHaveBeenCalledWith(`/jobcards/${jobCardId}`);
      expect(result).toEqual(mockResponse);
    });

    test('should handle API errors gracefully', async () => {
      const jobCardId = '123';
      const mockError = new Error('Network error');
      api.delete.mockRejectedValue(mockError);

      await expect(deleteJobCard(jobCardId)).rejects.toThrow('Network error');
    });
  });

  describe('getMechanicJobCards', () => {
    test('should call api.get with correct endpoint and return jobcards array', async () => {
      const mechanicId = '456';
      const mockResponse = { jobcards: [{ id: '1', mechanicId, title: 'Engine Repair' }], pagination: { page: 1, limit: 10, total: 1 } };
      api.get.mockResolvedValue({ data: mockResponse });

      const result = await getMechanicJobCards(mechanicId);

      expect(api.get).toHaveBeenCalledWith(`/jobcards/mechanic/${mechanicId}?page=1&limit=10`);
      expect(result).toEqual(mockResponse);
    });

    test('should return empty array when no jobcards in response', async () => {
      const mechanicId = '456';
      const mockResponse = {};
      api.get.mockResolvedValue({ data: mockResponse });

      const result = await getMechanicJobCards(mechanicId);

      expect(result).toEqual({});
    });

    test('should return empty array when API call fails', async () => {
      const mechanicId = '456';
      const mockError = new Error('Network error');
      api.get.mockRejectedValue(mockError);

      const result = await getMechanicJobCards(mechanicId);

      expect(result).toEqual([]);
    });
  });
});