#!/usr/bin/env python3
"""
Admin Panel for Airline Game
Runs on port 9001
"""

from flask import Flask, render_template, jsonify, request
import mysql.connector
from datetime import datetime, timedelta
import os

app = Flask(__name__)

# Database configuration from environment variables
DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost').split(':')[0],
    'port': int(os.getenv('DB_HOST', 'localhost:3306').split(':')[1]) if ':' in os.getenv('DB_HOST', 'localhost:3306') else 3306,
    'database': os.getenv('DB_NAME', 'airline'),
    'user': os.getenv('DB_USER', 'mfc01'),
    'password': os.getenv('DB_PASSWORD', 'ghEtmwBdnXYBQH4')
}

def get_db_connection():
    """Get database connection"""
    return mysql.connector.connect(**DB_CONFIG)

@app.route('/')
def index():
    """Main admin dashboard"""
    return render_template('dashboard.html')

@app.route('/api/stats')
def get_stats():
    """Get overall statistics"""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        # Total users
        cursor.execute("SELECT COUNT(*) as total FROM user")
        total_users = cursor.fetchone()['total']
        
        # Active users (last 7 days)
        cursor.execute("""
            SELECT COUNT(*) as active 
            FROM user 
            WHERE last_active >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        """)
        active_users = cursor.fetchone()['active']
        
        # New users (last 30 days)
        cursor.execute("""
            SELECT COUNT(*) as new_users 
            FROM user 
            WHERE creation_time >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        """)
        new_users = cursor.fetchone()['new_users']
        
        # User status breakdown
        cursor.execute("""
            SELECT status, COUNT(*) as count 
            FROM user 
            GROUP BY status
        """)
        status_breakdown = cursor.fetchall()
        
        # Top users by level
        cursor.execute("""
            SELECT user_name, email, level, status, last_active
            FROM user
            ORDER BY level DESC
            LIMIT 10
        """)
        top_users = cursor.fetchall()
        
        return jsonify({
            'total_users': total_users,
            'active_users': active_users,
            'new_users': new_users,
            'status_breakdown': status_breakdown,
            'top_users': top_users
        })
    finally:
        cursor.close()
        conn.close()

@app.route('/api/users')
def get_users():
    """Get all users with pagination"""
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 50))
    search = request.args.get('search', '')
    
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        offset = (page - 1) * per_page
        
        # Build query
        where_clause = ""
        params = []
        if search:
            where_clause = "WHERE u.user_name LIKE %s OR u.email LIKE %s"
            params = [f'%{search}%', f'%{search}%']
        
        # Get total count
        count_query = f"SELECT COUNT(*) as total FROM user u {where_clause}"
        cursor.execute(count_query, params)
        total = cursor.fetchone()['total']
        
        # Get users with airline info
        query = f"""
            SELECT 
                u.id,
                u.user_name,
                u.email,
                u.status,
                u.admin_status,
                u.level,
                u.creation_time,
                u.last_active,
                GROUP_CONCAT(a.name) as airlines
            FROM user u
            LEFT JOIN user_airline ua ON u.user_name = ua.user_name
            LEFT JOIN airline a ON ua.airline = a.id
            {where_clause}
            GROUP BY u.id
            ORDER BY u.last_active DESC
            LIMIT %s OFFSET %s
        """
        cursor.execute(query, params + [per_page, offset])
        users = cursor.fetchall()
        
        # Convert datetime to string
        for user in users:
            if user['creation_time']:
                user['creation_time'] = user['creation_time'].isoformat()
            if user['last_active']:
                user['last_active'] = user['last_active'].isoformat()
        
        return jsonify({
            'users': users,
            'total': total,
            'page': page,
            'per_page': per_page,
            'total_pages': (total + per_page - 1) // per_page
        })
    finally:
        cursor.close()
        conn.close()

@app.route('/api/users/<int:user_id>')
def get_user_details(user_id):
    """Get detailed user information including IP addresses"""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        # Get user info
        cursor.execute("""
            SELECT 
                u.*,
                GROUP_CONCAT(DISTINCT a.id) as airline_ids,
                GROUP_CONCAT(DISTINCT a.name) as airline_names
            FROM user u
            LEFT JOIN user_airline ua ON u.user_name = ua.user_name
            LEFT JOIN airline a ON ua.airline = a.id
            WHERE u.id = %s
            GROUP BY u.id
        """, (user_id,))
        user = cursor.fetchone()
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Convert datetime to string
        if user['creation_time']:
            user['creation_time'] = user['creation_time'].isoformat()
        if user['last_active']:
            user['last_active'] = user['last_active'].isoformat()
        
        # Get IP addresses
        cursor.execute("""
            SELECT ip, occurrence, last_update
            FROM user_ip
            WHERE user = %s
            ORDER BY last_update DESC
            LIMIT 20
        """, (user_id,))
        ips = cursor.fetchall()
        
        for ip in ips:
            if ip['last_update']:
                ip['last_update'] = ip['last_update'].isoformat()
        
        # Get user modifiers
        cursor.execute("""
            SELECT modifier_name, creation
            FROM user_modifier
            WHERE user = %s
        """, (user_id,))
        modifiers = cursor.fetchall()
        
        # Get UUIDs
        cursor.execute("""
            SELECT uuid, occurrence, last_update
            FROM user_uuid
            WHERE user = %s
            ORDER BY last_update DESC
            LIMIT 10
        """, (user_id,))
        uuids = cursor.fetchall()
        
        for uuid in uuids:
            if uuid['last_update']:
                uuid['last_update'] = uuid['last_update'].isoformat()
        
        return jsonify({
            'user': user,
            'ips': ips,
            'modifiers': modifiers,
            'uuids': uuids
        })
    finally:
        cursor.close()
        conn.close()

@app.route('/api/ip/<ip_address>')
def get_users_by_ip(ip_address):
    """Get all users associated with an IP address"""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        cursor.execute("""
            SELECT 
                u.id,
                u.user_name,
                u.email,
                u.status,
                u.level,
                ui.occurrence,
                ui.last_update,
                GROUP_CONCAT(DISTINCT a.name) as airlines
            FROM user_ip ui
            JOIN user u ON ui.user = u.id
            LEFT JOIN user_airline ua ON u.user_name = ua.user_name
            LEFT JOIN airline a ON ua.airline = a.id
            WHERE ui.ip = %s
            GROUP BY u.id
            ORDER BY ui.last_update DESC
        """, (ip_address,))
        users = cursor.fetchall()
        
        for user in users:
            if user['last_update']:
                user['last_update'] = user['last_update'].isoformat()
        
        return jsonify({'users': users, 'ip': ip_address})
    finally:
        cursor.close()
        conn.close()

@app.route('/api/activity')
def get_activity():
    """Get recent user activity"""
    days = int(request.args.get('days', 7))
    
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        cursor.execute("""
            SELECT 
                DATE(last_active) as date,
                COUNT(DISTINCT id) as active_users
            FROM user
            WHERE last_active >= DATE_SUB(NOW(), INTERVAL %s DAY)
            GROUP BY DATE(last_active)
            ORDER BY date DESC
        """, (days,))
        activity = cursor.fetchall()
        
        for row in activity:
            if row['date']:
                row['date'] = row['date'].isoformat()
        
        return jsonify({'activity': activity})
    finally:
        cursor.close()
        conn.close()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=9001, debug=True)
