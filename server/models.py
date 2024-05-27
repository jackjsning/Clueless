from flask_login import UserMixin
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
import pytz

from __init__ import db


game_user_association = db.Table('game_user_association',
    db.Column('game_id', db.Integer, db.ForeignKey('game.id')),
    db.Column('user_id', db.Integer, db.ForeignKey('user.id'))
)
class User(db.Model, UserMixin):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(64), unique=True, index=True)
    password_hash = db.Column(db.String(128))
    games = db.relationship('Game', secondary=game_user_association, back_populates='users')
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

class Game(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    start_time = db.Column(db.DateTime, default=datetime.now(pytz.timezone('US/Eastern')))
    end_time = db.Column(db.DateTime, default=datetime.now(pytz.timezone('US/Eastern')))
    winner_id = db.Column(db.Integer, db.ForeignKey('user.id')) 
    winner = db.relationship('User', foreign_keys=[winner_id]) 
    users = db.relationship('User', secondary=game_user_association, back_populates='games')