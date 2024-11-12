import React from 'react';

export default function VideoFeed() {
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-gray-800 text-white p-2 rounded-t-lg text-sm font-semibold">
        Live Video Feed
      </div>
      <iframe
        src="https://example.com/video-feed-url"
        width="320"
        height="240"
        allow="autoplay; fullscreen"
        allowFullScreen
        className="rounded-b-lg shadow-lg"
      ></iframe>
    </div>
  );
}