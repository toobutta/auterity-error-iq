/**
 * Multimodal Triage Interface Component
 *
 * Provides a unified interface for voice commands, screenshot analysis,
 * and log dump processing for intelligent incident triage
 */

import React, { useState, useRef, useCallback } from 'react';
import {
  multimodalTriageService,
  VoiceCommand,
  ScreenshotAnalysis,
  LogDump,
  MultimodalAnalysisResult
} from '../../services/multimodalTriageService.js';
import {
  MicrophoneIcon,
  StopIcon,
  CameraIcon,
  DocumentTextIcon,
  PlayIcon,
  XMarkIcon,
  CloudArrowUpIcon,
  SpeakerWaveIcon,
  PhotoIcon,
  DocumentIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  Cog6ToothIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { MicrophoneIcon as MicrophoneSolidIcon } from '@heroicons/react/24/solid';

interface MultimodalTriageInterfaceProps {
  tenantId?: string;
  onAnalysisComplete?: (result: MultimodalAnalysisResult) => void;
  onTriageCreated?: (triageData: any) => void;
  className?: string;
}

type ModalityType = 'voice' | 'screenshot' | 'log' | 'multimodal';

interface AnalysisState {
  isRecording: boolean;
  isProcessing: boolean;
  recordedAudio: Blob | null;
  selectedFile: File | null;
  analysisResult: MultimodalAnalysisResult | null;
  error: string | null;
}

export const MultimodalTriageInterface: React.FC<MultimodalTriageInterfaceProps> = ({
  tenantId = 'default_tenant',
  onAnalysisComplete,
  onTriageCreated,
  className = ''
}) => {
  const [activeModality, setActiveModality] = useState<ModalityType>('voice');
  const [analysisState, setAnalysisState] = useState<AnalysisState>({
    isRecording: false,
    isProcessing: false,
    recordedAudio: null,
    selectedFile: null,
    analysisResult: null,
    error: null
  });

  // Refs for media handling
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Voice recording
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        setAnalysisState(prev => ({ ...prev, recordedAudio: audioBlob }));
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setAnalysisState(prev => ({ ...prev, isRecording: true }));

    } catch (error) {
      console.error('Failed to start recording:', error);
      setAnalysisState(prev => ({
        ...prev,
        error: 'Failed to access microphone. Please check permissions.'
      }));
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && analysisState.isRecording) {
      mediaRecorderRef.current.stop();
      setAnalysisState(prev => ({ ...prev, isRecording: false }));
    }
  }, [analysisState.isRecording]);

  // File handling
  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setAnalysisState(prev => ({ ...prev, selectedFile: file }));
    }
  }, []);

  const triggerFileInput = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // Voice command processing
  const processVoiceCommand = useCallback(async () => {
    if (!analysisState.recordedAudio) return;

    setAnalysisState(prev => ({ ...prev, isProcessing: true, error: null }));

    try {
      // Convert blob to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Audio = reader.result as string;

        const voiceCommand: VoiceCommand = {
          transcript: '', // Will be filled by AI service
          confidence: 0, // Will be filled by AI service
          language: 'en-US',
          duration: 0, // Calculate from audio
          audioData: base64Audio.split(',')[1], // Remove data URL prefix
          timestamp: new Date(),
          keywords: []
        };

        // Process voice command
        const intent = await multimodalTriageService.processVoiceCommand(voiceCommand);
        const { triageItem, decision } = await multimodalTriageService.voiceCommandToTriageItem(
          voiceCommand,
          intent,
          tenantId
        );

        // Create multimodal analysis result
        const multimodalResult = await multimodalTriageService.performMultimodalAnalysis(
          voiceCommand,
          undefined,
          undefined,
          tenantId
        );

        setAnalysisState(prev => ({
          ...prev,
          isProcessing: false,
          analysisResult: multimodalResult
        }));

        if (onAnalysisComplete) {
          onAnalysisComplete(multimodalResult);
        }

        if (onTriageCreated) {
          onTriageCreated({ triageItem, decision, multimodalResult });
        }
      };

      reader.readAsDataURL(analysisState.recordedAudio);

    } catch (error) {
      console.error('Voice processing failed:', error);
      setAnalysisState(prev => ({
        ...prev,
        isProcessing: false,
        error: error instanceof Error ? error.message : 'Voice processing failed'
      }));
    }
  }, [analysisState.recordedAudio, tenantId, onAnalysisComplete, onTriageCreated]);

  // Screenshot analysis
  const processScreenshot = useCallback(async () => {
    if (!analysisState.selectedFile) return;

    setAnalysisState(prev => ({ ...prev, isProcessing: true, error: null }));

    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Image = reader.result as string;

        // Get image dimensions
        const img = new Image();
        img.onload = async () => {
          const screenshot: ScreenshotAnalysis = {
            imageData: base64Image.split(',')[1], // Remove data URL prefix
            format: analysisState.selectedFile!.type.split('/')[1] as any,
            dimensions: { width: img.width, height: img.height },
            fileSize: analysisState.selectedFile!.size,
            timestamp: new Date(),
            metadata: {
              filename: analysisState.selectedFile!.name,
              uploadedBy: 'user'
            }
          };

          // Process screenshot
          const analysis = await multimodalTriageService.analyzeScreenshot(screenshot);
          const { triageItem, decision } = await multimodalTriageService.screenshotToTriageItem(
            screenshot,
            analysis,
            tenantId
          );

          // Create multimodal analysis result
          const multimodalResult = await multimodalTriageService.performMultimodalAnalysis(
            undefined,
            screenshot,
            undefined,
            tenantId
          );

          setAnalysisState(prev => ({
            ...prev,
            isProcessing: false,
            analysisResult: multimodalResult
          }));

          if (onAnalysisComplete) {
            onAnalysisComplete(multimodalResult);
          }

          if (onTriageCreated) {
            onTriageCreated({ triageItem, decision, multimodalResult });
          }
        };
        img.src = base64Image;
      };

      reader.readAsDataURL(analysisState.selectedFile);

    } catch (error) {
      console.error('Screenshot processing failed:', error);
      setAnalysisState(prev => ({
        ...prev,
        isProcessing: false,
        error: error instanceof Error ? error.message : 'Screenshot processing failed'
      }));
    }
  }, [analysisState.selectedFile, tenantId, onAnalysisComplete, onTriageCreated]);

  // Log dump processing
  const processLogDump = useCallback(async () => {
    if (!analysisState.selectedFile) return;

    setAnalysisState(prev => ({ ...prev, isProcessing: true, error: null }));

    try {
      // Read log file content
      const reader = new FileReader();
      reader.onloadend = async () => {
        const logData = reader.result as string;

        const logDump: LogDump = {
          logData,
          format: 'text', // Could be enhanced to detect format
          source: analysisState.selectedFile!.name,
          timestamp: new Date(),
          fileSize: analysisState.selectedFile!.size,
          metadata: {
            filename: analysisState.selectedFile!.name,
            uploadedBy: 'user',
            encoding: 'utf-8'
          }
        };

        // Process log dump
        const analysis = await multimodalTriageService.processLogDump(logDump);
        const { triageItem, decision } = await multimodalTriageService.logDumpToTriageItem(
          logDump,
          analysis,
          tenantId
        );

        // Create multimodal analysis result
        const multimodalResult = await multimodalTriageService.performMultimodalAnalysis(
          undefined,
          undefined,
          logDump,
          tenantId
        );

        setAnalysisState(prev => ({
          ...prev,
          isProcessing: false,
          analysisResult: multimodalResult
        }));

        if (onAnalysisComplete) {
          onAnalysisComplete(multimodalResult);
        }

        if (onTriageCreated) {
          onTriageCreated({ triageItem, decision, multimodalResult });
        }
      };

      reader.readAsText(analysisState.selectedFile);

    } catch (error) {
      console.error('Log processing failed:', error);
      setAnalysisState(prev => ({
        ...prev,
        isProcessing: false,
        error: error instanceof Error ? error.message : 'Log processing failed'
      }));
    }
  }, [analysisState.selectedFile, tenantId, onAnalysisComplete, onTriageCreated]);

  // Multimodal analysis
  const performMultimodalAnalysis = useCallback(async () => {
    if (!analysisState.recordedAudio && !analysisState.selectedFile) return;

    setAnalysisState(prev => ({ ...prev, isProcessing: true, error: null }));

    try {
      let voiceCommand: VoiceCommand | undefined;
      let screenshot: ScreenshotAnalysis | undefined;
      let logDump: LogDump | undefined;

      // Prepare voice command if available
      if (analysisState.recordedAudio) {
        const reader = new FileReader();
        await new Promise<void>((resolve) => {
          reader.onloadend = () => {
            const base64Audio = reader.result as string;
            voiceCommand = {
              transcript: '',
              confidence: 0,
              language: 'en-US',
              duration: 0,
              audioData: base64Audio.split(',')[1],
              timestamp: new Date(),
              keywords: []
            };
            resolve();
          };
          if (analysisState.recordedAudio) {
            reader.readAsDataURL(analysisState.recordedAudio);
          }
        });
      }

      // Prepare screenshot or log dump if available
      if (analysisState.selectedFile) {
        const reader = new FileReader();
        const isImage = analysisState.selectedFile.type.startsWith('image/');

        if (isImage) {
          // Screenshot
          await new Promise<void>((resolve) => {
            reader.onloadend = () => {
              const base64Image = reader.result as string;
              const img = new Image();
              img.onload = () => {
                screenshot = {
                  imageData: base64Image.split(',')[1],
                  format: analysisState.selectedFile!.type.split('/')[1] as any,
                  dimensions: { width: img.width, height: img.height },
                  fileSize: analysisState.selectedFile!.size,
                  timestamp: new Date(),
                  metadata: { filename: analysisState.selectedFile!.name }
                };
                resolve();
              };
              img.src = base64Image;
            };
            if (analysisState.selectedFile) {
              reader.readAsDataURL(analysisState.selectedFile);
            }
          });
        } else {
          // Log dump
          await new Promise<void>((resolve) => {
            reader.onloadend = () => {
              const logData = reader.result as string;
              logDump = {
                logData,
                format: 'text',
                source: analysisState.selectedFile!.name,
                timestamp: new Date(),
                fileSize: analysisState.selectedFile!.size,
                metadata: { filename: analysisState.selectedFile!.name }
              };
              resolve();
            };
            if (analysisState.selectedFile) {
              reader.readAsText(analysisState.selectedFile);
            }
          });
        }
      }

      // Perform multimodal analysis
      const result = await multimodalTriageService.performMultimodalAnalysis(
        voiceCommand,
        screenshot,
        logDump,
        tenantId
      );

      setAnalysisState(prev => ({
        ...prev,
        isProcessing: false,
        analysisResult: result
      }));

      if (onAnalysisComplete) {
        onAnalysisComplete(result);
      }

    } catch (error) {
      console.error('Multimodal analysis failed:', error);
      setAnalysisState(prev => ({
        ...prev,
        isProcessing: false,
        error: error instanceof Error ? error.message : 'Analysis failed'
      }));
    }
  }, [analysisState.recordedAudio, analysisState.selectedFile, tenantId, onAnalysisComplete]);

  // Clear current analysis
  const clearAnalysis = useCallback(() => {
    setAnalysisState({
      isRecording: false,
      isProcessing: false,
      recordedAudio: null,
      selectedFile: null,
      analysisResult: null,
      error: null
    });

    // Stop any ongoing recording
    if (mediaRecorderRef.current && analysisState.isRecording) {
      mediaRecorderRef.current.stop();
    }
  }, [analysisState.isRecording]);

  // Get modality icon
  const getModalityIcon = (modality: ModalityType, isActive: boolean = false) => {
    const baseClasses = "h-6 w-6";
    const activeClasses = isActive ? "text-blue-600" : "text-gray-400";

    switch (modality) {
      case 'voice':
        return isActive && analysisState.isRecording ?
          <MicrophoneSolidIcon className={`${baseClasses} text-red-500`} /> :
          <MicrophoneIcon className={`${baseClasses} ${activeClasses}`} />;
      case 'screenshot':
        return <PhotoIcon className={`${baseClasses} ${activeClasses}`} />;
      case 'log':
        return <DocumentIcon className={`${baseClasses} ${activeClasses}`} />;
      case 'multimodal':
        return <Cog6ToothIcon className={`${baseClasses} ${activeClasses}`} />;
      default:
        return <DocumentTextIcon className={`${baseClasses} ${activeClasses}`} />;
    }
  };

  // Get processing action
  const getProcessingAction = () => {
    switch (activeModality) {
      case 'voice':
        return analysisState.recordedAudio ? processVoiceCommand : null;
      case 'screenshot':
        return analysisState.selectedFile ? processScreenshot : null;
      case 'log':
        return analysisState.selectedFile ? processLogDump : null;
      case 'multimodal':
        return (analysisState.recordedAudio || analysisState.selectedFile) ? performMultimodalAnalysis : null;
      default:
        return null;
    }
  };

  const processingAction = getProcessingAction();

  return (
    <div className={`multimodal-triage-interface ${className}`}>
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Multimodal Triage</h2>
        <p className="text-gray-600">Use voice commands, screenshots, or log files to quickly triage incidents</p>
      </div>

      {/* Modality Selection */}
      <div className="mb-8">
        <div className="flex flex-wrap gap-2 mb-4">
          {(['voice', 'screenshot', 'log', 'multimodal'] as ModalityType[]).map((modality) => (
            <button
              key={modality}
              onClick={() => setActiveModality(modality)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                activeModality === modality
                  ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border-2 border-transparent'
              }`}
            >
              {getModalityIcon(modality, activeModality === modality)}
              {modality.charAt(0).toUpperCase() + modality.slice(1)}
            </button>
          ))}
        </div>

        {/* Modality Description */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-900 mb-2">
            {activeModality === 'voice' && '🎤 Voice Commands'}
            {activeModality === 'screenshot' && '📸 Screenshot Analysis'}
            {activeModality === 'log' && '📄 Log File Analysis'}
            {activeModality === 'multimodal' && '🔄 Multimodal Analysis'}
          </h3>
          <p className="text-blue-800 text-sm">
            {activeModality === 'voice' && 'Speak naturally to describe issues, request actions, or ask questions about system status.'}
            {activeModality === 'screenshot' && 'Upload screenshots of error messages, dashboards, or system states for automatic analysis.'}
            {activeModality === 'log' && 'Upload log files to detect anomalies, patterns, and potential issues.'}
            {activeModality === 'multimodal' && 'Combine multiple input types for comprehensive incident analysis.'}
          </p>
        </div>
      </div>

      {/* Input Section */}
      <div className="mb-8">
        {activeModality === 'voice' && (
          <div className="text-center">
            <div className="mb-6">
              {!analysisState.recordedAudio ? (
                <div className="space-y-4">
                  <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center transition-colors ${
                    analysisState.isRecording ? 'bg-red-100' : 'bg-gray-100'
                  }`}>
                    {getModalityIcon('voice', true)}
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {analysisState.isRecording ? 'Recording...' : 'Record Voice Command'}
                    </h3>
                    <p className="text-gray-600">
                      {analysisState.isRecording
                        ? 'Speak clearly and describe the issue or request'
                        : 'Click record and describe the incident or issue'
                      }
                    </p>
                  </div>
                  <button
                    onClick={analysisState.isRecording ? stopRecording : startRecording}
                    className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 mx-auto ${
                      analysisState.isRecording
                        ? 'bg-red-600 text-white hover:bg-red-700'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {analysisState.isRecording ? (
                      <>
                        <StopIcon className="h-5 w-5" />
                        Stop Recording
                      </>
                    ) : (
                      <>
                        <MicrophoneIcon className="h-5 w-5" />
                        Start Recording
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="w-24 h-24 mx-auto rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircleIcon className="h-12 w-12 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Recording Complete</h3>
                    <p className="text-gray-600">Click analyze to process your voice command</p>
                  </div>
                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={clearAnalysis}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
                    >
                      <XMarkIcon className="h-4 w-4" />
                      Record Again
                    </button>
                    <button
                      onClick={processVoiceCommand}
                      disabled={analysisState.isProcessing}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                      <PlayIcon className="h-4 w-4" />
                      {analysisState.isProcessing ? 'Analyzing...' : 'Analyze Voice'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {(activeModality === 'screenshot' || activeModality === 'log') && (
          <div className="text-center">
            <div className="mb-6">
              {!analysisState.selectedFile ? (
                <div className="space-y-4">
                  <div className="w-24 h-24 mx-auto rounded-full bg-gray-100 flex items-center justify-center">
                    {activeModality === 'screenshot' ? (
                      <CameraIcon className="h-12 w-12 text-gray-400" />
                    ) : (
                      <DocumentTextIcon className="h-12 w-12 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {activeModality === 'screenshot' ? 'Upload Screenshot' : 'Upload Log File'}
                    </h3>
                    <p className="text-gray-600">
                      {activeModality === 'screenshot'
                        ? 'Select an image file containing error messages or system states'
                        : 'Select a log file to analyze for anomalies and patterns'
                      }
                    </p>
                  </div>
                  <button
                    onClick={triggerFileInput}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto"
                  >
                    <CloudArrowUpIcon className="h-5 w-5" />
                    Choose File
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="w-24 h-24 mx-auto rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircleIcon className="h-12 w-12 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">File Selected</h3>
                    <p className="text-gray-600 mb-2">{analysisState.selectedFile.name}</p>
                    <p className="text-sm text-gray-500">
                      {(analysisState.selectedFile.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={clearAnalysis}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
                    >
                      <XMarkIcon className="h-4 w-4" />
                      Choose Different File
                    </button>
                    <button
                      onClick={activeModality === 'screenshot' ? processScreenshot : processLogDump}
                      disabled={analysisState.isProcessing}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                      <PlayIcon className="h-4 w-4" />
                      {analysisState.isProcessing ? 'Analyzing...' : 'Analyze File'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeModality === 'multimodal' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Voice Input */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900 flex items-center gap-2">
                    <MicrophoneIcon className="h-5 w-5" />
                    Voice Command
                  </h4>
                  {analysisState.recordedAudio && (
                    <CheckCircleIcon className="h-5 w-5 text-green-500" />
                  )}
                </div>
                {!analysisState.recordedAudio ? (
                  <button
                    onClick={analysisState.isRecording ? stopRecording : startRecording}
                    className={`w-full px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                      analysisState.isRecording
                        ? 'bg-red-100 text-red-700 border-2 border-red-300'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {analysisState.isRecording ? (
                      <>
                        <StopIcon className="h-4 w-4" />
                        Recording...
                      </>
                    ) : (
                      <>
                        <MicrophoneIcon className="h-4 w-4" />
                        Record Voice
                      </>
                    )}
                  </button>
                ) : (
                  <div className="text-sm text-green-600 flex items-center gap-1">
                    <CheckCircleIcon className="h-4 w-4" />
                    Voice recorded
                  </div>
                )}
              </div>

              {/* File Input */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900 flex items-center gap-2">
                    <DocumentIcon className="h-5 w-5" />
                    Screenshot or Log File
                  </h4>
                  {analysisState.selectedFile && (
                    <CheckCircleIcon className="h-5 w-5 text-green-500" />
                  )}
                </div>
                {!analysisState.selectedFile ? (
                  <button
                    onClick={triggerFileInput}
                    className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                  >
                    <CloudArrowUpIcon className="h-4 w-4" />
                    Choose File
                  </button>
                ) : (
                  <div className="text-sm text-green-600">
                    <div className="flex items-center gap-1 mb-1">
                      <CheckCircleIcon className="h-4 w-4" />
                      {analysisState.selectedFile.name}
                    </div>
                    <div className="text-gray-500">
                      {(analysisState.selectedFile.size / 1024).toFixed(1)} KB
                    </div>
                  </div>
                )}
              </div>
            </div>

            {(analysisState.recordedAudio || analysisState.selectedFile) && (
              <div className="text-center">
                <button
                  onClick={performMultimodalAnalysis}
                  disabled={analysisState.isProcessing}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto disabled:opacity-50"
                >
                  <PlayIcon className="h-5 w-5" />
                  {analysisState.isProcessing ? 'Analyzing...' : 'Perform Multimodal Analysis'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept={activeModality === 'screenshot' ? 'image/*' : activeModality === 'log' ? '.log,.txt,.json,.xml,.csv' : '*'}
          onChange={handleFileSelect}
          className="hidden"
          title="File upload for multimodal triage analysis"
        />
      </div>

      {/* Error Display */}
      {analysisState.error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
            <span className="text-red-800 font-medium">Analysis Error</span>
          </div>
          <p className="text-red-700 mt-1">{analysisState.error}</p>
          <button
            onClick={() => setAnalysisState(prev => ({ ...prev, error: null }))}
            className="mt-2 text-sm text-red-600 hover:text-red-700"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Analysis Results */}
      {analysisState.analysisResult && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Analysis Results</h3>
            <button
              onClick={clearAnalysis}
              className="px-3 py-1 text-sm bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors"
            >
              Clear Results
            </button>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            {/* Overall Assessment */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900">Overall Assessment</h4>
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                  analysisState.analysisResult.integratedAssessment.overallSeverity === 'critical' ? 'bg-red-100 text-red-800' :
                  analysisState.analysisResult.integratedAssessment.overallSeverity === 'high' ? 'bg-orange-100 text-orange-800' :
                  analysisState.analysisResult.integratedAssessment.overallSeverity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {analysisState.analysisResult.integratedAssessment.overallSeverity.toUpperCase()}
                </span>
              </div>
              <p className="text-gray-700 mb-2">
                {analysisState.analysisResult.integratedAssessment.summary}
              </p>
              <div className="text-sm text-gray-600">
                <strong>Confidence:</strong> {(analysisState.analysisResult.integratedAssessment.confidence * 100).toFixed(1)}%
              </div>
            </div>

            {/* Modality-specific Results */}
            {analysisState.analysisResult.voiceAnalysis && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h5 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
                  <SpeakerWaveIcon className="h-4 w-4" />
                  Voice Analysis
                </h5>
                <p className="text-blue-800 text-sm">
                  Intent: {analysisState.analysisResult.voiceAnalysis.intent.intent}
                  (Confidence: {(analysisState.analysisResult.voiceAnalysis.intent.confidence * 100).toFixed(1)}%)
                </p>
              </div>
            )}

            {analysisState.analysisResult.screenshotAnalysis && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <h5 className="font-medium text-green-900 mb-2 flex items-center gap-2">
                  <PhotoIcon className="h-4 w-4" />
                  Screenshot Analysis
                </h5>
                <p className="text-green-800 text-sm">
                  Found {analysisState.analysisResult.screenshotAnalysis.anomalies.length} anomalies
                </p>
              </div>
            )}

            {analysisState.analysisResult.logAnalysis && (
              <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <h5 className="font-medium text-purple-900 mb-2 flex items-center gap-2">
                  <DocumentIcon className="h-4 w-4" />
                  Log Analysis
                </h5>
                <p className="text-purple-800 text-sm">
                  {analysisState.analysisResult.logAnalysis.anomalies.length} anomalies detected,
                  {analysisState.analysisResult.logAnalysis.summary.affectedComponents.length} components affected
                </p>
              </div>
            )}

            {/* Recommended Actions */}
            {analysisState.analysisResult.recommendedActions.length > 0 && (
              <div className="mb-6">
                <h5 className="font-medium text-gray-900 mb-3">Recommended Actions</h5>
                <div className="space-y-2">
                  {analysisState.analysisResult.recommendedActions.map((action: { id: string; description: string; priority: number; type: string; estimatedTime: number }, index: number) => (
                    <div key={action.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className={`w-2 h-2 rounded-full mt-2 ${
                        action.priority >= 4 ? 'bg-red-500' :
                        action.priority >= 3 ? 'bg-orange-500' :
                        action.priority >= 2 ? 'bg-yellow-500' : 'bg-green-500'
                      }`} />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-900">{action.description}</span>
                          <span className={`px-2 py-1 text-xs font-medium rounded ${
                            action.type === 'immediate' ? 'bg-red-100 text-red-800' :
                            action.type === 'short_term' ? 'bg-orange-100 text-orange-800' :
                            action.type === 'long_term' ? 'bg-blue-100 text-blue-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {action.type.replace('_', ' ').toUpperCase()}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          Priority: {action.priority}/5 • Est. Time: {action.estimatedTime} min
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Automated Responses */}
            {analysisState.analysisResult.automatedResponses.length > 0 && (
              <div>
                <h5 className="font-medium text-gray-900 mb-3">Automated Responses</h5>
                <div className="space-y-2">
                  {analysisState.analysisResult.automatedResponses.map((response: { status: string; action: string; result?: string }, index: number) => (
                    <div key={index} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                      {response.status === 'completed' ? (
                        <CheckCircleIcon className="h-5 w-5 text-green-500" />
                      ) : response.status === 'failed' ? (
                        <XCircleIcon className="h-5 w-5 text-red-500" />
                      ) : (
                        <ClockIcon className="h-5 w-5 text-blue-500" />
                      )}
                      <span className="text-sm text-gray-700">{response.action}</span>
                      {response.result && (
                        <span className="text-xs text-gray-500 ml-auto">
                          {response.result}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Processing Indicator */}
      {analysisState.isProcessing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Analyzing...</h3>
            <p className="text-gray-600">Processing your input with AI-powered analysis</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MultimodalTriageInterface;
