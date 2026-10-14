from flask import Flask, send_file

# Optional: the timer is a static page and runs without any server
# (double-click "Start Timer.command" or open index.html directly).
# Use this only if you want to open it from another device on the network.
app = Flask(__name__, static_folder='static')

@app.route('/')
def timer():
    return send_file('index.html')

if __name__ == '__main__':
    print("Starting Event Timer...")
    print("Open your browser to: http://127.0.0.1:5000")
    app.run(debug=False, port=5000)
