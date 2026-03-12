from flask import Flask, render_template

app = Flask(__name__)

@app.route('/')
def timer():
    return render_template('index.html')

if __name__ == '__main__':
    print("Starting Event Timer...")
    print("Open your browser to: http://127.0.0.1:5000")
    # debug=True allows auto-reload if you change code, host='0.0.0.0' allows access from other local devices if needed
    app.run(debug=True, port=5000)