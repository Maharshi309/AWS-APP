from flask import Flask, request, jsonify, render_template
import pymysql
import pymysql.cursors
from config import Config

app = Flask(__name__)
app.config.from_object(Config)

# Database Connection Helper
def get_db_connection():
    try:
        connection = pymysql.connect(
            host=app.config['MYSQL_HOST'],
            user=app.config['MYSQL_USER'],
            password=app.config['MYSQL_PASSWORD'],
            database=app.config['MYSQL_DB'],
            cursorclass=pymysql.cursors.DictCursor
        )
        return connection
    except pymysql.MySQLError as e:
        print(f"Error connecting to MySQL Database: {e}")
        return None

# Frontend Route
@app.route('/')
def index():
    return render_template('index.html')

# REST API Endpoints

# 1. GET /students - View all students
@app.route('/students', methods=['GET'])
def get_students():
    conn = get_db_connection()
    if conn is None:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT * FROM students")
            students = cursor.fetchall()
        return jsonify(students), 200
    except pymysql.MySQLError as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

# 2. GET /students/<id> - View a specific student
@app.route('/students/<int:id>', methods=['GET'])
def get_student(id):
    conn = get_db_connection()
    if conn is None:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT * FROM students WHERE id = %s", (id,))
            student = cursor.fetchone()
        
        if student:
            return jsonify(student), 200
        else:
            return jsonify({'message': 'Student not found'}), 404
    except pymysql.MySQLError as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

# 3. POST /students - Add new student
@app.route('/students', methods=['POST'])
def add_student():
    data = request.get_json()
    if not data or not 'name' in data or not 'email' in data:
        return jsonify({'error': 'Name and email are required'}), 400
    
    name = data['name']
    email = data['email']
    phone = data.get('phone', '')
    course = data.get('course', '')
    
    conn = get_db_connection()
    if conn is None:
        return jsonify({'error': 'Database connection failed'}), 500

    try:
        with conn.cursor() as cursor:
            sql = "INSERT INTO students (name, email, phone, course) VALUES (%s, %s, %s, %s)"
            cursor.execute(sql, (name, email, phone, course))
        conn.commit()
        return jsonify({'message': 'Student created successfully'}), 201
    except pymysql.MySQLError as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

# 4. PUT /students/<id> - Edit student
@app.route('/students/<int:id>', methods=['PUT'])
def update_student(id):
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    conn = get_db_connection()
    if conn is None:
        return jsonify({'error': 'Database connection failed'}), 500

    try:
        # Check if student exists
        with conn.cursor() as cursor:
            cursor.execute("SELECT * FROM students WHERE id = %s", (id,))
            student = cursor.fetchone()
            
            if not student:
                return jsonify({'message': 'Student not found'}), 404

            # Update fields
            name = data.get('name', student['name'])
            email = data.get('email', student['email'])
            phone = data.get('phone', student['phone'])
            course = data.get('course', student['course'])

            sql = "UPDATE students SET name=%s, email=%s, phone=%s, course=%s WHERE id=%s"
            cursor.execute(sql, (name, email, phone, course, id))
        conn.commit()
        return jsonify({'message': 'Student updated successfully'}), 200
    except pymysql.MySQLError as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

# 5. DELETE /students/<id> - Delete student
@app.route('/students/<int:id>', methods=['DELETE'])
def delete_student(id):
    conn = get_db_connection()
    if conn is None:
        return jsonify({'error': 'Database connection failed'}), 500

    try:
        with conn.cursor() as cursor:
            # Check if student exists
            cursor.execute("SELECT id FROM students WHERE id = %s", (id,))
            if not cursor.fetchone():
                return jsonify({'message': 'Student not found'}), 404

            cursor.execute("DELETE FROM students WHERE id = %s", (id,))
        conn.commit()
        return jsonify({'message': 'Student deleted successfully'}), 200
    except pymysql.MySQLError as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

if __name__ == '__main__':
    app.run(debug=True)
