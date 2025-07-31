module.exports.isAdmin = (req, res, next) => {
    if (req.isAuthenticated() && req.user.isAdmin) {
      return next();
    }
    req.flash("error", "You do not have admin access.");
    res.redirect("/");
  };
  

  module.exports.isLoggedIn=(req,res,next)=>{
    if(!req.isAuthenticated())
        {
          req.session.redirectUrl=req.originalUrl;
          req.flash("error","you must be logged in!");
          return res.redirect("/auth");
        }
        next();  
}

module.exports.saveRedirectUrl=(req,res,next)=>{
  if(req.session.redirectUrl){
    res.locals.redirectUrl=req.session.redirectUrl;
  }
  next();
}
  

module.exports.wrapAsync = (fn) => {
  return function (req, res, next) {
    fn(req, res, next).catch(next);
  };
};
