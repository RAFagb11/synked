// src/components/DeliverableCard.js
import React, { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';

const DeliverableCard = ({ deliverable, inOverview }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [expanded, setExpanded] = useState(false);
  
  // Format date
  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    
    let date;
    if (timestamp.seconds) {
      date = new Date(timestamp.seconds * 1000);
    } else {
      date = new Date(timestamp);
    }
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  // Get status color
  const getStatusColor = () => {
    const dueDate = new Date(deliverable.dueDate.seconds * 1000);
    const now = new Date();
    const diffDays = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));
    
    if (deliverable.completed) {
      return 'var(--success)';
    } else if (diffDays < 0) {
      return 'var(--danger)';
    } else if (diffDays <= 2) {
      return 'var(--warning)';
    } else {
      return 'var(--primary)';
    }
  };
  
  // Get status text
  const getStatusText = () => {
    const dueDate = new Date(deliverable.dueDate.seconds * 1000);
    const now = new Date();
    const diffDays = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));
    
    if (deliverable.completed) {
      return 'Completed';
    } else if (diffDays < 0) {
      return 'Overdue';
    } else if (diffDays === 0) {
      return 'Due Today';
    } else if (diffDays === 1) {
      return 'Due Tomorrow';
    } else {
      return `Due in ${diffDays} days`;
    }
  };
  
  // Handle file selection
  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };
  
  // Handle file upload and submission
  const handleSubmitDeliverable = async () => {
    if (!selectedFile) {
      setSubmitError('Please select a file to submit');
      return;
    }
    
    try {
      setUploading(true);
      setSubmitError('');
      
      // Upload file to Firebase Storage
      const fileRef = ref(storage, `deliverables/${deliverable.id}/${selectedFile.name}`);
      await uploadBytes(fileRef, selectedFile);
      const downloadURL = await getDownloadURL(fileRef);
      
      // Update deliverable document
      await updateDoc(doc(db, 'deliverables', deliverable.id), {
        completed: true,
        submittedAt: new Date(),
        submissionUrl: downloadURL,
        submissionFileName: selectedFile.name
      });
      
      // Refresh the page to show updated status
      window.location.reload();
    } catch (error) {
      console.error('Error submitting deliverable:', error);
      setSubmitError('Failed to submit deliverable: ' + error.message);
      setUploading(false);
    }
  };
  
  return (
    <div style={{ 
      background: 'white', 
      border: `1px solid ${getStatusColor()}20`,
      borderLeft: `4px solid ${getStatusColor()}`,
      borderRadius: '8px', 
      padding: inOverview ? '15px' : '20px',
      boxShadow: '0 4px 8px rgba(0,0,0,0.05)'
    }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start'
      }}>
        <div>
          <h4 style={{ margin: '0 0 5px 0' }}>{deliverable.title}</h4>
          <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
            Due: {formatDate(deliverable.dueDate)}
          </div>
        </div>
        <div style={{ 
          backgroundColor: `${getStatusColor()}20`, 
          color: getStatusColor(),
          padding: '6px 12px',
          borderRadius: '20px',
          fontSize: '14px',
          fontWeight: 'bold'
        }}>
          {getStatusText()}
        </div>
      </div>
      
      {(expanded || !inOverview) && (
        <>
          <div style={{ margin: '15px 0' }}>
            <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{deliverable.description}</p>
          </div>
          
          {deliverable.completed ? (
            <div style={{ 
              marginTop: '15px', 
              padding: '10px 15px', 
              backgroundColor: 'var(--success)10', 
              borderRadius: '8px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <div style={{ fontWeight: 'bold', color: 'var(--success)' }}>Completed on {formatDate(deliverable.submittedAt)}</div>
                {deliverable.submissionFileName && (
                  <div style={{ fontSize: '14px' }}>File: {deliverable.submissionFileName}</div>
                )}
              </div>
              {deliverable.submissionUrl && (
                <a 
                  href={deliverable.submissionUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-outline"
                  style={{ padding: '6px 12px', fontSize: '14px' }}
                >
                  Download
                </a>
              )}
            </div>
          ) : (
            <div style={{ marginTop: '15px' }}>
              <div style={{ 
                border: '1px dashed #ddd', 
                borderRadius: '8px', 
                padding: '15px', 
                marginBottom: '10px'
              }}>
                <input
                  type="file"
                  onChange={handleFileChange}
                  style={{ width: '100%' }}
                />
              </div>
              
              {submitError && (
                <div style={{ color: 'var(--danger)', marginBottom: '10px', fontSize: '14px' }}>
                  {submitError}
                </div>
              )}
              
              <button 
                onClick={handleSubmitDeliverable}
                disabled={!selectedFile || uploading}
                className="btn btn-primary"
                style={{ width: '100%' }}
              >
                {uploading ? 'Uploading...' : 'Submit Deliverable'}
              </button>
            </div>
          )}
        </>
      )}
      
      {inOverview && (
        <div style={{ marginTop: '10px', textAlign: 'center' }}>
          <button
            onClick={() => setExpanded(!expanded)}
            style={{ 
              background: 'none', 
              border: 'none', 
              color: 'var(--primary)', 
              cursor: 'pointer',
              fontSize: '14px',
              padding: '5px'
            }}
          >
            {expanded ? 'Show Less' : 'Show More'}
          </button>
        </div>
      )}
    </div>
  );
};

export default DeliverableCard;