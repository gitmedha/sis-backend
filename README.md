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