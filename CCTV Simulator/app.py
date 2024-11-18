from flask import Flask, Response, stream_with_context, send_file
from flask_cors import CORS
import cv2
import os
import time
import threading
import io
from PIL import Image

app = Flask(__name__)
CORS(app)

VIDEO_DIR = os.path.abspath(os.path.dirname(__file__))

# Shared variables to store the latest frame
latest_frame = None
frame_lock = threading.Lock()

def generate_frames(video_path):
    global latest_frame
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        print(f"Error: Cannot open video {video_path}")
        return

    # Set a fixed FPS
    fps = 10  # Fixed frame rate at 10 FPS
    frame_delay = 1 / fps

    # Set minimal screen resolution
    screen_width = 320  # QVGA width
    screen_height = 240 # QVGA height

    while True:
        success, frame = cap.read()
        if not success:
            # Restart the video by setting frame position to start
            cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
            continue

        # Resize frame to minimal resolution
        frame = cv2.resize(frame, (screen_width, screen_height))

        # Encode frame as JPEG
        ret, buffer = cv2.imencode('.jpg', frame)
        if not ret:
            continue

        frame_bytes = buffer.tobytes()

        # Update the latest_frame with thread safety
        with frame_lock:
            latest_frame = frame_bytes

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

@app.route('/latest-frame')
def get_latest_frame():
    """
    Returns the latest frame as a JPEG image.
    """
    with frame_lock:
        if latest_frame is None:
            return "No frame available", 503  # Service Unavailable

        # Convert bytes to a BytesIO object
        frame_io = io.BytesIO(latest_frame)

    return send_file(frame_io, mimetype='image/jpeg')

if __name__ == '__main__':
    # Run the Flask app on all interfaces on port 5000
    app.run(host='0.0.0.0', port=5000, threaded=True)

