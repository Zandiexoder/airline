An opensource airline game. 

Forked from https://www.airline-club.com/
Live at https://myfly.club/


![Screenshot 1](https://user-images.githubusercontent.com/2895902/74759887-5a966380-522e-11ea-9e54-2252af63d5ea.gif)

## Dependencies
- Java openjdk 11
- MySQL 8
- Sbt

## Setup
1. Create MySQL database matching values defined [here](https://github.com/patsonluk/airline/blob/master/airline-data/src/main/scala/com/patson/data/Constants.scala#L184).
1. Define sbt JVM minimum resoures by setting `export SBT_OPTS="-Xms2g -Xmx8g"` in your CLI. Depending how you're running Java, you may need to enable more memory elsewhere too.
1. Navigate to `airline-data` and run `sbt publishLocal`. If you see [encoding error](https://github.com/patsonluk/airline/issues/267), add character-set-server=utf8mb4 to your /etc/my.cnf and restart mysql. it's a unicode characters issue, see https://stackoverflow.com/questions/10957238/incorrect-string-value-when-trying-to-insert-utf-8-into-mysql-via-jdbc
1. In `airline-data`, run `sbt run`, 
    1. Then, choose the one that runs `MainInit`. It will take awhile to init everything.
1. Set `google.mapKey` in [`application.conf`](https://github.com/patsonluk/airline/blob/master/airline-web/conf/application.conf#L69) with your google map API key value. Be careful with setting budget and limit, google gives some free credit but it CAN go over and you might get charged!
1. For the "Flight search" function to work, install elastic search 7.x, see https://www.elastic.co/guide/en/elasticsearch/reference/current/install-elasticsearch.html . For windows, I recommand downloading the zip archive and just unzip it - the MSI installer did not work on my PC
1. For airport image search and email service for user pw reset - refer to https://github.com/patsonluk/airline/blob/master/airline-web/README
1. Now run the background simulation by staying in `airline-data`, run `sbt run`, select option `MainSimulation`. It should run the background simulation.
1. Open another terminal, navigate to `airline-web`, run the web server by `sbt run`
1. The application should be accessible at `localhost:9000`

## Alternate Docker Setup (Recommended)

**See [DOCKER_GUIDE.md](DOCKER_GUIDE.md) for detailed instructions and troubleshooting.**

### Quick Start
1. Install Docker & Docker-compose
2. Run `cp docker-compose.override.yaml.dist docker-compose.override.yaml` and edit ports if needed
3. Start the stack: `docker compose up -d`
4. Wait for all containers to be healthy: `docker compose ps`
5. Initialize and start the application:

   **⚡ Fast (Optimized - Recommended):**
   ```bash
   docker compose exec airline-app bash /home/airline/start-all-fast.sh
   ```
   - Smart initialization - skips unnecessary steps
   - Checks if database already has data
   - Only runs `publishLocal` if needed
   - **Startup time**: 30-60 seconds on subsequent runs
   - **Savings**: 2-5 minutes compared to standard startup!

   **🐢 Standard (More Stable - First Time Use):**
   ```bash
   docker compose exec airline-app bash /home/airline/start-all.sh
   ```
   - Always runs full initialization
   - Always cleans and recompiles
   - Always runs database migration
   - **Startup time**: 3-6 minutes every time
   - **Use when**: First time setup, or if fast version has issues

6. The application will be accessible at:
   - 🌐 **Main App**: http://localhost:9000
   - 📊 **Admin Panel**: http://localhost:9001

### What's Improved?
- ✅ **Reliable initialization** - No more spotty behavior! The init script now properly waits for MySQL and retries with exponential backoff
- ✅ **Smart caching** - Fast startup skips unnecessary compilation if artifacts exist
- ✅ **Database detection** - Automatically detects if initialization is needed
- ✅ **Health checks** - Containers wait for dependencies to be ready
- ✅ **Automated startup** - One command to init and start everything
- ✅ **Better error messages** - Clear feedback when things go wrong
- ✅ **Utility scripts** - Check status, troubleshoot issues easily

### When to Use Each Version

**Use Fast Version (`start-all-fast.sh`)** when:
- ✅ Database is already initialized
- ✅ You've already run setup once
- ✅ You're restarting after code changes
- ✅ You want quick development iteration
- ✅ Running daily/regular startups

**Use Standard Version (`start-all.sh`)** when:
- ✅ First time setup
- ✅ Database is corrupted or empty
- ✅ Fast version encounters errors
- ✅ You want to ensure clean state
- ✅ Major version upgrades

### Manual Step-by-Step (if you prefer)
1. Open shell: `docker compose exec airline-app bash`
2. Run initialization: `bash init-data.sh` (robust retry logic - no more spotty behavior!)
3. Start backend (separate terminal): `bash start-data.sh`
4. Start frontend (separate terminal): `bash start-web.sh`
5. Access at http://localhost:9000


## Nginx Proxy w/ Cloudflare HTTPS

In Cloudflare go to your domain and then SSL/TLS > Origin Server. Click Create Certificate > Generate private key and CSR with Cloudflare > Drop down choose ECC > Create

Save your Origin Certificate and your Private Key to a file. Example:

Orgin Certificate: domain.com.crt

Private Key: domain.com.key

Example nginx virtualhost conf file:

```
server {

  listen 443 ssl http2;
  listen [::] ssl http2;
  server_name domain.com;

  ssl_certificate      /usr/local/nginx/conf/ssl/domain.com/domain.com.crt;
  ssl_certificate_key  /usr/local/nginx/conf/ssl/domain.com/domain.com.key;

  add_header X-Frame-Options SAMEORIGIN;
  add_header X-Xss-Protection "1; mode=block" always;
  add_header X-Content-Type-Options "nosniff" always;
  add_header Referrer-Policy "strict-origin-when-cross-origin";

  access_log /home/nginx/domains/domain.com/log/access.log combined buffer=256k flush=5m;
  error_log /home/nginx/domains/domain.com/log/error.log;

  location /assets  {
    alias    /home/airline/airline-web/public/;
    access_log on;
    expires 30d;
  }

  location / {
    proxy_pass http://localhost:9000;
    proxy_pass_header Content-Type;
    proxy_read_timeout     60;
    proxy_connect_timeout  60;
    proxy_redirect         off;

    # Allow the use of websockets
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  }

}
```

## Attribution
1. Some icons by [Yusuke Kamiyamane](http://p.yusukekamiyamane.com/). Licensed under a [Creative Commons Attribution 3.0 License](http://creativecommons.org/licenses/by/3.0/)
