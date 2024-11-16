from flask import Flask, Response, stream_with_context
import cv2
import os
import threading
import time

app = Flask(__name__)

VIDEO_DIR = os.path.abspath(os.path.dirname(__file__))

def generate_frames(video_path):
    """
    Generator function that yields video frames in JPEG format.
    It loops the video to simulate a live stream.
    """
    while True:
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            print(f"Error: Cannot open video {video_path}")
            break

        fps = cap.get(cv2.CAP_PROP_FPS)
        if fps == 0:
            fps = 25  # Default to 25 if FPS is not available
        frame_delay = 1 / fps

        while True:
            success, frame = cap.read()
            if not success:
                # Restart the video
                cap.release()
                break

            # Encode frame as JPEG
            ret, buffer = cv2.imencode('.jpg', frame)
            if not ret:
                continue

            frame_bytes = buffer.tobytes()

            # Yield frame in multipart format
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')

            # Wait to simulate real-time streaming
            time.sleep(frame_delay)

def stream_endpoint(video_filename):
    """
    Returns a Flask response object for streaming the specified video.
    """
    video_path = os.path.join(VIDEO_DIR, video_filename)
    return Response(stream_with_context(generate_frames(video_path)),
                    mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/door')
def stream_door():
    return stream_endpoint('door.mp4')

@app.route('/garage')
def stream_garage():
    return stream_endpoint('garage.mp4')

@app.route('/lawn')
def stream_lawn():
    return stream_endpoint('lawn.mp4')

if __name__ == '__main__':
    # Run the Flask app on all interfaces on port 1194
    app.run(host='0.0.0.0', port=66, threaded=True)
