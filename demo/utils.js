export function currentUrlClass(req, urlToMatch, className, classNameIfNotMatch = '') {
  return req.path == urlToMatch ? className : classNameIfNotMatch;
}

export function test(req) {
  console.log('test', req.path);
  return '';
}