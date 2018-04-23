npm run build:rinkeby
aws s3 sync ./dist s3://baguette-app.request.network --acl public-read
