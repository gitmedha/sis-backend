### Pre-Requisites

```
    1. Node :  ">=10.16.0 <=14.x.x",
    2. Postgres : version 14
```

### After compeleting installation of above mentioned pre-requisites, follow these steps :

1. Run `yarn install`
2. After the project is installed next step will be database setup.
* Create a PostgreSQL database named `medha_sis`.
* Download this database dump from the provided link here: https://drive.google.com/drive/folders/1lSvMJr8AMiD68zqcpr2w0BnZ5N80EzE5
* Restore this database.
3. Once the database is restored, run `yarn develop`, and you will be able to access the backend at `http://localhost:1337/`.


### Compiles strapi for for production
```
yarn build
```


### Deployment Process
```
    Login to aws and update your ip in the instance
```
1. Connect with the instance through ssh command, you will get it from the aws .
2. cd strapi/sis-backend .
3. PM2 list : `it will show the list of running sessions ` .
4. PM2 stop session id `it will stop the session and the session id you will get by step 3 ` .
5. sudo git pull .
6. npm i `if there are new changes in the package.json` .
7. PM2 restart session id ` this will restart the session with current changes`.
#### Note:
``` 
  if you do not see any running session after PM2 list run :  pm2 start npm --name backend -- run start
```
