import React from "react";

export default function VideoFeedPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Video Feed</h1>
      <div className="mt-4">
        <iframe
          src="https://example.com/video-feed-url"
          width="100%"
          height="600"
          allow="autoplay; fullscreen"
          allowFullScreen
          className="rounded-lg shadow-lg"
        ></iframe>
      </div>
    </div>
  );
}
