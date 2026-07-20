#!/bin/sh
set -eu

rm -rf dist
mkdir -p dist/assets/images dist/assets/logo dist/blog

cp ./*.html ./styles.css ./script.js ./robots.txt ./sitemap.xml ./llms.txt ./_headers ./_redirects dist/
cp ./assets/logo/america-home-buyers-logo.png ./assets/logo/america-home-buyers-logo-large.png dist/assets/logo/
cp ./assets/images/*-clean.jpg dist/assets/images/

for directory in \
  cash-home-buyers-high-point-nc \
  can-i-leave-belongings-when-selling-house \
  can-i-sell-house-as-is-nc \
  how-fast-can-cash-buyer-close-nc \
  sell-a-house-that-needs-repairs-nc \
  sell-inherited-house-nc \
  sell-my-house-fast-asheboro-nc \
  sell-my-house-fast-kernersville-nc \
  sell-my-house-fast-lexington-nc \
  sell-my-house-fast-winston-salem-nc \
  sell-rental-property-with-tenants-nc \
  we-buy-houses-archdale-nc \
  we-buy-houses-greensboro-nc \
  we-buy-houses-thomasville-nc
do
  cp -R "$directory" dist/
done

cp -R blog/* dist/blog/

printf 'Production site built in dist/\n'
