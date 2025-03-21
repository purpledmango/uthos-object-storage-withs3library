"use client"

import React, { useState, useEffect } from 'react';
import _ from 'lodash';


const S3ObjectStorage = () => {
  const [config, setConfig] = useState({
    endpoint: '',
    bucketName: '',
    accessKey: '',
    secretKey: '',
    region: 'us-east-1' // Default region
  });
  const [connected, setConnected] = useState(false);
  const [objects, setObjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [s3Client, setS3Client] = useState(null);

  const handleConfigChange = (e) => {
    const { name, value } = e.target;
    setConfig(prev => ({ ...prev, [name]: value }));
  };

  const connectToS3 = async () => {
    // Check if all required fields are filled
    if (!config.endpoint || !config.bucketName || !config.accessKey || !config.secretKey) {
      setMessage('Please fill in all connection details');
      return;
    }

    try {
      setLoading(true);
      setMessage('Connecting to S3...');
      
      // Load AWS SDK dynamically (if needed in an environment without it)
      if (!window.AWS) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/aws-sdk/2.1101.0/aws-sdk.min.js';
          script.async = true;
          script.onload = resolve;
          script.onerror = reject;
          document.body.appendChild(script);
        });
      }
      
      // Configure AWS SDK
      const AWS = window.AWS;
      AWS.config.update({
        accessKeyId: config.accessKey,
        secretAccessKey: config.secretKey,
        region: config.region
      });
      
      // Create S3 client with custom endpoint
      const s3 = new AWS.S3({
        endpoint: config.endpoint,
        s3ForcePathStyle: true, // Needed for non-AWS S3 compatible services
        signatureVersion: 'v4'
      });
      
      // Test connection by listing buckets
      await new Promise((resolve, reject) => {
        s3.headBucket({ Bucket: config.bucketName }, (err, data) => {
          if (err) {
            reject(err);
          } else {
            resolve(data);
          }
        });
      });
      
      setS3Client(s3);
      setConnected(true);
      setMessage('Connected successfully!');
      
      // Load objects after successful connection
      await listObjects(s3);
    } catch (error) {
      setMessage(`Connection failed: ${error.message}`);
      console.error("S3 Connection Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const listObjects = async (client = null) => {
    const s3 = client || s3Client;
    if (!s3) {
      setMessage('No active S3 connection');
      return;
    }
    
    try {
      setLoading(true);
      setMessage('Fetching objects...');
      
      const params = {
        Bucket: config.bucketName,
        MaxKeys: 100 // Limit number of objects returned
      };
      
      const data = await new Promise((resolve, reject) => {
        s3.listObjectsV2(params, (err, data) => {
          if (err) {
            reject(err);
          } else {
            resolve(data);
          }
        });
      });
      
      const mappedObjects = data.Contents ? data.Contents.map(item => ({
        key: item.Key,
        size: item.Size,
        lastModified: item.LastModified
      })) : [];
      
      setObjects(mappedObjects);
      setMessage(`Retrieved ${mappedObjects.length} objects`);
    } catch (error) {
      setMessage(`Failed to list objects: ${error.message}`);
      console.error("List Objects Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const uploadFile = async () => {
    if (!selectedFile || !s3Client) {
      setMessage('Please select a file and ensure connection is active');
      return;
    }

    try {
      setLoading(true);
      setMessage(`Uploading ${selectedFile.name}...`);
      setUploadProgress(0);
      
      // Create upload parameters
      const params = {
        Bucket: config.bucketName,
        Key: selectedFile.name,
        Body: selectedFile,
        ContentType: selectedFile.type
      };
      
      // Configure the upload
      const upload = s3Client.upload(params);
      
      // Track upload progress
      upload.on('httpUploadProgress', (progress) => {
        const percentage = Math.round((progress.loaded / progress.total) * 100);
        setUploadProgress(percentage);
      });
      
      // Execute upload
      await new Promise((resolve, reject) => {
        upload.send((err, data) => {
          if (err) {
            reject(err);
          } else {
            resolve(data);
          }
        });
      });
      
      setMessage(`Successfully uploaded ${selectedFile.name}`);
      setSelectedFile(null);
      
      // Reset file input
      const fileInput = document.getElementById('file-upload');
      if (fileInput) fileInput.value = '';
      
      // Refresh object list
      await listObjects();
    } catch (error) {
      setMessage(`Upload failed: ${error.message}`);
      console.error("Upload Error:", error);
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  const downloadObject = async (key) => {
    if (!s3Client) {
      setMessage('No active S3 connection');
      return;
    }
    
    try {
      setLoading(true);
      setMessage(`Preparing download for ${key}...`);
      
      // Set parameters
      const params = {
        Bucket: config.bucketName,
        Key: key
      };
      
      // Get object
      const data = await new Promise((resolve, reject) => {
        s3Client.getObject(params, (err, data) => {
          if (err) {
            reject(err);
          } else {
            resolve(data);
          }
        });
      });
      
      // Create a blob from the data
      const blob = new Blob([data.Body], { type: data.ContentType });
      
      // Create an object URL
      const url = window.URL.createObjectURL(blob);
      
      // Create a temporary link and trigger download
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = key.split('/').pop(); // Extract filename from path
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      setMessage(`Downloaded ${key} successfully`);
    } catch (error) {
      setMessage(`Download failed: ${error.message}`);
      console.error("Download Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const deleteObject = async (key) => {
    if (!s3Client) {
      setMessage('No active S3 connection');
      return;
    }
    
    try {
      setLoading(true);
      setMessage(`Deleting ${key}...`);
      
      // Set parameters
      const params = {
        Bucket: config.bucketName,
        Key: key
      };
      
      // Delete object
      await new Promise((resolve, reject) => {
        s3Client.deleteObject(params, (err, data) => {
          if (err) {
            reject(err);
          } else {
            resolve(data);
          }
        });
      });
      
      // Remove from local state
      setObjects(prev => prev.filter(obj => obj.key !== key));
      setMessage(`Deleted ${key} successfully`);
    } catch (error) {
      setMessage(`Deletion failed: ${error.message}`);
      console.error("Delete Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Utho's Object Storage Explorer</h1>
      
      {/* Connection Form */}
      <div className="bg-gray-100 p-4 rounded-lg mb-6">
        <h2 className="text-lg font-semibold mb-2">Connection Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Endpoint URL</label>
            <input 
              type="text" 
              name="endpoint" 
              value={config.endpoint} 
              onChange={handleConfigChange}
              placeholder="https://s3.example.com"
              className="w-full p-2 border rounded"
              disabled={connected}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Bucket Name</label>
            <input 
              type="text" 
              name="bucketName" 
              value={config.bucketName} 
              onChange={handleConfigChange}
              placeholder="my-bucket"
              className="w-full p-2 border rounded"
              disabled={connected}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Access Key</label>
            <input 
              type="text" 
              name="accessKey" 
              value={config.accessKey} 
              onChange={handleConfigChange}
              placeholder="AKIAIOSFODNN7EXAMPLE"
              className="w-full p-2 border rounded"
              disabled={connected}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Secret Key</label>
            <input 
              type="password" 
              name="secretKey" 
              value={config.secretKey} 
              onChange={handleConfigChange}
              placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
              className="w-full p-2 border rounded"
              disabled={connected}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Region</label>
            <input 
              type="text" 
              name="region" 
              value={config.region} 
              onChange={handleConfigChange}
              placeholder="us-east-1"
              className="w-full p-2 border rounded"
              disabled={connected}
            />
          </div>
        </div>
        <div className="mt-4">
          {!connected ? (
            <button 
              onClick={connectToS3} 
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              disabled={loading}
            >
              Connect
            </button>
          ) : (
            <button 
              onClick={() => {
                setConnected(false);
                setObjects([]);
                setS3Client(null);
              }} 
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            >
              Disconnect
            </button>
          )}
        </div>
      </div>
      
      {connected && (
        <>
          {/* File Upload */}
          <div className="bg-gray-100 p-4 rounded-lg mb-6">
            <h2 className="text-lg font-semibold mb-2">Upload File</h2>
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
              <input 
                id="file-upload"
                type="file" 
                onChange={handleFileSelect}
                className="border p-2 rounded w-full md:w-auto"
              />
              <button 
                onClick={uploadFile} 
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                disabled={!selectedFile || loading}
              >
                Upload
              </button>
            </div>
            {uploadProgress > 0 && uploadProgress < 100 && (
              <div className="mt-2">
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-blue-600 h-2.5 rounded-full" 
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600 mt-1">{uploadProgress}% uploaded</p>
              </div>
            )}
          </div>
          
          {/* Objects List */}
          <div className="bg-gray-100 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Objects in {config.bucketName}</h2>
              <button 
                onClick={() => listObjects()} 
                className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 text-sm"
                disabled={loading}
              >
                Refresh
              </button>
            </div>
            
            {objects.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-200">
                      <th className="text-left p-2">Name</th>
                      <th className="text-left p-2">Size</th>
                      <th className="text-left p-2">Last Modified</th>
                      <th className="text-center p-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {objects.map((obj) => (
                      <tr key={obj.key} className="border-b">
                        <td className="p-2 break-all">{obj.key}</td>
                        <td className="p-2">{formatBytes(obj.size)}</td>
                        <td className="p-2">{formatDate(obj.lastModified)}</td>
                        <td className="p-2 text-center">
                          <button 
                            onClick={() => downloadObject(obj.key)}
                            className="bg-blue-500 text-white px-2 py-1 rounded text-xs mr-2 hover:bg-blue-600"
                            disabled={loading}
                          >
                            Download
                          </button>
                          <button 
                            onClick={() => deleteObject(obj.key)}
                            className="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600"
                            disabled={loading}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-600">No objects found in this bucket.</p>
            )}
          </div>
        </>
      )}
      
      {/* Status Messages */}
      {message && (
        <div className={`mt-4 p-2 rounded ${loading ? 'bg-blue-100' : 'bg-green-100'}`}>
          <p className="text-sm">{message}</p>
        </div>
      )}
    </div>
  );
};

export default S3ObjectStorage;