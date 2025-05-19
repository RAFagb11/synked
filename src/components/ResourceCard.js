// src/components/ResourceCard.js
import React, { useState } from 'react';

const ResourceCard = ({ resource }) => {
  const [previewOpen, setPreviewOpen] = useState(false);
  
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
  
  // Determine icon based on file type
  const getFileIcon = () => {
    if (!resource.fileType) return '📄';
    
    const type = resource.fileType.toLowerCase();
    
    if (type.includes('pdf')) return '📕';
    if (type.includes('word') || type.includes('doc')) return '📘';
    if (type.includes('excel') || type.includes('sheet') || type.includes('csv')) return '📊';
    if (type.includes('ppt') || type.includes('presentation')) return '📊';
    if (type.includes('image') || type.includes('png') || type.includes('jpg') || type.includes('jpeg')) return '🖼️';
    if (type.includes('video') || type.includes('mp4')) return '🎬';
    if (type.includes('audio') || type.includes('mp3')) return '🎵';
    if (type.includes('zip') || type.includes('rar')) return '🗂️';
    if (type.includes('html') || type.includes('css') || type.includes('js')) return '💻';
    
    // If it's a URL
    if (resource.resourceType === 'link') return '🔗';
    
    return '📄';
  };
  
  // Handle resource click based on type
  const handleResourceClick = () => {
    if (resource.resourceType === 'link') {
      window.open(resource.url, '_blank');
    } else if (resource.resourceType === 'file' && resource.fileUrl) {
      // If it's a previewable file type, show preview, otherwise download
      const isPreviewable = 
        resource.fileType && 
        (resource.fileType.includes('pdf') || 
         resource.fileType.includes('image') ||
         resource.fileType.includes('video') ||
         resource.fileType.includes('audio'));
         
      if (isPreviewable) {
        setPreviewOpen(true);
      } else {
        window.open(resource.fileUrl, '_blank');
      }
    }
  };
  
  // Close preview
  const closePreview = () => {
    setPreviewOpen(false);
  };
  
  // Render preview content
  const renderPreview = () => {
    if (!resource.fileUrl) return null;
    
    const type = resource.fileType.toLowerCase();
    
    if (type.includes('pdf')) {
      return (
        <iframe 
          src={`${resource.fileUrl}#toolbar=0&navpanes=0`}
          title={resource.title}
          width="100%"
          height="500px"
          style={{ border: 'none' }}
        />
      );
    }
    
    if (type.includes('image')) {
      return (
        <img 
          src={resource.fileUrl} 
          alt={resource.title} 
          style={{ maxWidth: '100%', maxHeight: '500px', objectFit: 'contain' }}
        />
      );
    }
    
    if (type.includes('video')) {
      return (
        <video 
          src={resource.fileUrl} 
          controls 
          style={{ maxWidth: '100%', maxHeight: '500px' }}
        />
      );
    }
    
    if (type.includes('audio')) {
      return (
        <audio 
          src={resource.fileUrl} 
          controls 
          style={{ width: '100%' }}
        />
      );
    }
    
    return (
      <div>
        <p>Preview not available. <a href={resource.fileUrl} target="_blank" rel="noopener noreferrer">Download file</a></p>
      </div>
    );
  };
  
  return (
    <>
      <div 
        style={{ 
          background: 'white', 
          padding: '20px', 
          borderRadius: '10px', 
          boxShadow: '0 4px 8px rgba(0,0,0,0.05)',
          border: '1px solid #eee',
          cursor: 'pointer',
          transition: 'transform 0.2s, box-shadow 0.2s',
          height: '100%',
          display: 'flex',
          flexDirection: 'column'
        }}
        onClick={handleResourceClick}
        onMouseOver={(e) => {
          e.currentTarget.style.transform = 'translateY(-5px)';
          e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.1)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.05)';
        }}
      >
        <div style={{ 
          display: 'flex',
          alignItems: 'center',
          marginBottom: '15px'
        }}>
          <div style={{ 
            fontSize: '28px', 
            marginRight: '15px',
            width: '50px',
            height: '50px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'var(--primary)10',
            borderRadius: '8px'
          }}>
            {getFileIcon()}
          </div>
          <div style={{ flex: 1 }}>
            <h4 style={{ margin: '0 0 5px 0', wordBreak: 'break-word' }}>{resource.title}</h4>
            <div style={{ fontSize: '14px', color: '#666' }}>
              {formatDate(resource.uploadedAt)}
            </div>
          </div>
        </div>
        
        {resource.description && (
          <p style={{ 
            margin: '0 0 15px 0', 
            fontSize: '14px', 
            color: '#555',
            flex: 1
          }}>
            {resource.description.length > 100 
              ? `${resource.description.substring(0, 100)}...` 
              : resource.description
            }
          </p>
        )}
        
        <div style={{ 
          marginTop: 'auto', 
          fontSize: '14px', 
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          color: '#666'
        }}>
          <div>
            {resource.uploadedBy && `Shared by: ${resource.uploadedBy}`}
          </div>
          <div style={{ 
            color: 'var(--primary)', 
            fontWeight: 'bold'
          }}>
            {resource.resourceType === 'link' ? 'Open Link' : 'View Resource'}
          </div>
        </div>
      </div>
      
      {/* Resource Preview Modal */}
      {previewOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            width: '90%',
            maxWidth: '800px',
            maxHeight: '90%',
            borderRadius: '10px',
            padding: '20px',
            overflow: 'auto'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <h3 style={{ margin: 0 }}>{resource.title}</h3>
              <button 
                onClick={closePreview}
                style={{ 
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer'
                }}
              >
                ×
              </button>
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              {renderPreview()}
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <a 
                href={resource.fileUrl}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary"
                onClick={(e) => e.stopPropagation()}
              >
                Download
              </a>
              <button 
                onClick={closePreview}
                className="btn btn-outline"
                style={{ marginLeft: '10px' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ResourceCard;