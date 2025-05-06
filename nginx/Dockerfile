FROM nginx:alpine

# Install dependencies
RUN apk add --no-cache \
    gcc \
    libc-dev \
    make \
    openssl-dev \
    pcre-dev \
    zlib-dev \
    linux-headers \
    curl \
    gnupg \
    git \
    libxml2-dev \
    libxslt-dev \
    gd-dev \
    geoip-dev \
    g++ \
    autoconf \
    automake \
    libtool \
    curl-dev

# Clone and build ModSecurity
WORKDIR /opt
RUN git clone --depth 1 -b v3/master --single-branch https://github.com/SpiderLabs/ModSecurity.git && \
    cd ModSecurity && \
    git submodule init && \
    git submodule update && \
    ./build.sh && \
    ./configure && \
    make && \
    make install

# Clone and build ModSecurity-nginx connector
RUN git clone --depth 1 https://github.com/SpiderLabs/ModSecurity-nginx.git

# Get nginx source code (must match the nginx version)
RUN export NGINX_VERSION=$(nginx -v 2>&1 | sed 's/^.*nginx\///;s/ .*$//') && \
    wget -O - http://nginx.org/download/nginx-$NGINX_VERSION.tar.gz | tar -xz && \
    cd nginx-$NGINX_VERSION && \
    ./configure --with-compat --add-dynamic-module=/opt/ModSecurity-nginx && \
    make modules && \
    cp objs/ngx_http_modsecurity_module.so /etc/nginx/modules/

# Create directory to load dynamic modules
RUN mkdir -p /etc/nginx/modules

# Download and install OWASP CRS
RUN mkdir -p /etc/nginx/modsec && \
    cd /etc/nginx/modsec && \
    git clone https://github.com/coreruleset/coreruleset.git owasp-crs && \
    cd owasp-crs && \
    cp crs-setup.conf.example crs-setup.conf

# Remove default config
RUN rm /etc/nginx/conf.d/default.conf

# Copy our configuration files
COPY nginx.conf /etc/nginx/conf.d/
COPY modsecurity.conf /etc/nginx/modsec/modsecurity.conf
COPY main.conf /etc/nginx/modsec/main.conf

# Create directories for logs, static and media files
RUN mkdir -p /var/log/nginx && \
    mkdir -p /home/app/staticfiles && \
    mkdir -p /home/app/media && \
    chmod -R 777 /var/log/nginx 