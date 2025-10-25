/**
 * Professional Icon Mapping System
 * Replaces emoji usage with professional SVG icons
 */

import React from 'react';
import {
  // Flow Control Icons
  PlayIcon,
  StopIcon,
  ArrowPathIcon,
  QuestionMarkCircleIcon,
  ArrowsRightLeftIcon,
  BoltIcon,
  LinkIcon,
  ClockIcon,
  ScissorsIcon,
  
  // Data Processing Icons
  FunnelIcon,
  ChartBarIcon,
  PlusIcon,
  DocumentTextIcon,
  
  // Integration & API Icons
  GlobeAltIcon,
  CloudArrowDownIcon,
  CloudArrowUpIcon,
  
  // Communication Icons
  EnvelopeIcon,
  DevicePhoneMobileIcon,
  BellIcon,
  ChatBubbleLeftRightIcon,
  UserGroupIcon,
  
  // AI/ML Icons
  CpuChipIcon,
  PhotoIcon,
  TagIcon,
  FaceSmileIcon,
  
  // Database & Storage Icons
  CircleStackIcon,
  FolderIcon,
  CloudIcon,
  ServerIcon,
  
  // Business Logic Icons
  CodeBracketIcon,
  CogIcon,
  ExclamationTriangleIcon,
  
  // Advanced Icons
  WrenchScrewdriverIcon,
  ArchiveBoxIcon,
} from '@heroicons/react/24/outline';

import { NodeType } from '../types/studio';

export interface IconProps {
  className?: string;
  size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl';
}

// Icon size mapping
const sizeClasses = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4', 
  base: 'w-5 h-5',
  lg: 'w-6 h-6',
  xl: 'w-8 h-8'
};

// Professional icon mapping for node types
export const getNodeIcon = (nodeType: NodeType, props: IconProps = {}): JSX.Element => {
  const { className = '', size = 'base' } = props;
  const iconClass = `${sizeClasses[size]} ${className}`;
  
  const iconMap: Record<NodeType, JSX.Element> = {
    // Flow Control
    'start': <PlayIcon className={iconClass} />,
    'end': <StopIcon className={iconClass} />,
    'decision': <ArrowsRightLeftIcon className={iconClass} />,
    'condition': <QuestionMarkCircleIcon className={iconClass} />,
    'switch': <ArrowPathIcon className={iconClass} />,
    'loop': <ArrowPathIcon className={iconClass} />,
    'parallel': <BoltIcon className={iconClass} />,
    'merge': <LinkIcon className={iconClass} />,
    'wait': <ClockIcon className={iconClass} />,
    'delay': <ClockIcon className={iconClass} />,
    'timer': <ClockIcon className={iconClass} />,
    'split': <ScissorsIcon className={iconClass} />,

    // Data Processing
    'data-transform': <ArrowPathIcon className={iconClass} />,
    'filter': <FunnelIcon className={iconClass} />,
    'sort': <ChartBarIcon className={iconClass} />,
    'aggregate': <ChartBarIcon className={iconClass} />,
    'join': <LinkIcon className={iconClass} />,
    'split-data': <ScissorsIcon className={iconClass} />,
    'data-validation': <DocumentTextIcon className={iconClass} />,

    // Integration & API
    'api-call': <GlobeAltIcon className={iconClass} />,
    'webhook': <CloudArrowDownIcon className={iconClass} />,
    'http-request': <GlobeAltIcon className={iconClass} />,
    'graphql': <GlobeAltIcon className={iconClass} />,
    'websocket': <LinkIcon className={iconClass} />,
    'rest-api': <GlobeAltIcon className={iconClass} />,

    // Communication
    'email': <EnvelopeIcon className={iconClass} />,
    'sms': <DevicePhoneMobileIcon className={iconClass} />,
    'notification': <BellIcon className={iconClass} />,
    'slack': <ChatBubbleLeftRightIcon className={iconClass} />,
    'teams': <UserGroupIcon className={iconClass} />,
    'webhook-response': <CloudArrowUpIcon className={iconClass} />,

    // AI/ML
    'ai-model': <CpuChipIcon className={iconClass} />,
    'text-generation': <DocumentTextIcon className={iconClass} />,
    'image-processing': <PhotoIcon className={iconClass} />,
    'classification': <TagIcon className={iconClass} />,
    'sentiment-analysis': <FaceSmileIcon className={iconClass} />,

    // Database & Storage
    'database': <CircleStackIcon className={iconClass} />,
    'file-system': <FolderIcon className={iconClass} />,
    's3-storage': <CloudIcon className={iconClass} />,
    'redis': <ServerIcon className={iconClass} />,
    'mongodb': <CircleStackIcon className={iconClass} />,
    'postgresql': <CircleStackIcon className={iconClass} />,

    // Business Logic
    'action': <BoltIcon className={iconClass} />,
    'script': <CodeBracketIcon className={iconClass} />,
    'function-call': <CogIcon className={iconClass} />,
    'business-rule': <DocumentTextIcon className={iconClass} />,
    'validation-rule': <DocumentTextIcon className={iconClass} />,

    // Advanced
    'custom': <WrenchScrewdriverIcon className={iconClass} />,
    'sub-workflow': <ArchiveBoxIcon className={iconClass} />,
    'error-handler': <ExclamationTriangleIcon className={iconClass} />,
  };

  return iconMap[nodeType] || <CogIcon className={iconClass} />;
};

