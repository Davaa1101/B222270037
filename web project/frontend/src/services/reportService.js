import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_BASE || '/api';

export const reportService = {
  // Create a new report
  createReport: async (reportData, evidenceFiles) => {
    const formData = new FormData();
    
    formData.append('reportType', reportData.reportType);
    formData.append('targetType', reportData.targetType);
    formData.append('targetId', reportData.targetId);
    formData.append('description', reportData.description);
    
    if (reportData.chatHistory) {
      formData.append('chatHistory', reportData.chatHistory);
    }
    
    // Add evidence files
    if (evidenceFiles && evidenceFiles.length > 0) {
      evidenceFiles.forEach(file => {
        formData.append('evidence', file);
      });
    }

    const response = await axios.post(`${API_BASE}/reports`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response.data;
  },

  // Get user's reports
  getMyReports: async (status = '', page = 1, limit = 20) => {
    const params = { page, limit };
    if (status) params.status = status;
    
    const response = await axios.get(`${API_BASE}/reports/my-reports`, {
      params,
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response.data;
  },

  // Get report details
  getReport: async (reportId) => {
    const response = await axios.get(`${API_BASE}/reports/${reportId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response.data;
  }
};
