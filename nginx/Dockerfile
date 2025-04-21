FROM nginx:alpine

RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/

WORKDIR /home/app

RUN mkdir -p staticfiles media 