// Category icons for node palette
export const getCategoryIcon = (categoryId: string, props: IconProps = {}): JSX.Element => {
  const { className = '', size = 'base' } = props;
  const iconClass = `${sizeClasses[size]} ${className}`;
  
  const categoryIcons: Record<string, JSX.Element> = {
    'flow-control': <ArrowPathIcon className={iconClass} />,
    'data-processing': <ChartBarIcon className={iconClass} />,
    'integration': <GlobeAltIcon className={iconClass} />,
    'communication': <EnvelopeIcon className={iconClass} />,
    'ai-ml': <CpuChipIcon className={iconClass} />,
    'database': <CircleStackIcon className={iconClass} />,
    'business-logic': <CodeBracketIcon className={iconClass} />,
    'advanced': <WrenchScrewdriverIcon className={iconClass} />,
  };

  return categoryIcons[categoryId] || <CogIcon className={iconClass} />;
};

// Status and UI icons
export const getStatusIcon = (status: string, props: IconProps = {}): JSX.Element => {
  const { className = '', size = 'base' } = props;
  const iconClass = `${sizeClasses[size]} ${className}`;
  
  const statusIcons: Record<string, JSX.Element> = {
    'running': <PlayIcon className={`${iconClass} text-green-500`} />,
    'stopped': <StopIcon className={`${iconClass} text-red-500`} />,
    'paused': <ClockIcon className={`${iconClass} text-yellow-500`} />,
    'error': <ExclamationTriangleIcon className={`${iconClass} text-red-500`} />,
    'success': <PlayIcon className={`${iconClass} text-green-500`} />,
    'processing': <ArrowPathIcon className={`${iconClass} text-blue-500 animate-spin`} />,
  };

  return statusIcons[status] || <CogIcon className={iconClass} />;
};

// Confidence level indicators
export const getConfidenceIcon = (confidence: number, props: IconProps = {}): JSX.Element => {
  const { className = '', size = 'base' } = props;
  const iconClass = `${sizeClasses[size]} ${className}`;
  
  if (confidence >= 0.9) {
    return <div className={`${iconClass} bg-green-500 rounded-full`} />;
  } else if (confidence >= 0.75) {
    return <div className={`${iconClass} bg-blue-500 rounded-full`} />;
  } else if (confidence >= 0.5) {
    return <div className={`${iconClass} bg-yellow-500 rounded-full`} />;
  } else {
    return <div className={`${iconClass} bg-red-500 rounded-full`} />;
  }
};

// Cost level indicators
export const getCostIcon = (cost: 'low' | 'medium' | 'high', props: IconProps = {}): JSX.Element => {
  const { className = '', size = 'base' } = props;
  const iconClass = `${sizeClasses[size]} ${className}`;
  
  const costColors = {
    low: 'text-green-500',
    medium: 'text-yellow-500', 
    high: 'text-red-500'
  };
  
  return <div className={`${iconClass} ${costColors[cost]} font-bold`}>$</div>;
};

export default {
  getNodeIcon,
  getCategoryIcon,
  getStatusIcon,
  getConfidenceIcon,
  getCostIcon
};
