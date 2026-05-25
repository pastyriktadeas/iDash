FROM php:8.2-apache

RUN a2enmod rewrite

RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 775 /var/www/html