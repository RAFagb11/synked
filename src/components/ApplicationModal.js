// src/components/ApplicationModal.js
import React, { useState, useEffect } from 'react';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { getStudentProfile } from '../services/profileService';
import { updateApplicationStatus } from '../services/applicationService';

const ApplicationModal = ({ application, isOpen, onClose, onUpdate }) => {
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(application.status); // SIMPLE ACCESS
  const [feedback, setFeedback] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const fetchStudentProfile = async () => {
      try {
        const studentData = await getStudentProfile(application.studentId); // SIMPLE ACCESS
        setStudent(studentData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching student:', error);
        setLoading(false);
      }
    };

    if (application.studentId) {
      fetchStudentProfile();
    }
  }, [application.studentId]);

  const handleStatusUpdate = async () => {
    setUpdating(true);
    try {
      await updateApplicationStatus(application.id, status, feedback);
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error updating application:', error);
      alert('Failed to update application');
    } finally {
      setUpdating(false);
    }
  };
  

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '16px',
        width: '90%',
        maxWidth: '800px',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        <h2 style={{ marginBottom: '20px' }}>Application Details</h2>
        
        {loading ? (
          <p>Loading student information...</p>
        ) : student ? (
          <div style={{ marginBottom: '30px' }}>
            <h3>Student Information</h3>
            <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', marginTop: '10px' }}>
              <p><strong>Name:</strong> {student.fullName}</p>
              <p><strong>Email:</strong> {student.email}</p>
              <p><strong>Education:</strong> {student.education}</p>
              <div style={{ marginTop: '10px' }}>
                <strong>Skills:</strong>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '5px' }}>
                  {student.skills?.map(skill => (
                    <span key={skill} className="feature-badge" style={{ fontSize: '12px' }}>{skill}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <p>Student information not available</p>
        )}

        <div style={{ marginBottom: '30px' }}>
          <h3>Application Details</h3>
          <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', marginTop: '10px' }}>
            <p><strong>Project:</strong> {application.projectTitle}</p>
            <p><strong>Applied on:</strong> {new Date(application.appliedAt).toLocaleDateString()}</p>
            <p><strong>Cover Letter:</strong></p>
            <p style={{ whiteSpace: 'pre-wrap', marginTop: '5px' }}>{application.coverLetter}</p>
            
            {application.applicationAnswer && (
              <>
                <p style={{ marginTop: '15px' }}><strong>Application Answer:</strong></p>
                <p style={{ whiteSpace: 'pre-wrap', marginTop: '5px' }}>{application.applicationAnswer}</p>
              </>
            )}
            
            <p style={{ marginTop: '15px' }}><strong>Availability:</strong> {application.availability}</p>
          </div>
        </div>

        {application.videoUrl && (
          <div style={{ marginBottom: '30px' }}>
            <h3>Video Introduction</h3>
            <video 
              controls 
              style={{ width: '100%', borderRadius: '8px', marginTop: '10px' }}
              src={application.videoUrl}
            >
              Your browser does not support the video tag.
            </video>
          </div>
        )}

        <div style={{ marginBottom: '30px' }}>
          <h3>Update Status</h3>
          <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              style={{ padding: '8px', borderRadius: '8px', border: '1px solid #ddd', flex: '1' }}
            >
              <option value="pending">Pending</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          
          <textarea
            placeholder="Add feedback for the student (optional)"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            style={{ 
              width: '100%', 
              padding: '12px', 
              borderRadius: '8px', 
              border: '1px solid #ddd', 
              marginTop: '15px',
              minHeight: '100px'
            }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '15px' }}>
          <button 
            onClick={onClose}
            className="btn btn-outline"
            style={{ padding: '10px 20px' }}
          >
            Close
          </button>
          <button 
            onClick={handleStatusUpdate}
            disabled={updating}
            className="btn btn-primary"
            style={{ padding: '10px 20px' }}
          >
            {updating ? 'Updating...' : 'Update Status'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApplicationModal;