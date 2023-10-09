from flask import Flask, send_from_directory
from flask_cors import CORS

app = Flask(__name__)
CORS(app, supports_credentials=True)

@app.route('/<path:filename>')
def serve_file(filename):
    directory = 'atlases'
    return send_from_directory(directory, filename)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=4500)