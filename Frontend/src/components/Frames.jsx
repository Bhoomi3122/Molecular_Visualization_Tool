import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, ChevronRight, ChevronLeft, AlertCircle, CheckCircle, Info, Calculator } from 'lucide-react';

const FrameSelectionTool = () => {
  // State management
  const [currentStep, setCurrentStep] = useState(1);
  const [totalFrames] = useState(200); // Dummy data - replace with API call later
  const [totalFramesRequested, setTotalFramesRequested] = useState('');
  const [frameRanges, setFrameRanges] = useState('');
  const [specificFrames, setSpecificFrames] = useState('');
  const [errors, setErrors] = useState({});
  const [calculation, setCalculation] = useState(null);

  // Validation functions
  const validateTotalFrames = (value) => {
    const num = parseInt(value);
    if (!value || isNaN(num) || num <= 0) {
      return 'Please enter a valid positive number';
    }
    if (num > totalFrames) {
      return `Cannot exceed total available frames (${totalFrames})`;
    }
    return null;
  };

  const parseRanges = (rangeString) => {
    if (!rangeString.trim()) return [];
    
    const ranges = rangeString.split(',').map(r => r.trim());
    const parsedRanges = [];
    
    for (const range of ranges) {
      if (range.includes('-')) {
        const [start, end] = range.split('-').map(n => parseInt(n.trim()));
        if (isNaN(start) || isNaN(end) || start <= 0 || end <= 0 || start > end) {
          throw new Error(`Invalid range format: ${range}`);
        }
        if (start > totalFrames || end > totalFrames) {
          throw new Error(`Range ${range} exceeds total frames (${totalFrames})`);
        }
        parsedRanges.push({ start, end, type: 'range' });
      } else {
        const frame = parseInt(range);
        if (isNaN(frame) || frame <= 0) {
          throw new Error(`Invalid frame number: ${range}`);
        }
        if (frame > totalFrames) {
          throw new Error(`Frame ${frame} exceeds total frames (${totalFrames})`);
        }
        parsedRanges.push({ frame, type: 'single' });
      }
    }
    
    return parsedRanges;
  };

  const validateRanges = (rangeString) => {
    if (!rangeString.trim()) return null;
    
    try {
      parseRanges(rangeString);
      return null;
    } catch (error) {
      return error.message;
    }
  };

  const parseSpecificFrames = (frameString) => {
    if (!frameString.trim()) return [];
    
    const frames = frameString.split(',').map(f => {
      const frame = parseInt(f.trim());
      if (isNaN(frame) || frame <= 0) {
        throw new Error(`Invalid frame number: ${f.trim()}`);
      }
      if (frame > totalFrames) {
        throw new Error(`Frame ${frame} exceeds total frames (${totalFrames})`);
      }
      return frame;
    });
    
    return frames;
  };

  const validateSpecificFrames = (frameString) => {
    if (!frameString.trim()) return null;
    
    try {
      parseSpecificFrames(frameString);
      return null;
    } catch (error) {
      return error.message;
    }
  };

  const calculateFrameSelection = () => {
    try {
      const ranges = parseRanges(frameRanges);
      const specific = parseSpecificFrames(specificFrames);
      
      // Calculate total frames from ranges
      let rangeFrameCount = 0;
      const rangeFrames = [];
      
      ranges.forEach(range => {
        if (range.type === 'range') {
          const count = range.end - range.start + 1;
          rangeFrameCount += count;
          for (let i = range.start; i <= range.end; i++) {
            rangeFrames.push(i);
          }
        } else {
          rangeFrameCount += 1;
          rangeFrames.push(range.frame);
        }
      });

      // Check for overlaps between ranges and specific frames
      const allSelectedFrames = new Set([...rangeFrames, ...specific]);
      const totalSelectedFrames = allSelectedFrames.size;
      
      const requested = parseInt(totalFramesRequested);
      const extraFramesNeeded = Math.max(0, requested - totalSelectedFrames);
      
      const duplicateCount = (rangeFrames.length + specific.length) - totalSelectedFrames;
      
      return {
        rangeFrameCount,
        specificFrameCount: specific.length,
        totalSelectedFrames,
        duplicateCount,
        extraFramesNeeded,
        totalRequested: requested,
        isValid: totalSelectedFrames <= requested
      };
    } catch (error) {
      throw error;
    }
  };

  const handleStepValidation = (step) => {
    const newErrors = {};
    
    if (step >= 1) {
      const totalError = validateTotalFrames(totalFramesRequested);
      if (totalError) newErrors.totalFrames = totalError;
    }
    
    if (step >= 2) {
      const rangeError = validateRanges(frameRanges);
      if (rangeError) newErrors.ranges = rangeError;
    }
    
    if (step >= 3) {
      const specificError = validateSpecificFrames(specificFrames);
      if (specificError) newErrors.specific = specificError;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (handleStepValidation(currentStep)) {
      if (currentStep === 3) {
        try {
          const calc = calculateFrameSelection();
          setCalculation(calc);
        } catch (error) {
          setErrors({ calculation: error.message });
          return;
        }
      }
      setCurrentStep(prev => Math.min(prev + 1, 4));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    setErrors({});
  };

  const reset = () => {
    setCurrentStep(1);
    setTotalFramesRequested('');
    setFrameRanges('');
    setSpecificFrames('');
    setErrors({});
    setCalculation(null);
  };

  // Animation variants
  const stepVariants = {
    hidden: { opacity: 0, x: 50 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: { duration: 0.4, ease: "easeOut" }
    },
    exit: { 
      opacity: 0, 
      x: -50,
      transition: { duration: 0.3 }
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-10 px-4 font-inter">
      <motion.div 
        className="max-w-3xl mx-auto"
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
            Frame Selection for Movie Generation
          </motion.h1>
          <motion.p 
            className="text-slate-600 text-base"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            Configure frame selection parameters for your molecular simulation movie
          </motion.p>
        </div>

        {/* Progress Bar */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center justify-between mb-2">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
                  step <= currentStep 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-slate-200 text-slate-500'
                }`}>
                  {step}
                </div>
                {step < 4 && (
                  <div className={`w-12 h-1 mx-2 transition-all duration-300 ${
                    step < currentStep ? 'bg-blue-600' : 'bg-slate-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="text-xs text-slate-500 flex justify-between">
            <span>Total Frames</span>
            <span>Frame Ranges</span>
            <span>Specific Frames</span>
            <span>Summary</span>
          </div>
        </motion.div>

        {/* Main Card */}
        <motion.div 
          className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          {/* Info Banner */}
          <div className="bg-blue-50 border-b border-blue-100 p-4">
            <div className="flex items-center space-x-2">
              <Info className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-blue-700">
                Available frames in your uploaded files: <strong>{totalFrames}</strong>
              </span>
            </div>
          </div>

          <div className="p-6">
            <AnimatePresence mode="wait">
              {/* Step 1: Total Frames */}
              {currentStep === 1 && (
                <motion.div
                  key="step1"
                  variants={stepVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="space-y-4"
                >
                  <h3 className="text-lg font-semibold text-slate-800 mb-3">
                    Step 1: Total Frames for Movie
                  </h3>
                  <p className="text-slate-600 text-sm mb-4">
                    How many total frames do you want to use for generating the movie?
                  </p>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Number of frames
                    </label>
                    <input
                      type="number"
                      value={totalFramesRequested}
                      onChange={(e) => setTotalFramesRequested(e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all ${
                        errors.totalFrames ? 'border-red-300 bg-red-50' : 'border-slate-300'
                      }`}
                      placeholder={`Enter a number (max: ${totalFrames})`}
                      min="1"
                      max={totalFrames}
                    />
                    {errors.totalFrames && (
                      <div className="flex items-center space-x-1 mt-2 text-red-600">
                        <AlertCircle className="w-4 h-4" />
                        <span className="text-xs">{errors.totalFrames}</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Step 2: Frame Ranges */}
              {currentStep === 2 && (
                <motion.div
                  key="step2"
                  variants={stepVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="space-y-4"
                >
                  <h3 className="text-lg font-semibold text-slate-800 mb-3">
                    Step 2: Frame Ranges
                  </h3>
                  <p className="text-slate-600 text-sm mb-4">
                    Specify ranges of frames you want to include (optional)
                  </p>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Frame ranges
                    </label>
                    <input
                      type="text"
                      value={frameRanges}
                      onChange={(e) => setFrameRanges(e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all ${
                        errors.ranges ? 'border-red-300 bg-red-50' : 'border-slate-300'
                      }`}
                      placeholder="Example: 1-10, 50-100, 150-200"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      Use format: start-end, separated by commas for multiple ranges
                    </p>
                    {errors.ranges && (
                      <div className="flex items-center space-x-1 mt-2 text-red-600">
                        <AlertCircle className="w-4 h-4" />
                        <span className="text-xs">{errors.ranges}</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Step 3: Specific Frames */}
              {currentStep === 3 && (
                <motion.div
                  key="step3"
                  variants={stepVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="space-y-4"
                >
                  <h3 className="text-lg font-semibold text-slate-800 mb-3">
                    Step 3: Specific Frames
                  </h3>
                  <p className="text-slate-600 text-sm mb-4">
                    Specify individual frames you want to include (optional)
                  </p>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Individual frames
                    </label>
                    <input
                      type="text"
                      value={specificFrames}
                      onChange={(e) => setSpecificFrames(e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all ${
                        errors.specific ? 'border-red-300 bg-red-50' : 'border-slate-300'
                      }`}
                      placeholder="Example: 5, 17, 123, 189"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      Enter frame numbers separated by commas
                    </p>
                    {errors.specific && (
                      <div className="flex items-center space-x-1 mt-2 text-red-600">
                        <AlertCircle className="w-4 h-4" />
                        <span className="text-xs">{errors.specific}</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Step 4: Summary */}
              {currentStep === 4 && calculation && (
                <motion.div
                  key="step4"
                  variants={stepVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="space-y-6"
                >
                  <div className="flex items-center space-x-2 mb-4">
                    <Calculator className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-slate-800">
                      Frame Selection Summary
                    </h3>
                  </div>
                  
                  <div className="bg-slate-50 rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600">Total frames requested:</span>
                      <span className="font-semibold text-slate-800">{calculation.totalRequested}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600">Frames from ranges:</span>
                      <span className="font-semibold text-slate-800">{calculation.rangeFrameCount}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600">Specific frames:</span>
                      <span className="font-semibold text-slate-800">{calculation.specificFrameCount}</span>
                    </div>
                    
                    {calculation.duplicateCount > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-amber-600">Duplicate frames removed:</span>
                        <span className="font-semibold text-amber-700">{calculation.duplicateCount}</span>
                      </div>
                    )}
                    
                    <hr className="border-slate-200" />
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600">Total manually selected:</span>
                      <span className="font-semibold text-slate-800">{calculation.totalSelectedFrames}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600">Extra frames needed (random):</span>
                      <span className="font-semibold text-blue-600">{calculation.extraFramesNeeded}</span>
                    </div>
                  </div>

                  {calculation.extraFramesNeeded > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start space-x-2">
                        <Info className="w-4 h-4 text-blue-600 mt-0.5" />
                        <div>
                          <p className="text-sm text-blue-800 font-medium">Additional Selection</p>
                          <p className="text-xs text-blue-700">
                            The system will randomly select {calculation.extraFramesNeeded} additional frames 
                            to reach your requested total of {calculation.totalRequested} frames.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {errors.calculation && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-start space-x-2">
                        <AlertCircle className="w-4 h-4 text-red-600 mt-0.5" />
                        <div>
                          <p className="text-sm text-red-800 font-medium">Calculation Error</p>
                          <p className="text-xs text-red-700">{errors.calculation}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation Buttons */}
            <div className="flex justify-between items-center mt-8 pt-6 border-t border-slate-200">
              <button
                onClick={prevStep}
                disabled={currentStep === 1}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                  currentStep === 1
                    ? 'text-slate-400 cursor-not-allowed'
                    : 'text-slate-600 hover:text-slate-800 hover:bg-slate-100'
                }`}
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="text-sm">Previous</span>
              </button>

              <div className="flex space-x-3">
                {currentStep === 4 && (
                  <button
                    onClick={reset}
                    className="px-4 py-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-all duration-200 text-sm"
                  >
                    Start Over
                  </button>
                )}
                
                <button
                  onClick={nextStep}
                  disabled={currentStep === 4}
                  className={`flex items-center space-x-2 px-5 py-2 rounded-lg font-semibold transition-all duration-200 text-sm ${
                    currentStep === 4
                      ? 'bg-green-600 text-white cursor-default'
                      : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
                  }`}
                >
                  <span>{currentStep === 4 ? 'Configuration Complete' : 'Next Step'}</span>
                  {currentStep !== 4 && <ChevronRight className="w-4 h-4" />}
                  {currentStep === 4 && <CheckCircle className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Footer Info */}
        <motion.div 
          className="mt-6 text-center text-slate-600"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <p className="text-sm">
            Configure your frame selection parameters step by step
          </p>
          <p className="text-xs mt-1 text-slate-400">
            The system will validate all inputs and provide a comprehensive summary
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default FrameSelectionTool;