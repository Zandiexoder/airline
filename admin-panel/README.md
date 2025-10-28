# Admin Panel for Airline Game

A lightweight Python/Flask admin panel for monitoring and managing users in the airline game.

## Features

### User Management
- **Dashboard Overview**: Real-time statistics of total, active, and new users
- **User Management**: View all user accounts with search and pagination
- **User Details**: Detailed view of individual users including:
  - Account information
  - IP address history (tracks user logins by IP)
  - User modifiers (bans, warnings, etc.)
  - UUIDs associated with the account
  - Airlines owned by the user
- **IP Tracking**: See all IP addresses a user has logged in from

### Server Monitoring
- **CPU Usage**: Real-time CPU utilization with color-coded progress bars
- **Memory Usage**: RAM consumption with used/total display
- **Disk Usage**: Storage space monitoring
- **Network I/O**: Total data sent and received
- **System Information**:
  - System uptime
  - CPU core count
  - Active process count
  - Platform information

### User Interface
- **Beautiful UI**: Modern, responsive design with smooth animations
- **Real-time Updates**: Server resources update every 5 seconds
- **Color Coding**: Visual indicators for resource usage levels
  - 🟢 Green: < 60% (healthy)
  - 🟡 Yellow: 60-85% (warning)
  - 🔴 Red: > 85% (critical)

## Access

Once deployed, access the admin panel at:
```
http://localhost:9001
```

Or on a remote server:
```
http://YOUR_SERVER_IP:9001
```

## Deployment

### With Docker Compose (Recommended)

The admin panel is automatically included in the main docker-compose setup:

```bash
# Start all services including admin panel
docker compose up -d

# Check if it's running
docker compose ps

# View logs
docker compose logs admin-panel
```

### Standalone Deployment

```bash
cd admin-panel

# Install dependencies
pip install -r requirements.txt

# Set environment variables
export DB_HOST=localhost:3306
export DB_NAME=airline
export DB_USER=mfc01
export DB_PASSWORD=ghEtmwBdnXYBQH4

# Run the application
python app.py
```

## Technology Stack

- **Backend**: Python 3.11 + Flask
- **Database**: MySQL (connects to existing airline database)
- **System Monitoring**: psutil (cross-platform system and process utilities)
- **Frontend**: Pure HTML/CSS/JavaScript (no frameworks)
- **Port**: 9001

## Security Considerations

⚠️ **Important**: This admin panel has NO authentication. It's designed for internal use only.

### Recommendations for Production:

1. **Add Authentication**: Implement login/password protection
2. **Restrict Access**: Use firewall rules to limit access to trusted IPs only
3. **Use HTTPS**: Put behind a reverse proxy with SSL
4. **Read-Only Mode**: Current version only reads data (doesn't modify)
5. **Network Isolation**: Keep on internal network, don't expose to internet

## API Endpoints

- `GET /` - Main dashboard
- `GET /api/stats` - Overall statistics
- `GET /api/users?page=1&per_page=50&search=query` - User list with pagination
- `GET /api/users/<user_id>` - Detailed user information
- `GET /api/ip/<ip_address>` - Find all users by IP
- `GET /api/activity?days=7` - Recent user activity

## Database Tables Used

- `user` - Main user accounts
- `user_ip` - IP address tracking
- `user_uuid` - UUID tracking
- `user_modifier` - User modifiers (bans, warnings)
- `user_airline` - User-airline associations
- `airline` - Airline information

## Future Enhancements

- [ ] Add authentication system
- [ ] User action history
- [ ] Ban/unban users directly from panel
- [ ] Export data to CSV
- [ ] Charts and graphs for user growth
- [ ] Real-time notifications
- [ ] Search by airline name
- [ ] Advanced filtering options

## Development

```bash
# Run in development mode
python app.py

# The Flask debug mode is enabled by default
# Hot reload is active for rapid development
```

## License

Same as main airline project.
