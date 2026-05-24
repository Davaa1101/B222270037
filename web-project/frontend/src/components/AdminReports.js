import React, { useEffect, useState } from 'react';
import { adminService } from '../services/adminService';

function AdminReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('pending');
  const [selectedReport, setSelectedReport] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [resolutionStatus, setResolutionStatus] = useState('resolved');

  useEffect(() => {
    loadReports();
  }, [status]);

  const loadReports = async () => {
    try {
      setLoading(true);
      const data = await adminService.getReports({ status });
      setReports(data.reports || []);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateReport = async () => {
    if (!selectedReport) return;

    try {
      await adminService.updateReport(selectedReport._id, {
        status: resolutionStatus,
        adminNotes
      });
      setSelectedReport(null);
      setAdminNotes('');
      await loadReports();
    } catch (err) {
      alert(err.message || 'Failed to update report');
    }
  };

  if (loading) {
    return <div className="container py-5">Loading reports...</div>;
  }

  if (error) {
    return <div className="container py-5 text-danger">{error}</div>;
  }

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1">Admin Тайлан</h2>
          <p className="text-muted mb-0">Системийн гомдол, тайланг энд шалгана.</p>
        </div>
        <select
          className="form-select w-auto"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="pending">Pending</option>
          <option value="investigating">Investigating</option>
          <option value="resolved">Resolved</option>
          <option value="dismissed">Dismissed</option>
        </select>
      </div>

      <div className="table-responsive bg-white rounded shadow-sm">
        <table className="table table-hover mb-0">
          <thead className="table-light">
            <tr>
              <th>Type</th>
              <th>Reported By</th>
              <th>Target</th>
              <th>Status</th>
              <th>Date</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {reports.map((report) => (
              <tr key={report._id}>
                <td>{report.reportType}</td>
                <td>{report.reportedBy?.name || 'Unknown'}</td>
                <td>{report.targetType}</td>
                <td>{report.status}</td>
                <td>{new Date(report.createdAt).toLocaleString()}</td>
                <td>
                  <button
                    className="btn btn-sm btn-primary"
                    onClick={() => {
                      setSelectedReport(report);
                      setAdminNotes(report.adminNotes || '');
                      setResolutionStatus(report.status === 'pending' ? 'investigating' : report.status);
                    }}
                  >
                    Review
                  </button>
                </td>
              </tr>
            ))}
            {reports.length === 0 && (
              <tr>
                <td colSpan="6" className="text-center text-muted py-4">
                  No reports found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selectedReport && (
        <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Review Report</h5>
                <button type="button" className="btn-close" onClick={() => setSelectedReport(null)} />
              </div>
              <div className="modal-body">
                <p><strong>Reason:</strong> {selectedReport.description}</p>
                <label className="form-label">Status</label>
                <select
                  className="form-select mb-3"
                  value={resolutionStatus}
                  onChange={(e) => setResolutionStatus(e.target.value)}
                >
                  <option value="investigating">Investigating</option>
                  <option value="resolved">Resolved</option>
                  <option value="dismissed">Dismissed</option>
                </select>
                <label className="form-label">Admin Notes</label>
                <textarea
                  className="form-control"
                  rows="4"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                />
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setSelectedReport(null)}>
                  Cancel
                </button>
                <button className="btn btn-primary" onClick={handleUpdateReport}>
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminReports;