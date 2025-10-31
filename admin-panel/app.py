#!/usr/bin/env python3
"""
Admin Panel for Airline Game
Runs on port 9001
"""

from flask import Flask, render_template, jsonify, request
import mysql.connector
from datetime import datetime, timedelta
import os
import psutil
import platform

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

@app.route('/api/server/resources')
def get_server_resources():
    """Get server resource usage (CPU, RAM, Disk)"""
    try:
        # CPU usage
        cpu_percent = psutil.cpu_percent(interval=1)
        cpu_count = psutil.cpu_count()
        cpu_freq = psutil.cpu_freq()
        
        # Memory usage
        memory = psutil.virtual_memory()
        memory_total = memory.total / (1024 ** 3)  # GB
        memory_used = memory.used / (1024 ** 3)    # GB
        memory_percent = memory.percent
        
        # Disk usage
        disk = psutil.disk_usage('/')
        disk_total = disk.total / (1024 ** 3)  # GB
        disk_used = disk.used / (1024 ** 3)    # GB
        disk_percent = disk.percent
        
        # Swap memory
        swap = psutil.swap_memory()
        swap_total = swap.total / (1024 ** 3)  # GB
        swap_used = swap.used / (1024 ** 3)    # GB
        swap_percent = swap.percent
        
        # System uptime
        boot_time = datetime.fromtimestamp(psutil.boot_time())
        uptime = datetime.now() - boot_time
        uptime_str = str(uptime).split('.')[0]  # Remove microseconds
        
        # Network info
        net_io = psutil.net_io_counters()
        bytes_sent = net_io.bytes_sent / (1024 ** 3)  # GB
        bytes_recv = net_io.bytes_recv / (1024 ** 3)  # GB
        
        # Process count
        process_count = len(psutil.pids())
        
        return jsonify({
            'cpu': {
                'percent': round(cpu_percent, 2),
                'count': cpu_count,
                'frequency': round(cpu_freq.current, 2) if cpu_freq else 0
            },
            'memory': {
                'total': round(memory_total, 2),
                'used': round(memory_used, 2),
                'percent': round(memory_percent, 2)
            },
            'disk': {
                'total': round(disk_total, 2),
                'used': round(disk_used, 2),
                'percent': round(disk_percent, 2)
            },
            'swap': {
                'total': round(swap_total, 2),
                'used': round(swap_used, 2),
                'percent': round(swap_percent, 2)
            },
            'network': {
                'sent': round(bytes_sent, 2),
                'received': round(bytes_recv, 2)
            },
            'system': {
                'uptime': uptime_str,
                'boot_time': boot_time.isoformat(),
                'process_count': process_count,
                'platform': platform.system(),
                'platform_release': platform.release()
            }
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/database/stats')
def get_database_stats():
    """Get database statistics"""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        stats = {}
        
        # Total airlines
        cursor.execute("SELECT COUNT(*) as count FROM airline")
        stats['total_airlines'] = cursor.fetchone()['count']
        
        # Active airlines (with balance > 0)
        cursor.execute("SELECT COUNT(*) as count FROM airline WHERE balance > 0")
        stats['active_airlines'] = cursor.fetchone()['count']
        
        # Bot airlines
        cursor.execute("SELECT COUNT(*) as count FROM airline WHERE airline_type = 2")
        stats['bot_airlines'] = cursor.fetchone()['count']
        
        # Total airports
        cursor.execute("SELECT COUNT(*) as count FROM airport")
        stats['total_airports'] = cursor.fetchone()['count']
        
        # Total links/routes
        cursor.execute("SELECT COUNT(*) as count FROM link")
        stats['total_links'] = cursor.fetchone()['count']
        
        # Total airplanes
        cursor.execute("SELECT COUNT(*) as count FROM airplane")
        stats['total_airplanes'] = cursor.fetchone()['count']
        
        # In-flight airplanes
        cursor.execute("SELECT COUNT(*) as count FROM airplane WHERE is_sold = 0")
        stats['active_airplanes'] = cursor.fetchone()['count']
        
        # Database size
        cursor.execute("""
            SELECT 
                ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) as size_mb
            FROM information_schema.TABLES
            WHERE table_schema = %s
        """, (DB_CONFIG['database'],))
        result = cursor.fetchone()
        stats['database_size_mb'] = result['size_mb'] if result['size_mb'] else 0
        
        # Current game cycle
        cursor.execute("SELECT cycle FROM cycle ORDER BY id DESC LIMIT 1")
        cycle_result = cursor.fetchone()
        stats['current_cycle'] = cycle_result['cycle'] if cycle_result else 0
        
        # Total passenger count (last cycle)
        cursor.execute("""
            SELECT SUM(passenger_count) as total 
            FROM link_consumption 
            WHERE cycle = (SELECT MAX(cycle) FROM link_consumption)
        """)
        passenger_result = cursor.fetchone()
        stats['last_cycle_passengers'] = passenger_result['total'] if passenger_result['total'] else 0
        
        return jsonify(stats)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/game/activity')
def get_game_activity():
    """Get recent game activity"""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        # Recent airline creations - Fixed to not select balance from airline table
        cursor.execute("""
            SELECT a.name, a.id, a.airline_type
            FROM airline a
            ORDER BY a.id DESC
            LIMIT 10
        """)
        recent_airlines = cursor.fetchall()
        
        # Top airlines by balance - Fixed to JOIN airline_info
        cursor.execute("""
            SELECT a.name, COALESCE(ai.balance, 0) as balance, a.airline_type
            FROM airline a
            LEFT JOIN airline_info ai ON a.id = ai.airline
            WHERE a.airline_type != 2
            ORDER BY ai.balance DESC
            LIMIT 10
        """)
        top_airlines = cursor.fetchall()
        
        # Busiest routes (last cycle)
        cursor.execute("""
            SELECT 
                l.from_airport,
                l.to_airport,
                lc.passenger_count,
                lc.cycle
            FROM link_consumption lc
            JOIN link l ON lc.link = l.id
            WHERE lc.cycle = (SELECT MAX(cycle) FROM link_consumption)
            ORDER BY lc.passenger_count DESC
            LIMIT 10
        """)
        busiest_routes = cursor.fetchall()
        
        return jsonify({
            'recent_airlines': recent_airlines,
            'top_airlines': top_airlines,
            'busiest_routes': busiest_routes
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/containers')
def get_containers():
    """Get Docker container status"""
    try:
        import subprocess
        import json
        
        # Run docker ps command
        result = subprocess.run(
            ['docker', 'ps', '--format', '{{json .}}'],
            capture_output=True,
            text=True,
            timeout=5
        )
        
        if result.returncode != 0:
            return jsonify({'error': 'Docker not available or no permissions'}), 500
        
        containers = []
        for line in result.stdout.strip().split('\n'):
            if line:
                try:
                    container = json.loads(line)
                    containers.append({
                        'name': container.get('Names', 'Unknown'),
                        'image': container.get('Image', 'Unknown'),
                        'status': container.get('Status', 'Unknown'),
                        'ports': container.get('Ports', ''),
                        'id': container.get('ID', '')[:12]
                    })
                except json.JSONDecodeError:
                    continue
        
        return jsonify({'containers': containers})
    except subprocess.TimeoutExpired:
        return jsonify({'error': 'Docker command timeout'}), 500
    except FileNotFoundError:
        return jsonify({'error': 'Docker not installed'}), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/logs/recent')
def get_recent_logs():
    """Get recent system/application logs"""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        # Check if log table exists
        cursor.execute("""
            SELECT COUNT(*) as count
            FROM information_schema.TABLES
            WHERE table_schema = %s AND table_name = 'log'
        """, (DB_CONFIG['database'],))
        
        if cursor.fetchone()['count'] == 0:
            return jsonify({'logs': [], 'message': 'Log table not found'})
        
        # Get recent logs
        cursor.execute("""
            SELECT id, airline, category, log_time, message
            FROM log
            ORDER BY id DESC
            LIMIT 50
        """)
        logs = cursor.fetchall()
        
        for log in logs:
            if log['log_time']:
                log['log_time'] = log['log_time'].isoformat()
        
        return jsonify({'logs': logs})
    except Exception as e:
        return jsonify({'error': str(e), 'logs': []}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/alerts')
def get_alerts():
    """Get system alerts and warnings"""
    alerts = []
    
    try:
        # Check CPU usage
        cpu_percent = psutil.cpu_percent(interval=1)
        if cpu_percent > 90:
            alerts.append({
                'level': 'critical',
                'message': f'CPU usage is critically high: {cpu_percent}%',
                'timestamp': datetime.now().isoformat()
            })
        elif cpu_percent > 75:
            alerts.append({
                'level': 'warning',
                'message': f'CPU usage is high: {cpu_percent}%',
                'timestamp': datetime.now().isoformat()
            })
        
        # Check memory usage
        memory = psutil.virtual_memory()
        if memory.percent > 90:
            alerts.append({
                'level': 'critical',
                'message': f'Memory usage is critically high: {memory.percent}%',
                'timestamp': datetime.now().isoformat()
            })
        elif memory.percent > 75:
            alerts.append({
                'level': 'warning',
                'message': f'Memory usage is high: {memory.percent}%',
                'timestamp': datetime.now().isoformat()
            })
        
        # Check disk usage
        disk = psutil.disk_usage('/')
        if disk.percent > 90:
            alerts.append({
                'level': 'critical',
                'message': f'Disk usage is critically high: {disk.percent}%',
                'timestamp': datetime.now().isoformat()
            })
        elif disk.percent > 80:
            alerts.append({
                'level': 'warning',
                'message': f'Disk usage is high: {disk.percent}%',
                'timestamp': datetime.now().isoformat()
            })
        
        # Check database connection
        try:
            conn = get_db_connection()
            conn.close()
        except Exception as e:
            alerts.append({
                'level': 'critical',
                'message': f'Database connection failed: {str(e)}',
                'timestamp': datetime.now().isoformat()
            })
        
        if not alerts:
            alerts.append({
                'level': 'info',
                'message': 'All systems operational',
                'timestamp': datetime.now().isoformat()
            })
        
        return jsonify({'alerts': alerts})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/bots')
def get_bots():
    """Get all bot airlines with their status"""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        # Get all bot airlines - Fixed to use correct schema
        # airline_type: 0=REGULAR, 1=DISCOUNT, 2=NON_PLAYER, 3=LUXURY, 4=REGIONAL
        cursor.execute("""
            SELECT 
                a.id,
                a.name,
                a.airline_type,
                COALESCE(ai.balance, 0) as balance,
                COALESCE(ai.reputation, 0) as reputation,
                COALESCE(ai.service_quality, 0) as service_quality,
                (SELECT COUNT(*) FROM link WHERE airline = a.id) as route_count,
                (SELECT COUNT(*) FROM airplane WHERE owner = a.id) as aircraft_count,
                (SELECT COUNT(*) FROM airline_base WHERE airline = a.id) as base_count
            FROM airline a
            LEFT JOIN airline_info ai ON a.id = ai.airline
            WHERE a.airline_type = 2
            ORDER BY a.name
        """)
        bots = cursor.fetchall()
        
        # Enhance each bot with personality and additional stats
        for bot in bots:
            # Determine personality based on cash, reputation, service quality
            bot['personality'] = determine_personality(
                bot.get('balance', 0), 
                bot.get('reputation', 0), 
                bot.get('service_quality', 0)
            )
            
            # Get route details
            cursor.execute("""
                SELECT 
                    l.id,
                    from_airport.iata as from_iata,
                    from_airport.city as from_city,
                    to_airport.iata as to_iata,
                    to_airport.city as to_city,
                    l.distance,
                    l.frequency,
                    l.price_economy,
                    l.price_business,
                    l.price_first,
                    l.quality,
                    l.capacity_economy,
                    l.capacity_business,
                    l.capacity_first
                FROM link l
                JOIN airport from_airport ON l.from_airport = from_airport.id
                JOIN airport to_airport ON l.to_airport = to_airport.id
                WHERE l.airline = %s
                ORDER BY l.id DESC
                LIMIT 10
            """, (bot['id'],))
            bot['routes'] = cursor.fetchall()
            
            # Get aircraft fleet
            cursor.execute("""
                SELECT 
                    model as name,
                    COUNT(*) as count,
                    AVG(airplane_condition) as avg_condition,
                    SUM(CASE WHEN is_sold = 0 THEN 1 ELSE 0 END) as available
                FROM airplane
                WHERE owner = %s
                GROUP BY model
                ORDER BY count DESC
            """, (bot['id'],))
            bot['fleet'] = cursor.fetchall()
            
            # Get bases
            cursor.execute("""
                SELECT 
                    ap.iata,
                    ap.city,
                    ap.name as airport_name,
                    ab.scale,
                    ab.founded_cycle
                FROM airline_base ab
                JOIN airport ap ON ab.airport = ap.id
                WHERE ab.airline = %s
            """, (bot['id'],))
            bot['bases'] = cursor.fetchall()
            
        return jsonify({'bots': bots})
    finally:
        cursor.close()
        conn.close()

def determine_personality(balance, reputation, service_quality):
    """Determine bot personality based on stats (mirrors BotAISimulation.scala logic)"""
    cash_ratio = balance / 10000000.0  # Normalize to 10M
    
    if service_quality and service_quality > 70:
        return "PREMIUM"
    elif cash_ratio < 2 and reputation and reputation < 30:
        return "BUDGET"
    elif reputation and reputation > 70:
        return "CONSERVATIVE"
    elif cash_ratio > 10:
        return "AGGRESSIVE"
    elif service_quality and service_quality < 40:
        return "REGIONAL"
    else:
        return "BALANCED"

@app.route('/api/bots/<int:bot_id>/routes')
def get_bot_routes(bot_id):
    """Get detailed routes for a specific bot"""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        cursor.execute("""
            SELECT 
                l.id,
                from_airport.iata as from_iata,
                from_airport.name as from_name,
                from_airport.city as from_city,
                from_airport.country_code as from_country,
                to_airport.iata as to_iata,
                to_airport.name as to_name,
                to_airport.city as to_city,
                to_airport.country_code as to_country,
                l.distance,
                l.frequency,
                l.duration,
                l.price_economy,
                l.price_business,
                l.price_first,
                l.quality,
                l.capacity_economy,
                l.capacity_business,
                l.capacity_first,
                l.sold_seats_economy,
                l.sold_seats_business,
                l.sold_seats_first,
                l.flight_type
            FROM link l
            JOIN airport from_airport ON l.from_airport = from_airport.id
            JOIN airport to_airport ON l.to_airport = to_airport.id
            WHERE l.airline = %s
            ORDER BY l.id DESC
        """, (bot_id,))
        routes = cursor.fetchall()
        
        # Calculate load factors
        for route in routes:
            total_capacity = (route['capacity_economy'] or 0) + (route['capacity_business'] or 0) + (route['capacity_first'] or 0)
            total_sold = (route['sold_seats_economy'] or 0) + (route['sold_seats_business'] or 0) + (route['sold_seats_first'] or 0)
            route['load_factor'] = (total_sold / total_capacity * 100) if total_capacity > 0 else 0
        
        return jsonify({'routes': routes})
    finally:
        cursor.close()
        conn.close()

@app.route('/api/bots/<int:bot_id>/aircraft')
def get_bot_aircraft(bot_id):
    """Get detailed aircraft for a specific bot"""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        cursor.execute("""
            SELECT 
                id,
                model as name,
                airplane_condition as condition,
                depreciation_rate,
                value,
                purchase_date,
                is_sold,
                dealer_ratio,
                configuration
            FROM airplane
            WHERE owner = %s
            ORDER BY model, id
        """, (bot_id,))
        aircraft = cursor.fetchall()
        
        return jsonify({'aircraft': aircraft})
    finally:
        cursor.close()
        conn.close()

@app.route('/api/bots/summary')
def get_bots_summary():
    """Get summary statistics for all bots"""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        # Total bots - Fixed to use airline_type = 2
        cursor.execute("SELECT COUNT(*) as total FROM airline WHERE airline_type = 2")
        total_bots = cursor.fetchone()['total']
        
        # Total routes
        cursor.execute("""
            SELECT COUNT(*) as total 
            FROM link l
            JOIN airline a ON l.airline = a.id
            WHERE a.airline_type = 2
        """)
        total_routes = cursor.fetchone()['total']
        
        # Total aircraft
        cursor.execute("""
            SELECT COUNT(*) as total 
            FROM airplane ap
            JOIN airline a ON ap.owner = a.id
            WHERE a.airline_type = 2 AND ap.is_sold = 0
        """)
        total_aircraft = cursor.fetchone()['total']
        
        # Personality distribution - Fixed to JOIN airline_info
        cursor.execute("""
            SELECT 
                a.id,
                COALESCE(ai.balance, 0) as balance,
                COALESCE(ai.reputation, 0) as reputation,
                COALESCE(ai.service_quality, 0) as service_quality
            FROM airline a
            LEFT JOIN airline_info ai ON a.id = ai.airline
            WHERE a.airline_type = 2
        """)
        bots_data = cursor.fetchall()
        
        personality_counts = {
            'AGGRESSIVE': 0,
            'CONSERVATIVE': 0,
            'BALANCED': 0,
            'REGIONAL': 0,
            'PREMIUM': 0,
            'BUDGET': 0
        }
        
        for bot in bots_data:
            personality = determine_personality(
                bot['balance'],
                bot['reputation'],
                bot['service_quality']
            )
            personality_counts[personality] += 1
        
        return jsonify({
            'total_bots': total_bots,
            'total_routes': total_routes,
            'total_aircraft': total_aircraft,
            'personality_distribution': personality_counts
        })
    finally:
        cursor.close()
        conn.close()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=9001, debug=True)
