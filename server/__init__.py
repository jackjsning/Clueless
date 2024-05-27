from flask import Flask, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from flask_socketio import SocketIO

app = Flask(__name__)

# Configuration
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://zdyxlgrg:97UQFb6Yb7ZKWbyHaEwp0zBHsyb6TPsP@hansken.db.elephantsql.com:5432/zdyxlgrg'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize Database and Migrations
db = SQLAlchemy(app)
migrate = Migrate(app, db)