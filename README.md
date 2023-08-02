# Pre-Requisites

```
    1. Node :  ">=10.16.0 <=14.x.x",
    2. Postgres : version 14
```

After compeleting installation of above mentioned pre-requisites, follow these steps :

1. Run `yarn install`
2. After the project is installed next step will be database setup.
    a. Create a postgres database `medha_sis`.
    b. Download this database dump fro provided link here: https://drive.google.com/drive/folders/1lSvMJr8AMiD68zqcpr2w0BnZ5N80EzE5
    c. Restore this database.
3. Once database is restored run `yarn develop` and you will be access backend `http://localhost:1337/`
