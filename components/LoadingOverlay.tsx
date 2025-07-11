// components/LoadingOverlay.tsx
'use client';

interface LoadingOverlayProps {
  isVisible: boolean;
  message: string;
}

export default function LoadingOverlay({ isVisible, message }: LoadingOverlayProps) {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 shadow-xl max-w-sm w-full mx-4">
        <div className="flex flex-col items-center space-y-4">
          {/* Rotating Spinner */}
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          
          {/* Message */}
          <p className="text-lg font-semibold text-gray-800 text-center">
            {message}
          </p>
          
          {/* Subtitle */}
          <p className="text-sm text-gray-500 text-center">
            Please wait while we process your request...
          </p>
        </div>
      </div>
    </div>
  );
} 