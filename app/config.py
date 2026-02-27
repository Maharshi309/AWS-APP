import os

class Config:
    # Database Configuration
    MYSQL_HOST = os.environ.get('MYSQL_HOST', 'localhost')
    MYSQL_USER = os.environ.get('MYSQL_USER', 'root')
    MYSQL_PASSWORD = os.environ.get('MYSQL_PASSWORD', '1310') # Replace with your MySQL password
    MYSQL_DB = os.environ.get('MYSQL_DB', 'student_db')
