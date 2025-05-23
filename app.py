from flask import Flask, render_template
from flask_cors import CORS
from routes import bp as routes_bp

app = Flask(__name__)
CORS(app)  # Enable CORS for all routesss

# Register Blueprint
app.register_blueprint(routes_bp , url_prefix='/api')

@app.route('/')
def index():
    return render_template('index.html')

# Run the Flask application
if __name__ == "__main__":
    try:
        app.run(debug=True)
    except Exception as e:
        print(f"Error running the app: {str(e)}")
