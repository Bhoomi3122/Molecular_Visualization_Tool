import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, File, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

const MolecularFileUpload = () => {
  const [files, setFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null); // 'success' | 'error'
  const [errorMessage, setErrorMessage] = useState('');

  const allowedExtensions = ['.pdb', '.psf', '.dcd', '.xyz', '.gro', '.trr', '.xtc', '.mol2'];
  const maxFileSize = 500 * 1024 * 1024; // 500MB in bytes

  const validateFile = (file) => {
    const extension = '.' + file.name.split('.').pop().toLowerCase();
    if (!allowedExtensions.includes(extension)) {
      return `File type ${extension} is not supported. Allowed types: ${allowedExtensions.join(', ')}`;
    }
    if (file.size > maxFileSize) {
      return `File size exceeds 500MB limit. Current size: ${(file.size / (1024 * 1024)).toFixed(1)}MB`;
    }
    return null;
  };

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    setUploadStatus(null);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    processFiles(droppedFiles);
  }, []);

  const handleFileInput = (e) => {
    setUploadStatus(null);
    const selectedFiles = Array.from(e.target.files);
    processFiles(selectedFiles);
  };

  const processFiles = (newFiles) => {
    const validFiles = [];
    const errors = [];

    newFiles.forEach(file => {
      const error = validateFile(file);
      if (error) {
        errors.push(`${file.name}: ${error}`);
      } else {
        validFiles.push({
          file,
          id: Math.random().toString(36).substr(2, 9),
          name: file.name,
          size: file.size,
          type: '.' + file.name.split('.').pop().toLowerCase()
        });
      }
    });

    if (errors.length > 0) {
      setErrorMessage(errors.join('\n'));
      setUploadStatus('error');
    }

    setFiles(prev => [...prev, ...validFiles]);
  };

  const removeFile = (id) => {
    setFiles(prev => prev.filter(f => f.id !== id));
    setUploadStatus(null);
  };

  const clearFiles = () => {
    setFiles([]);
    setUploadStatus(null);
    setErrorMessage('');
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleSubmit = async () => {
    if (files.length === 0) return;

    setUploading(true);
    setUploadStatus(null);

    try {
      const formData = new FormData();
      files.forEach(fileObj => {
        formData.append('files', fileObj.file);
      });

      const response = await fetch('http://localhost:5000/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        setUploadStatus('success');
        setTimeout(() => {
          clearFiles();
        }, 3000);
      } else {
        throw new Error(`Upload failed: ${response.statusText}`);
      }
    } catch (error) {
      setUploadStatus('error');
      setErrorMessage(error.message);
    } finally {
      setUploading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" }
    }
  };

  const fileItemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: { duration: 0.3, ease: "easeOut" }
    },
    exit: { 
      opacity: 0, 
      x: 20,
      transition: { duration: 0.2 }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-12 px-4 font-inter">
      <motion.div 
        className="max-w-4xl mx-auto"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <div className="text-center mb-6">
          <motion.h1 
            className="text-3xl font-bold text-slate-800 mb-2"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            Molecular Simulation File Upload
          </motion.h1>
          <motion.p 
            className="text-slate-600 text-base"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            Upload your molecular simulation files for processing and analysis
          </motion.p>
        </div>

        {/* Upload Card */}
        <motion.div 
          className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {/* Drop Zone */}
          <div
            className={`relative border-2 border-dashed m-5 rounded-lg transition-all duration-300 ${
              dragActive 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              type="file"
              multiple
              // accept={allowedExtensions.join(',')}
              onChange={handleFileInput}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={uploading}
            />
            
            <div className="flex flex-col items-center justify-center py-12 px-5">
              <motion.div
                animate={{ 
                  scale: dragActive ? 1.1 : 1,
                  rotate: dragActive ? 5 : 0 
                }}
                transition={{ duration: 0.2 }}
              >
                <Upload className={`w-12 h-12 mb-3 ${dragActive ? 'text-blue-500' : 'text-slate-400'}`} />
              </motion.div>
              
              <h3 className="text-lg font-semibold text-slate-700 mb-2">
                Drop files here or click to browse
              </h3>
              <p className="text-slate-500 text-center mb-3 text-sm">
                Select multiple molecular simulation files
              </p>
              <div className="flex flex-wrap justify-center gap-2 text-xs text-slate-400">
                {allowedExtensions.map(ext => (
                  <span key={ext} className="px-2 py-1 bg-slate-100 rounded text-slate-600">
                    {ext}
                  </span>
                ))}
              </div>
              <p className="text-xs text-slate-400 mt-2">
                Maximum file size: 500MB per file
              </p>
            </div>
          </div>

          {/* File List */}
          <AnimatePresence>
            {files.length > 0 && (
              <motion.div 
                className="px-5 pb-3"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-base font-semibold text-slate-700">
                    Selected Files ({files.length})
                  </h4>
                  <button
                    onClick={clearFiles}
                    className="text-slate-500 hover:text-red-500 transition-colors duration-200 text-sm"
                    disabled={uploading}
                  >
                    Clear All
                  </button>
                </div>
                
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  <AnimatePresence>
                    {files.map((fileObj) => (
                      <motion.div
                        key={fileObj.id}
                        variants={fileItemVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200"
                      >
                        <div className="flex items-center space-x-2 flex-1 min-w-0">
                          <File className="w-4 h-4 text-blue-500 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-slate-700 truncate">
                              {fileObj.name}
                            </p>
                            <p className="text-xs text-slate-500">
                              {fileObj.type} • {formatFileSize(fileObj.size)}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => removeFile(fileObj.id)}
                          className="ml-2 p-1 hover:bg-red-100 rounded-full transition-colors duration-200"
                          disabled={uploading}
                        >
                          <X className="w-3 h-3 text-slate-400 hover:text-red-500" />
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Status Messages */}
          <AnimatePresence>
            {uploadStatus && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mx-5 mb-3"
              >
                {uploadStatus === 'success' && (
                  <div className="flex items-center space-x-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <div>
                      <p className="text-green-800 font-medium text-sm">Upload Successful!</p>
                      <p className="text-green-600 text-xs">Files have been uploaded and are being processed.</p>
                    </div>
                  </div>
                )}
                
                {uploadStatus === 'error' && (
                  <div className="flex items-start space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-red-800 font-medium text-sm">Upload Failed</p>
                      <p className="text-red-600 text-xs whitespace-pre-line">{errorMessage}</p>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action Buttons */}
          <div className="px-5 pb-5">
            <motion.button
              onClick={handleSubmit}
              disabled={files.length === 0 || uploading}
              className={`w-full py-3 px-5 rounded-lg font-semibold text-white transition-all duration-300 ${
                files.length === 0 || uploading
                  ? 'bg-slate-300 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
              }`}
              whileTap={{ scale: files.length > 0 && !uploading ? 0.98 : 1 }}
            >
              {uploading ? (
                <div className="flex items-center justify-center space-x-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Uploading Files...</span>
                </div>
              ) : (
                <span className="text-sm">{`Upload ${files.length > 0 ? `${files.length} File${files.length > 1 ? 's' : ''}` : 'Files'}`}</span>
              )}
            </motion.button>
          </div>
        </motion.div>

        {/* Info Section */}
        <motion.div 
          className="mt-8 text-center text-slate-600"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <p className="text-sm">
            Supported formats: PDB, PSF, DCD, XYZ, GRO, TRR, XTC, MOL2
          </p>
          <p className="text-xs mt-1 text-slate-400">
            Secure upload with automatic file validation and processing
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default MolecularFileUpload;