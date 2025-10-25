/**
 * Collaborative Monaco Editor
 * Extends MonacoEditor with real-time collaboration features
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as monaco from 'monaco-editor';
import { MonacoEditor } from './MonacoEditor';
import { CollaborationService, CollaborationParticipant, CursorPosition } from '../../services/collaboration/CollaborationService';
import { FileItem } from '../../services/continueDevService';

interface CollaborativeMonacoEditorProps {
  value: string;
  language: string;
  onChange?: (value: string) => void;
  file?: FileItem;
  collaborationService: CollaborationService;
  currentUserId: string;
  currentUserName: string;
  className?: string;
}

interface RemoteCursor {
  id: string;
  participant: CollaborationParticipant;
  decorationIds: string[];
}

export const CollaborativeMonacoEditor: React.FC<CollaborativeMonacoEditorProps> = ({
  value,
  language,
  onChange,
  file,
  collaborationService,
  currentUserId,
  currentUserName,
  className = ''
}) => {
  const editorRef = useRef<any>(null);
  const [remoteCursors, setRemoteCursors] = useState<Map<string, RemoteCursor>>(new Map());
  const [participants, setParticipants] = useState<CollaborationParticipant[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  // Handle editor mount
  const handleEditorDidMount = useCallback((editor: any, monacoInstance: any) => {
    editorRef.current = editor;

    // Setup collaboration
    if (file) {
      collaborationService.syncFile(file, editor);
    }

    // Setup cursor tracking
    setupCursorTracking(editor);

    // Setup selection tracking
    setupSelectionTracking(editor);

    // Setup remote cursor rendering
    setupRemoteCursors(editor, monacoInstance);

    // Update connection status
    setIsConnected(collaborationService.isConnected());
  }, [file, collaborationService]);

  // Setup cursor position tracking
  const setupCursorTracking = useCallback((editor: any) => {
    let cursorTimeout: NodeJS.Timeout;

    const updateCursor = () => {
      if (!editor) return;

      const position = editor.getPosition();
      if (position) {
        const cursorPosition: CursorPosition = {
          lineNumber: position.lineNumber,
          column: position.column,
          fileId: file?.id
        };

        collaborationService.updateCursor(currentUserId, cursorPosition);
      }
    };

    // Debounced cursor updates
    const debouncedUpdateCursor = () => {
      clearTimeout(cursorTimeout);
      cursorTimeout = setTimeout(updateCursor, 100);
    };

    editor.onDidChangeCursorPosition(debouncedUpdateCursor);
    editor.onDidChangeCursorSelection(debouncedUpdateCursor);
  }, [collaborationService, currentUserId, file]);

  // Setup selection tracking
  const setupSelectionTracking = useCallback((editor: any) => {
    let selectionTimeout: NodeJS.Timeout;

    const updateSelection = () => {
      if (!editor) return;

      const selection = editor.getSelection();
      if (selection) {
        collaborationService.updateSelection(currentUserId, {
          startLineNumber: selection.startLineNumber,
          startColumn: selection.startColumn,
          endLineNumber: selection.endLineNumber,
          endColumn: selection.endColumn
        });
      }
    };

    // Debounced selection updates
    const debouncedUpdateSelection = () => {
      clearTimeout(selectionTimeout);
      selectionTimeout = setTimeout(updateSelection, 100);
    };

    editor.onDidChangeCursorSelection(debouncedUpdateSelection);
  }, [collaborationService, currentUserId]);

  // Setup remote cursor rendering
  const setupRemoteCursors = useCallback((editor: any, monacoInstance: any) => {
    // Listen for collaboration events
    collaborationService.onEvent('*', (event) => {
      switch (event.type) {
        case 'cursor':
          updateRemoteCursor(event.participantId, event.data);
          break;
        case 'join':
        case 'leave':
          updateParticipants();
          break;
      }
    });

    const updateRemoteCursor = (participantId: string, position: CursorPosition) => {
      if (participantId === currentUserId || !editor) return;

      const participant = participants.find(p => p.id === participantId);
      if (!participant) return;

      // Remove existing cursor decorations for this participant
      const existingCursor = remoteCursors.get(participantId);
      if (existingCursor) {
        existingCursor.decorationIds.forEach(id => {
          editor.deltaDecorations([id], []);
        });
      }

      // Create new cursor decoration
      const cursorDecoration = {
        range: new monacoInstance.Range(
          position.lineNumber,
          position.column,
          position.lineNumber,
          position.column + 1
        ),
        options: {
          className: `remote-cursor remote-cursor-${participantId}`,
          stickiness: monacoInstance.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
          afterContentClassName: `remote-cursor-label remote-cursor-label-${participantId}`,
          after: {
            content: participant.name,
            inlineClassName: `remote-cursor-name remote-cursor-name-${participantId}`
          }
        }
      };

      const decorationIds = editor.deltaDecorations([], [cursorDecoration]);

      // Update remote cursors state
      setRemoteCursors(prev => {
        const newCursors = new Map(prev);
        newCursors.set(participantId, {
          id: participantId,
          participant,
          decorationIds
        });
        return newCursors;
      });
    };

    const updateParticipants = () => {
      setParticipants(collaborationService.getParticipants());
    };
  }, [collaborationService, currentUserId, participants, remoteCursors]);

  // Handle file changes
  useEffect(() => {
    if (file && editorRef.current) {
      collaborationService.syncFile(file, editorRef.current);
    }
  }, [file, collaborationService]);

  // Update participants list
  useEffect(() => {
    setParticipants(collaborationService.getParticipants());
    setIsConnected(collaborationService.isConnected());
  }, [collaborationService]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clean up remote cursors
      remoteCursors.forEach(cursor => {
        if (editorRef.current) {
          cursor.decorationIds.forEach(id => {
            editorRef.current.deltaDecorations([id], []);
          });
        }
      });
    };
  }, [remoteCursors]);

  return (
    <div className={`collaborative-editor ${className}`}>
      {/* Collaboration Status Bar */}
      <div className="collaboration-status-bar flex items-center justify-between p-2 bg-gray-800 text-white text-sm border-b border-gray-700">
        <div className="status-left flex items-center space-x-4">
          <div className={`connection-indicator w-2 h-2 rounded-full ${
            isConnected ? 'bg-green-500' : 'bg-red-500'
          }`} />
          <span className="connection-text">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>

          <div className="participants flex items-center space-x-2">
            <span className="participants-label">Participants:</span>
            {participants.map(participant => (
              <div
                key={participant.id}
                className="participant flex items-center space-x-1"
                title={participant.name}
              >
                <div
                  className="participant-avatar w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium"
                  style={{ backgroundColor: participant.color }}
                >
                  {participant.name.charAt(0).toUpperCase()}
                </div>
                {participant.cursor && (
                  <div className="cursor-indicator w-1 h-4 bg-blue-500 rounded" />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="status-right flex items-center space-x-2">
          <span className="collaboration-mode">
            Real-time Collaboration
          </span>
          <button
            className="invite-btn bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-xs"
            onClick={() => {
              const session = collaborationService.getCurrentSession();
              if (session) {
                navigator.clipboard.writeText(`${window.location.origin}/join/${session.id}`);
                alert('Session link copied to clipboard!');
              }
            }}
          >
            Invite
          </button>
        </div>
      </div>

      {/* Monaco Editor */}
      <MonacoEditor
        value={value}
        language={language}
        onChange={onChange}
        file={file}
        onMount={handleEditorDidMount}
        className="flex-1"
      />

      {/* Remote Cursor Styles */}
      <style jsx>{`
        .remote-cursor {
          position: relative;
          border-left: 2px solid;
          margin-left: -1px;
        }

        .remote-cursor-label {
          position: absolute;
          top: -20px;
          left: 0;
          background: rgba(0, 0, 0, 0.8);
          color: white;
          padding: 2px 4px;
          border-radius: 3px;
          font-size: 11px;
          white-space: nowrap;
          z-index: 1000;
        }

        .remote-cursor-name {
          color: white;
          font-weight: bold;
        }

        ${participants.map(participant => `
          .remote-cursor-${participant.id} {
            border-left-color: ${participant.color};
          }
          .remote-cursor-label-${participant.id} {
            background-color: ${participant.color};
          }
          .remote-cursor-name-${participant.id} {
            color: white;
          }
        `).join('\n')}
      `}</style>
    </div>
  );
};
