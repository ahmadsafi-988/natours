module.exports = function (func) {
  return (req, res, next) => {
    func(req, res, next).catch((err) => next(err));
  };
};

/////// ARCHIVE ///////
// module.exports = function (func) {
//   return (res, req, next) => {
//     func(res, req, next).catch((err) => next(err));
//   };
// };
