"use client"

import React, { useState, useEffect, useRef } from 'react';

// ─── Icons ────────────────────────────────────────────────────────────────────
const Icon = ({ d, size = 16, color = "currentColor", fill = "none" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
  </svg>
);

const icons = {
  folder:      "M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z",
  folderOpen:  "M5 19a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h4l2 2h4a2 2 0 0 1 2 2v1M5 19h14a2 2 0 0 0 2-2v-5a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2v5a2 2 0 0 1-2 2z",
  file:        ["M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z", "M13 2v7h7"],
  upload:      ["M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4", "M17 8l-5-5-5 5", "M12 3v12"],
  download:    ["M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4", "M7 10l5 5 5-5", "M12 15V3"],
  trash:       ["M3 6h18", "M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"],
  edit:        ["M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7", "M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"],
  copy:        ["M20 9H11a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2z", "M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"],
  refresh:     "M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15",
  connect:     ["M8 12h.01", "M12 12h.01", "M16 12h.01", "M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 0 1-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"],
  disconnect:  ["M18.36 6.64a9 9 0 0 1 1.535 9.712", "M5.64 5.64a9 9 0 1 0 12.728 12.728", "M1 1l22 22"],
  folderPlus:  ["M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z", "M12 11v6", "M9 14h6"],
  chevronRight:"M9 18l6-6-6-6",
  chevronDown: "M6 9l6 6 6-6",
  home:        ["M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z", "M9 22V12h6v10"],
  check:       "M20 6L9 17l-5-5",
  x:           ["M18 6L6 18", "M6 6l12 12"],
  link:        ["M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71","M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"],
  search:      ["M11 17.25a6.25 6.25 0 1 1 0-12.5 6.25 6.25 0 0 1 0 12.5z","M16 16l3.5 3.5"],
  eye:         ["M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z","M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"],
  move:        ["M5 9l-3 3 3 3","M9 5l3-3 3 3","M15 19l-3 3-3-3","M19 9l3 3-3 3","M2 12h20","M12 2v20"],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatBytes = (bytes) => {
  if (bytes === 0) return '0 B';
  const k = 1024, sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatDate = (d) => new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });

const getFileIcon = (key) => {
  if (key.endsWith('/')) return 'folder';
  const ext = key.split('.').pop()?.toLowerCase();
  return 'file';
};

// ─── Modal ────────────────────────────────────────────────────────────────────
const Modal = ({ title, onClose, children }) => (
  <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '28px 32px', minWidth: 380, maxWidth: 480, width: '90%', boxShadow: '0 24px 48px rgba(0,0,0,0.4)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 600, color: 'var(--accent)', letterSpacing: 1, textTransform: 'uppercase' }}>{title}</span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}><Icon d={icons.x} size={18} /></button>
      </div>
      {children}
    </div>
  </div>
);

// ─── Toast ────────────────────────────────────────────────────────────────────
const Toast = ({ toasts }) => (
  <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 2000, display: 'flex', flexDirection: 'column', gap: 8 }}>
    {toasts.map(t => (
      <div key={t.id} style={{
        background: t.type === 'error' ? '#3d1a1a' : t.type === 'success' ? '#1a3d2a' : '#1a2a3d',
        border: `1px solid ${t.type === 'error' ? '#c0392b' : t.type === 'success' ? '#27ae60' : '#2980b9'}`,
        color: '#eee', padding: '10px 16px', borderRadius: 8, fontSize: 13, maxWidth: 320,
        fontFamily: 'var(--font-mono)', animation: 'slideIn 0.2s ease',
      }}>{t.msg}</div>
    ))}
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const S3ObjectStorage = () => {
  const [config, setConfig] = useState({ endpoint: '', bucketName: '', accessKey: '', secretKey: '', region: 'us-east-1' });
  const [connected, setConnected] = useState(false);
  const [allObjects, setAllObjects] = useState([]);   // flat list from S3
  const [prefix, setPrefix] = useState('');           // current folder path
  const [loading, setLoading] = useState(false);
  const [s3Client, setS3Client] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [search, setSearch] = useState('');
  const [toasts, setToasts] = useState([]);
  const [selectedKeys, setSelectedKeys] = useState(new Set());
  const [contextMenu, setContextMenu] = useState(null); // {x, y, item}
  const [modal, setModal] = useState(null); // {type, data}
  const [fieldErrors, setFieldErrors] = useState({});
  const [connectionError, setConnectionError] = useState(null);
  const [fileVersions, setFileVersions] = useState({});
  const [selectedFileVersions, setSelectedFileVersions] = useState(null);
  const [fileVersionList, setFileVersionList] = useState([]);
  const fileInputRef = useRef();

  const toast = (msg, type = 'info') => {
    const id = Date.now();
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4000);
  };

  // ── SDK loader ──────────────────────────────────────────────────────────────
  const loadAWS = () => new Promise((res, rej) => {
    if (window.AWS) return res(window.AWS);
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/aws-sdk/2.1101.0/aws-sdk.min.js';
    s.onload = () => res(window.AWS);
    s.onerror = rej;
    document.body.appendChild(s);
  });

  // ── Connection ──────────────────────────────────────────────────────────────
  const validateFields = () => {
    const errors = {};
    if (!config.endpoint?.trim()) errors.endpoint = 'Endpoint URL is required (e.g., https://s3.example.com)';
    else if (!config.endpoint.startsWith('http')) errors.endpoint = 'Endpoint must start with http:// or https://';
    if (!config.bucketName?.trim()) errors.bucketName = 'Bucket name is required';
    if (!config.accessKey?.trim()) errors.accessKey = 'Access key is required';
    if (!config.secretKey?.trim()) errors.secretKey = 'Secret key is required';
    if (!config.region?.trim()) errors.region = 'Region is required';
    return errors;
  };

  const connectToS3 = async () => {
    const errors = validateFields();
    setFieldErrors(errors);
    setConnectionError(null);
    
    if (Object.keys(errors).length > 0) {
      toast('Please fill in all fields correctly', 'error');
      return;
    }
    
    try {
      setLoading(true);
      const AWS = await loadAWS();
      AWS.config.update({ accessKeyId: config.accessKey, secretAccessKey: config.secretKey, region: config.region });
      const s3 = new AWS.S3({ endpoint: config.endpoint, s3ForcePathStyle: true, signatureVersion: 'v4' });
      
      await new Promise((res, rej) => s3.headBucket({ Bucket: config.bucketName }, (e, d) => e ? rej(e) : res(d)));
      setS3Client(s3);
      setConnected(true);
      setFieldErrors({});
      toast('Connected successfully!', 'success');
      await listObjects(s3, '');
    } catch (e) {
      const errorMsg = e.message || e.code || 'Unknown error';
      let detailedError = `Connection failed: ${errorMsg}`;
      
      if (errorMsg.includes('Forbidden')) {
        detailedError = '❌ Access Denied: Invalid access key or secret key';
      } else if (errorMsg.includes('NoSuchBucket')) {
        detailedError = '❌ Bucket Not Found: Bucket does not exist or is in a different region';
      } else if (errorMsg.includes('NetworkingError') || errorMsg.includes('ENOTFOUND')) {
        detailedError = '❌ Network Error: Cannot reach endpoint URL. Check endpoint and network connection';
      } else if (errorMsg.includes('InvalidSignature')) {
        detailedError = '❌ Invalid Credentials: Access key or secret key is incorrect';
      } else if (errorMsg.includes('request timed out')) {
        detailedError = '❌ Connection Timeout: Endpoint took too long to respond. Check endpoint URL';
      }
      
      setConnectionError(detailedError);
      toast(detailedError, 'error');
    }
    finally { setLoading(false); }
  };

  const disconnect = () => { setConnected(false); setObjects([]); setAllObjects([]); setS3Client(null); setPrefix(''); setSelectedKeys(new Set()); };

  // ── List all objects ────────────────────────────────────────────────────────
  const listObjects = async (client, pfx) => {
    const s3 = client || s3Client;
    if (!s3) return;
    try {
      setLoading(true);
      let all = [], token;
      do {
        const params = { Bucket: config.bucketName, MaxKeys: 1000, ...(token ? { ContinuationToken: token } : {}) };
        const data = await new Promise((res, rej) => s3.listObjectsV2(params, (e, d) => e ? rej(e) : res(d)));
        all = [...all, ...(data.Contents || [])];
        token = data.NextContinuationToken;
      } while (token);
      setAllObjects(all.map(i => ({ key: i.Key, size: i.Size, lastModified: i.LastModified })));
      
      // Check for versions (S3 versioning)
      const versions = {};
      try {
        let keyMarker = undefined;
        let versionIdMarker = undefined;
        let totalVersions = 0;
        do {
          const vParams = { 
            Bucket: config.bucketName, 
            MaxKeys: 1000,
            ...(keyMarker ? { KeyMarker: keyMarker, VersionIdMarker: versionIdMarker } : {})
          };
          const vData = await new Promise((res, rej) => s3.listObjectVersions(vParams, (e, d) => e ? rej(e) : res(d)));
          (vData.Versions || []).forEach(v => {
            versions[v.Key] = (versions[v.Key] || 0) + 1;
            totalVersions++;
          });
          keyMarker = vData.NextKeyMarker;
          versionIdMarker = vData.NextVersionIdMarker;
        } while (keyMarker);
        setFileVersions(versions);
        console.log(`Versioning enabled: ${totalVersions} total versions found`, versions);
      } catch (e) {
        // Versioning not enabled, that's ok
        console.log('Versioning not enabled or error fetching versions:', e.message);
        setFileVersions({});
      }
      
      if (pfx !== undefined) setPrefix(pfx);
      toast(`Loaded ${all.length} objects`, 'success');
    } catch (e) { toast(`List failed: ${e.message}`, 'error'); }
    finally { setLoading(false); }
  };

  // ── View File Versions ──────────────────────────────────────────────────────
  const viewFileVersions = async (key) => {
    if (!s3Client) return;
    try {
      setLoading(true);
      const allVersions = [];
      let keyMarker = undefined;
      let versionIdMarker = undefined;
      
      do {
        const vParams = {
          Bucket: config.bucketName,
          MaxKeys: 1000,
          ...(keyMarker ? { KeyMarker: keyMarker, VersionIdMarker: versionIdMarker } : {})
        };
        const vData = await new Promise((res, rej) => s3Client.listObjectVersions(vParams, (e, d) => e ? rej(e) : res(d)));
        (vData.Versions || []).forEach(v => {
          if (v.Key === key) {
            allVersions.push({
              versionId: v.VersionId,
              lastModified: v.LastModified,
              size: v.Size,
              isLatest: v.IsLatest,
              etag: v.ETag
            });
          }
        });
        keyMarker = vData.NextKeyMarker;
        versionIdMarker = vData.NextVersionIdMarker;
      } while (keyMarker);
      
      if (allVersions.length === 0) {
        toast('No versions found. Versioning may not be enabled on this bucket.', 'warn');
      }
      
      setFileVersionList(allVersions.sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified)));
      setSelectedFileVersions(key);
    } catch (e) {
      toast(`Failed to fetch versions: ${e.message}`, 'error');
      console.error('Version fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  // ── Download File Version ───────────────────────────────────────────────────
  const downloadFileVersion = async (key, versionId) => {
    if (!s3Client) return;
    try {
      setLoading(true);
      const data = await new Promise((res, rej) => s3Client.getObject({ Bucket: config.bucketName, Key: key, VersionId: versionId }, (e, d) => e ? rej(e) : res(d)));
      const blob = new Blob([data.Body], { type: data.ContentType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const fileName = key.split('/').pop();
      const versionStr = versionId === 'null' ? '' : `_v${versionId.slice(0, 8)}`;
      a.download = `${fileName}${versionStr}`;
      a.click();
      URL.revokeObjectURL(url);
      toast(`Downloaded version of ${fileName}`, 'success');
    } catch (e) {
      toast(`Download failed: ${e.message}`, 'error');
      console.error('Version download error:', e);
    } finally {
      setLoading(false);
    }
  };

  // ── Derive current view ─────────────────────────────────────────────────────
  const currentItems = React.useMemo(() => {
    const folders = new Set();
    const files = [];
    const lsearch = search.toLowerCase();

    allObjects.forEach(obj => {
      if (!obj.key.startsWith(prefix)) return;
      const rest = obj.key.slice(prefix.length);
      if (!rest) return;
      const slash = rest.indexOf('/');
      if (slash !== -1) {
        const folderName = rest.slice(0, slash + 1);
        if (!lsearch || folderName.toLowerCase().includes(lsearch))
          folders.add(folderName);
      } else {
        if (!lsearch || rest.toLowerCase().includes(lsearch))
          files.push({ ...obj, name: rest, isFolder: false });
      }
    });

    const folderItems = [...folders].map(f => ({
      key: prefix + f, name: f.slice(0, -1), isFolder: true,
      size: null, lastModified: null
    }));
    return [...folderItems, ...files];
  }, [allObjects, prefix, search]);

  // ── Breadcrumbs ─────────────────────────────────────────────────────────────
  const breadcrumbs = React.useMemo(() => {
    const parts = prefix.split('/').filter(Boolean);
    return [{ label: config.bucketName || 'root', path: '' },
      ...parts.map((p, i) => ({ label: p, path: parts.slice(0, i + 1).join('/') + '/' }))];
  }, [prefix, config.bucketName]);

  // ── Upload ──────────────────────────────────────────────────────────────────
  const uploadFile = async (file) => {
    if (!file || !s3Client) return;
    try {
      setLoading(true); setUploadProgress(0);
      const key = prefix + file.name;
      const upload = s3Client.upload({ Bucket: config.bucketName, Key: key, Body: file, ContentType: file.type });
      upload.on('httpUploadProgress', p => setUploadProgress(Math.round(p.loaded / p.total * 100)));
      await new Promise((res, rej) => upload.send((e, d) => e ? rej(e) : res(d)));
      toast(`Uploaded ${file.name}`, 'success');
      await listObjects(null, prefix);
    } catch (e) { toast(`Upload failed: ${e.message}`, 'error'); }
    finally { setLoading(false); setUploadProgress(0); setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }
  };

  // ── Create Folder ───────────────────────────────────────────────────────────
  const createFolder = async (folderName) => {
    if (!folderName.trim() || !s3Client) return;
    const key = prefix + folderName.trim().replace(/\/$/, '') + '/';
    try {
      setLoading(true);
      await new Promise((res, rej) => s3Client.putObject({ Bucket: config.bucketName, Key: key, Body: '' }, (e, d) => e ? rej(e) : res(d)));
      toast(`Folder "${folderName}" created`, 'success');
      await listObjects(null, prefix);
    } catch (e) { toast(`Create folder failed: ${e.message}`, 'error'); }
    finally { setLoading(false); setModal(null); }
  };

  // ── Rename (copy + delete) ──────────────────────────────────────────────────
  const renameObject = async (oldKey, newName) => {
    if (!newName.trim() || !s3Client) return;
    try {
      setLoading(true);
      const isFolder = oldKey.endsWith('/');
      if (isFolder) {
        // Rename all objects under this prefix
        const folderObjects = allObjects.filter(o => o.key.startsWith(oldKey));
        const newPrefix = prefix + newName.trim() + '/';
        for (const obj of folderObjects) {
          const newKey = newPrefix + obj.key.slice(oldKey.length);
          await new Promise((res, rej) => s3Client.copyObject({ Bucket: config.bucketName, CopySource: `${config.bucketName}/${encodeURIComponent(obj.key)}`, Key: newKey }, (e, d) => e ? rej(e) : res(d)));
          await new Promise((res, rej) => s3Client.deleteObject({ Bucket: config.bucketName, Key: obj.key }, (e, d) => e ? rej(e) : res(d)));
        }
        toast(`Renamed folder to "${newName}"`, 'success');
      } else {
        const newKey = prefix + newName.trim();
        await new Promise((res, rej) => s3Client.copyObject({ Bucket: config.bucketName, CopySource: `${config.bucketName}/${encodeURIComponent(oldKey)}`, Key: newKey }, (e, d) => e ? rej(e) : res(d)));
        await new Promise((res, rej) => s3Client.deleteObject({ Bucket: config.bucketName, Key: oldKey }, (e, d) => e ? rej(e) : res(d)));
        toast(`Renamed to "${newName}"`, 'success');
      }
      await listObjects(null, prefix);
    } catch (e) { toast(`Rename failed: ${e.message}`, 'error'); }
    finally { setLoading(false); setModal(null); }
  };

  // ── Delete ──────────────────────────────────────────────────────────────────
  const deleteObjects = async (keys) => {
    if (!s3Client) return;
    try {
      setLoading(true);
      for (const key of keys) {
        if (key.endsWith('/')) {
          const nested = allObjects.filter(o => o.key.startsWith(key));
          for (const o of nested) await new Promise((res, rej) => s3Client.deleteObject({ Bucket: config.bucketName, Key: o.key }, (e, d) => e ? rej(e) : res(d)));
        } else {
          await new Promise((res, rej) => s3Client.deleteObject({ Bucket: config.bucketName, Key: key }, (e, d) => e ? rej(e) : res(d)));
        }
      }
      toast(`Deleted ${keys.length} item(s)`, 'success');
      setSelectedKeys(new Set());
      await listObjects(null, prefix);
    } catch (e) { toast(`Delete failed: ${e.message}`, 'error'); }
    finally { setLoading(false); setModal(null); }
  };

  // ── Download ────────────────────────────────────────────────────────────────
  const downloadObject = async (key) => {
    if (!s3Client) return;
    try {
      setLoading(true);
      const data = await new Promise((res, rej) => s3Client.getObject({ Bucket: config.bucketName, Key: key }, (e, d) => e ? rej(e) : res(d)));
      const blob = new Blob([data.Body], { type: data.ContentType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = key.split('/').pop(); a.click();
      URL.revokeObjectURL(url);
      toast(`Downloaded ${key.split('/').pop()}`, 'success');
    } catch (e) { toast(`Download failed: ${e.message}`, 'error'); }
    finally { setLoading(false); }
  };

  // ── Copy URL ─────────────────────────────────────────────────────────────────
  const copyUrl = (key) => {
    const url = `${config.endpoint}/${config.bucketName}/${key}`;
    navigator.clipboard.writeText(url).then(() => toast('URL copied to clipboard', 'success'));
  };

  // ── Move (copy + delete) ─────────────────────────────────────────────────────
  const moveObject = async (oldKey, newPath) => {
    if (!s3Client || !newPath.trim()) return;
    try {
      setLoading(true);
      const fileName = oldKey.split('/').filter(Boolean).pop();
      const newKey = (newPath.trim().replace(/\/$/, '') + '/' + fileName).replace(/^\//, '');
      await new Promise((res, rej) => s3Client.copyObject({ Bucket: config.bucketName, CopySource: `${config.bucketName}/${encodeURIComponent(oldKey)}`, Key: newKey }, (e, d) => e ? rej(e) : res(d)));
      await new Promise((res, rej) => s3Client.deleteObject({ Bucket: config.bucketName, Key: oldKey }, (e, d) => e ? rej(e) : res(d)));
      toast(`Moved to ${newKey}`, 'success');
      await listObjects(null, prefix);
    } catch (e) { toast(`Move failed: ${e.message}`, 'error'); }
    finally { setLoading(false); setModal(null); }
  };

  // ── Context Menu ─────────────────────────────────────────────────────────────
  const handleContextMenu = (e, item) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, item });
  };

  useEffect(() => {
    const close = () => setContextMenu(null);
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, []);

  // ── Drag & Drop ──────────────────────────────────────────────────────────────
  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  };

  // ── Styles ────────────────────────────────────────────────────────────────────
  const css = `
    @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600&family=Syne:wght@400;500;600;700&display=swap');
    :root {
      --bg: #0b0d12;
      --surface: #12151e;
      --surface2: #181c27;
      --border: #1e2333;
      --accent: #4dffb4;
      --accent2: #7c6aff;
      --danger: #ff4d6d;
      --warn: #ffb84d;
      --text: #e8eaf0;
      --text-muted: #5a6172;
      --font-mono: 'JetBrains Mono', monospace;
      --font-display: 'Syne', sans-serif;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: var(--bg); color: var(--text); font-family: var(--font-mono); }
    input, button { font-family: inherit; }
    ::placeholder { color: var(--text-muted); }
    @keyframes slideIn { from { transform: translateX(40px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
    @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
    @keyframes fadeUp { from { transform: translateY(8px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    .row-hover:hover { background: var(--surface2) !important; }
    .btn { cursor: pointer; border: none; border-radius: 6px; padding: 7px 14px; font-size: 12px; font-family: var(--font-mono); font-weight: 500; letter-spacing: 0.5px; transition: all 0.15s; display: inline-flex; align-items: center; gap: 6px; }
    .btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .btn-primary { background: var(--accent); color: #0b0d12; }
    .btn-primary:hover:not(:disabled) { filter: brightness(1.1); }
    .btn-ghost { background: transparent; color: var(--text-muted); border: 1px solid var(--border); }
    .btn-ghost:hover:not(:disabled) { border-color: var(--accent); color: var(--accent); }
    .btn-danger { background: #3d1a1a; color: var(--danger); border: 1px solid #5a1a1a; }
    .btn-danger:hover:not(:disabled) { background: #5a1a1a; }
    .input { background: var(--surface2); border: 1px solid var(--border); color: var(--text); border-radius: 6px; padding: 8px 12px; font-size: 13px; font-family: var(--font-mono); width: 100%; transition: all 0.2s; outline: none; }
    .input:focus { outline: none; border-color: var(--accent); box-shadow: 0 0 0 2px rgba(77,255,180,0.1); }
    .input:disabled { opacity: 0.4; }
    .checkbox { accent-color: var(--accent); cursor: pointer; width: 14px; height: 14px; }
    .cm-item { padding: 8px 14px; cursor: pointer; font-size: 12px; display: flex; align-items: center; gap: 8px; color: var(--text); }
    .cm-item:hover { background: var(--surface2); }
    .cm-danger { color: var(--danger); }
    .drop-zone { border: 2px dashed var(--border); border-radius: 8px; padding: 20px; text-align: center; transition: all 0.2s; cursor: pointer; }
    .drop-zone:hover, .drop-zone.dragover { border-color: var(--accent); background: rgba(77,255,180,0.04); }
  `;

  const [dragOver, setDragOver] = useState(false);
  const [inputVal, setInputVal] = useState('');

  return (
    <>
      <style>{css}</style>
      <Toast toasts={toasts} />

      {/* Context Menu */}
      {contextMenu && (
        <div style={{
          position: 'fixed', top: contextMenu.y, left: contextMenu.x, zIndex: 999,
          background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8,
          minWidth: 180, boxShadow: '0 8px 32px rgba(0,0,0,0.5)', animation: 'fadeUp 0.1s ease',
        }}>
          {!contextMenu.item.isFolder && <div className="cm-item" onClick={() => { downloadObject(contextMenu.item.key); setContextMenu(null); }}><Icon d={icons.download} size={14} />Download</div>}
          {!contextMenu.item.isFolder && <div className="cm-item" onClick={() => { viewFileVersions(contextMenu.item.key); setContextMenu(null); }}><Icon d={icons.copy} size={14} />View Versions</div>}
          <div className="cm-item" onClick={() => { setModal({ type: 'rename', item: contextMenu.item }); setInputVal(contextMenu.item.name); setContextMenu(null); }}><Icon d={icons.edit} size={14} />Rename</div>
          {!contextMenu.item.isFolder && <div className="cm-item" onClick={() => { setModal({ type: 'move', item: contextMenu.item }); setInputVal(''); setContextMenu(null); }}><Icon d={icons.move} size={14} />Move</div>}
          {!contextMenu.item.isFolder && <div className="cm-item" onClick={() => { copyUrl(contextMenu.item.key); setTimeout(() => setContextMenu(null), 100); }}><Icon d={icons.link} size={14} />Copy URL</div>}
          <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />
          <div className="cm-item cm-danger" onClick={() => { setModal({ type: 'delete', keys: [contextMenu.item.key] }); setContextMenu(null); }}><Icon d={icons.trash} size={14} color="var(--danger)" />Delete</div>
        </div>
      )}

      {/* Modals */}
      {modal?.type === 'rename' && (
        <Modal title="Rename" onClose={() => setModal(null)}>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>Rename "{modal.item.name}"</p>
          <input className="input" value={inputVal} onChange={e => setInputVal(e.target.value)} onKeyDown={e => e.key === 'Enter' && renameObject(modal.item.key, inputVal)} autoFocus />
          <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'flex-end' }}>
            <button className="btn btn-ghost" onClick={() => setModal(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={() => renameObject(modal.item.key, inputVal)}>Rename</button>
          </div>
        </Modal>
      )}
      {modal?.type === 'delete' && (
        <Modal title="Confirm Delete" onClose={() => setModal(null)}>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
            Delete <strong style={{ color: 'var(--danger)' }}>{modal.keys.length}</strong> item(s)?
            {modal.keys.some(k => k.endsWith('/')) && <><br /><span style={{ color: 'var(--warn)', fontSize: 12 }}>⚠ Folder deletions are recursive.</span></>}
          </p>
          <div style={{ display: 'flex', gap: 8, marginTop: 20, justifyContent: 'flex-end' }}>
            <button className="btn btn-ghost" onClick={() => setModal(null)}>Cancel</button>
            <button className="btn btn-danger" onClick={() => deleteObjects(modal.keys)}>Delete</button>
          </div>
        </Modal>
      )}
      {modal?.type === 'folder' && (
        <Modal title="New Folder" onClose={() => setModal(null)}>
          <input className="input" placeholder="folder-name" value={inputVal} onChange={e => setInputVal(e.target.value)} onKeyDown={e => e.key === 'Enter' && createFolder(inputVal)} autoFocus />
          <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'flex-end' }}>
            <button className="btn btn-ghost" onClick={() => setModal(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={() => createFolder(inputVal)}>Create</button>
          </div>
        </Modal>
      )}
      {modal?.type === 'move' && (
        <Modal title="Move Object" onClose={() => setModal(null)}>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>Destination path (e.g. <code style={{ color: 'var(--accent)' }}>folder/subfolder</code>)</p>
          <input className="input" placeholder="path/to/destination" value={inputVal} onChange={e => setInputVal(e.target.value)} onKeyDown={e => e.key === 'Enter' && moveObject(modal.item.key, inputVal)} autoFocus />
          <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'flex-end' }}>
            <button className="btn btn-ghost" onClick={() => setModal(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={() => moveObject(modal.item.key, inputVal)}>Move</button>
          </div>
        </Modal>
      )}

      {/* View Versions Modal */}
      {selectedFileVersions && (
        <Modal title="File Versions" onClose={() => { setSelectedFileVersions(null); setFileVersionList([]); }}>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>{selectedFileVersions.split('/').pop()} has {fileVersionList.length} version(s)</p>
          <div style={{ maxHeight: 400, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 6 }}>
            {fileVersionList.map((v, i) => (
              <div key={v.versionId} style={{ padding: 12, borderBottom: i < fileVersionList.length - 1 ? '1px solid var(--border)' : 'none', background: v.isLatest ? 'rgba(77,255,180,0.05)' : 'transparent' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--text)', fontWeight: v.isLatest ? 600 : 400 }}>
                      Version {i + 1} {v.isLatest && <span style={{ color: 'var(--accent)', fontSize: 11, marginLeft: 8 }}>● Latest</span>}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                      {formatDate(v.lastModified)} • {formatBytes(v.size)}
                    </div>
                  </div>
                  <button 
                    className="btn btn-primary" 
                    style={{ padding: '4px 12px' }} 
                    onClick={() => downloadFileVersion(selectedFileVersions, v.versionId)}
                  >
                    <Icon d={icons.download} size={12} />Download
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'flex-end' }}>
            <button className="btn btn-ghost" onClick={() => { setSelectedFileVersions(null); setFileVersionList([]); }}>Close</button>
          </div>
        </Modal>
      )}

      {/* ── Main Layout ── */}
      <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '0' }}>
        {/* Header */}
        <div style={{ borderBottom: '1px solid var(--border)', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 12, background: 'var(--surface)' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: connected ? 'var(--accent)' : 'var(--text-muted)', boxShadow: connected ? '0 0 8px var(--accent)' : 'none', animation: loading ? 'pulse 1s infinite' : 'none' }} />
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, letterSpacing: -0.5, color: 'var(--text)' }}>Object Storage</span>
          <span style={{ color: 'var(--text-muted)', fontSize: 11, marginLeft: 4, fontFamily: 'var(--font-mono)' }}>S3-compatible explorer</span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>

            {connected && <span style={{ fontSize: 11, color: 'var(--accent)', border: '1px solid var(--accent)', borderRadius: 4, padding: '2px 8px' }}>● CONNECTED</span>}
          </div>
        </div>

        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px' }}>
          {/* Config Panel */}
          {!connected && (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: 24, marginBottom: 24, animation: 'fadeUp 0.3s ease' }}>
              <div style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 16 }}>Connection</div>
              
              {connectionError && (
                <div style={{ background: '#3d1a1a', border: '1px solid #5a1a1a', color: '#ff6b6b', borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 13 }}>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>Connection Error</div>
                  <div>{connectionError}</div>
                </div>
              )}
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[
                  { name: 'endpoint', label: 'Endpoint URL', placeholder: 'https://s3.example.com', type: 'text' },
                  { name: 'bucketName', label: 'Bucket Name', placeholder: 'my-bucket', type: 'text' },
                  { name: 'accessKey', label: 'Access Key', placeholder: 'AKIAIOSFODNN7EXAMPLE', type: 'text' },
                  { name: 'secretKey', label: 'Secret Key', placeholder: '••••••••••••••••', type: 'password' },
                  { name: 'region', label: 'Region', placeholder: 'us-east-1', type: 'text' },
                ].map(f => (
                  <div key={f.name} style={f.name === 'endpoint' ? { gridColumn: '1/-1' } : {}}>
                    <div style={{ fontSize: 11, color: fieldErrors[f.name] ? '#ff6b6b' : 'var(--text-muted)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: 1 }}>
                      {f.label}
                      {fieldErrors[f.name] && <span style={{ marginLeft: 8, color: '#ff6b6b' }}>⚠ {fieldErrors[f.name]}</span>}
                    </div>
                    <input 
                      className="input" 
                      type={f.type} 
                      name={f.name} 
                      value={config[f.name]} 
                      onChange={e => {
                        setConfig(p => ({ ...p, [e.target.name]: e.target.value }));
                        if (fieldErrors[f.name]) {
                          setFieldErrors(p => ({ ...p, [f.name]: '' }));
                        }
                      }} 
                      placeholder={f.placeholder}
                      style={{ borderColor: fieldErrors[f.name] ? '#c0392b' : 'var(--border)' }}
                    />
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
                <button className="btn btn-primary" onClick={connectToS3} disabled={loading}>
                  <Icon d={icons.connect} size={14} />{loading ? 'Connecting…' : 'Connect'}
                </button>
              </div>
            </div>
          )}

          {connected && (
            <div style={{ animation: 'fadeUp 0.3s ease' }}>
              {/* Versioning Info */}
              {Object.keys(fileVersions).length === 0 && (
                <div style={{ background: 'rgba(255, 180, 77, 0.1)', border: '1px solid #ffb84d', color: '#ffb84d', borderRadius: 8, padding: 10, marginBottom: 16, fontSize: 12 }}>
                  <strong>ℹ Versioning:</strong> Enable S3 versioning on your bucket to track multiple versions of files. Currently showing only latest versions.
                </div>
              )}
              {Object.keys(fileVersions).length > 0 && Object.values(fileVersions).some(v => v > 1) && (
                <div style={{ background: 'rgba(77, 255, 180, 0.1)', border: '1px solid #4dffb4', color: '#4dffb4', borderRadius: 8, padding: 10, marginBottom: 16, fontSize: 12 }}>
                  <strong>✓ Versioning:</strong> Enabled. {Object.values(fileVersions).reduce((a, b) => a + b, 0)} total versions detected.
                </div>
              )}
              
              {/* Toolbar */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                {/* Search */}
                <div style={{ position: 'relative', flex: 1, minWidth: 180 }}>
                  <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}><Icon d={icons.search} size={14} /></span>
                  <input className="input" style={{ paddingLeft: 32 }} placeholder="Search objects…" value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <button className="btn btn-ghost" onClick={() => { setModal({ type: 'folder' }); setInputVal(''); }}><Icon d={icons.folderPlus} size={14} />New Folder</button>
                <button className="btn btn-ghost" onClick={() => fileInputRef.current?.click()}><Icon d={icons.upload} size={14} />Upload</button>
                <input ref={fileInputRef} type="file" style={{ display: 'none' }} onChange={e => { if (e.target.files[0]) uploadFile(e.target.files[0]); }} />
                {selectedKeys.size > 0 && (
                  <button className="btn btn-danger" onClick={() => setModal({ type: 'delete', keys: [...selectedKeys] })}>
                    <Icon d={icons.trash} size={14} color="var(--danger)" />Delete ({selectedKeys.size})
                  </button>
                )}
                <button className="btn btn-ghost" onClick={() => listObjects(null, prefix)} disabled={loading}><Icon d={icons.refresh} size={14} /></button>
                <button className="btn btn-ghost" style={{ borderColor: '#c0392b', color: '#c0392b' }} onClick={disconnect}><Icon d={icons.disconnect} size={14} color="#c0392b" />Disconnect</button>
              </div>

              {/* Upload Progress */}
              {uploadProgress > 0 && uploadProgress < 100 && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ height: 3, background: 'var(--border)', borderRadius: 99 }}>
                    <div style={{ height: '100%', width: `${uploadProgress}%`, background: 'var(--accent)', borderRadius: 99, transition: 'width 0.2s' }} />
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{uploadProgress}% uploading…</div>
                </div>
              )}

              {/* Breadcrumb */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 12, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, padding: '6px 12px', flexWrap: 'wrap' }}>
                {breadcrumbs.map((b, i) => (
                  <React.Fragment key={b.path}>
                    {i > 0 && <Icon d={icons.chevronRight} size={12} color="var(--text-muted)" />}
                    <button onClick={() => { setPrefix(b.path); setSelectedKeys(new Set()); }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: i === breadcrumbs.length - 1 ? 'var(--accent)' : 'var(--text-muted)', fontSize: 12, padding: '2px 4px', fontFamily: 'var(--font-mono)', borderRadius: 4 }}>
                      {i === 0 ? <Icon d={icons.home} size={14} color="var(--text-muted)" /> : b.label}
                    </button>
                  </React.Fragment>
                ))}
              </div>

              {/* Drop Zone + Table */}
              <div
                className={`drop-zone${dragOver ? ' dragover' : ''}`}
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={e => { setDragOver(false); handleDrop(e); }}
                style={{ padding: 0, border: 'none', background: 'var(--surface)', borderRadius: 10, border: '1px solid var(--border)', overflow: 'hidden' }}
              >
                {/* Table header */}
                <div style={{ display: 'grid', gridTemplateColumns: '36px 1fr 100px 160px 120px 140px', gap: 0, background: 'var(--surface2)', borderBottom: '1px solid var(--border)', padding: '8px 16px', fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>
                  <div><input type="checkbox" className="checkbox" checked={selectedKeys.size === currentItems.filter(i => !i.isFolder).length && currentItems.length > 0} onChange={e => { if (e.target.checked) setSelectedKeys(new Set(currentItems.filter(i => !i.isFolder).map(i => i.key))); else setSelectedKeys(new Set()); }} /></div>
                  <div>Name</div>
                  <div style={{ textAlign: 'right' }}>Size</div>
                  <div>Modified</div>
                  <div>Versions</div>
                  <div style={{ textAlign: 'center' }}>Actions</div>
                </div>

                {/* Rows */}
                {currentItems.length === 0 ? (
                  <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                    {dragOver ? '📂 Drop file to upload' : loading ? 'Loading…' : 'No objects found. Drag & drop to upload.'}
                  </div>
                ) : (
                  currentItems.map((item) => (
                    <div
                      key={item.key}
                      className="row-hover"
                      onContextMenu={e => handleContextMenu(e, item)}
                      onDoubleClick={() => { if (item.isFolder) { setPrefix(item.key); setSelectedKeys(new Set()); } }}
                      style={{ display: 'grid', gridTemplateColumns: '36px 1fr 100px 160px 120px 140px', gap: 0, padding: '9px 16px', borderBottom: '1px solid var(--border)', alignItems: 'center', cursor: item.isFolder ? 'pointer' : 'default', background: selectedKeys.has(item.key) ? 'rgba(77,255,180,0.04)' : 'transparent', transition: 'background 0.1s' }}
                    >
                      {/* Checkbox */}
                      <div onClick={e => e.stopPropagation()}>
                        {!item.isFolder && (
                          <input type="checkbox" className="checkbox" checked={selectedKeys.has(item.key)} onChange={e => {
                            const next = new Set(selectedKeys);
                            e.target.checked ? next.add(item.key) : next.delete(item.key);
                            setSelectedKeys(next);
                          }} />
                        )}
                      </div>
                      {/* Name */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
                        <span style={{ color: item.isFolder ? 'var(--warn)' : 'var(--accent2)', flexShrink: 0 }}>
                          <Icon d={item.isFolder ? icons.folder : icons.file} size={15} color={item.isFolder ? 'var(--warn)' : 'var(--accent2)'} />
                        </span>
                        <span style={{ fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text)' }}>{item.name}{item.isFolder ? '/' : ''}</span>
                      </div>
                      {/* Size */}
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'right' }}>{item.isFolder ? '—' : formatBytes(item.size)}</div>
                      {/* Date */}
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{item.isFolder ? '—' : item.lastModified ? formatDate(item.lastModified) : '—'}</div>
                      {/* Versions */}
                      <div style={{ fontSize: 11, color: fileVersions[item.key] > 1 ? 'var(--warn)' : 'var(--text-muted)', fontWeight: fileVersions[item.key] > 1 ? 600 : 400, cursor: 'help' }} title={fileVersions[item.key] > 1 ? `${fileVersions[item.key]} versions available` : 'Enable S3 versioning to track multiple versions'}>
                        {item.isFolder ? '—' : fileVersions[item.key] ? `${fileVersions[item.key]} versions` : '1 version'}
                      </div>
                      {/* Actions */}
                      <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }} onClick={e => e.stopPropagation()}>
                        {!item.isFolder && (
                          <button className="btn btn-ghost" style={{ padding: '4px 8px' }} title="Download" onClick={() => downloadObject(item.key)}>
                            <Icon d={icons.download} size={13} />
                          </button>
                        )}
                        {!item.isFolder && (
                          <button className="btn btn-ghost" style={{ padding: '4px 8px' }} title="View Versions" onClick={() => viewFileVersions(item.key)}>
                            <Icon d={icons.copy} size={13} />
                          </button>
                        )}
                        <button className="btn btn-ghost" style={{ padding: '4px 8px' }} title="Rename" onClick={() => { setModal({ type: 'rename', item }); setInputVal(item.name); }}>
                          <Icon d={icons.edit} size={13} />
                        </button>
                        {!item.isFolder && (
                          <button className="btn btn-ghost" style={{ padding: '4px 8px' }} title="Move" onClick={() => { setModal({ type: 'move', item }); setInputVal(''); }}>
                            <Icon d={icons.move} size={13} />
                          </button>
                        )}
                        <button className="btn btn-ghost" style={{ padding: '4px 8px', color: 'var(--danger)', borderColor: 'transparent' }} title="Delete"
                          onClick={() => setModal({ type: 'delete', keys: [item.key] })}>
                          <Icon d={icons.trash} size={13} color="var(--danger)" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              <div style={{ marginTop: 10, fontSize: 11, color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                <span>{currentItems.length} items in view · {allObjects.length} total objects</span>
                <span style={{ color: 'var(--accent)' }}>{config.bucketName}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default S3ObjectStorage;