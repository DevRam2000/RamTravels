using myapp from '../db/schema';

@(requires: 'authenticated-user')
service CatalogService {
  function getUserInfo() returns String;
}
