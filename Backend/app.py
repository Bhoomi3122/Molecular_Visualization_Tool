from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename
import os
import mdtraj as md

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = 'uploads'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Allowed file types
ALLOWED_EXTENSIONS = {'.pdb', '.psf', '.dcd', '.xtc', '.trr', '.xyz', '.gro', '.mol2'}

# To store total frames after upload
total_frames_cache = 0

def allowed_file(filename):
    return '.' in filename and os.path.splitext(filename)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/upload', methods=['POST'])
def upload_files():
    global total_frames_cache
    files = request.files.getlist('files')
    if not files:
        return jsonify({'error': 'No files uploaded'}), 400

    saved_files = []
    for file in files:
        if allowed_file(file.filename):
            filename = secure_filename(file.filename)
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(filepath)
            saved_files.append(filepath)
        else:
            print(f"Unsupported file type skipped: {file.filename}")

    total_frames = count_total_frames(saved_files)
    total_frames_cache = total_frames  # Cache the frame count

    return jsonify({'message': 'Files uploaded successfully', 'total_frames': total_frames}), 200

def count_total_frames(filepaths):
    total_frames = 0
    topology_files = [f for f in filepaths if os.path.splitext(f)[1].lower() in ['.pdb', '.psf']]

    for file in filepaths:
        ext = os.path.splitext(file)[1].lower()

        try:
            if ext in ['.dcd', '.xtc', '.trr']:
                if topology_files:
                    traj = md.load(file, top=topology_files[0])
                    total_frames += traj.n_frames
                    print(f"Processed {file}: {traj.n_frames} frames")
                else:
                    print(f"No topology file found for {file}, cannot count frames.")
            else:
                pass  # Skip non-trajectory files
        except Exception as e:
            print(f"Error processing {file}: {e}")
            continue

    return total_frames

@app.route('/frame_count', methods=['GET'])
def get_frame_count():
    return jsonify({'total_frames': total_frames_cache}), 200

if __name__ == '__main__':
    app.run(debug=True)
