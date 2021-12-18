const hs = require("http-status");
const { list, insert, findOne } = require("../services/Users");
const { passwordToHash, generateJWTAccessToken, generateJWTRefreshToken } = require("../scripts/utils/helper");

const index = (req, res) => {
  list()
    .then((userList) => {
      if (!userList) res.status(hs.INTERNAL_SERVER_ERROR).send({ error: "Sorun var.." });
      res.status(hs.OK).send(userList);
    })
    .catch((e) => res.status(hs.INTERNAL_SERVER_ERROR).send(e));
};

const create = (req, res) => {
  req.body.password = passwordToHash(req.body.password);
  insert(req.body)
    .then((createdUser) => {
      if (!createdUser) res.status(hs.INTERNAL_SERVER_ERROR).send({ error: "Sorun var.." });
      res.status(hs.OK).send(createdUser);
    })
    .catch((e) => res.status(hs.INTERNAL_SERVER_ERROR).send(e));
};

const login = (req, res) => {
  req.body.password = passwordToHash(req.body.password);
  findOne(req.body)
    .then((user) => {
      if (!user) return res.status(hs.NOT_FOUND).send({ message: "Böyle bir kullanıcı bulunmamaktadır." });
      user = {
        ...user.toObject(),
        tokens: {
          access_token: generateJWTAccessToken(user),
          refresh_token: generateJWTRefreshToken(user),
        },
      };
      delete user.password;
      res.status(hs.OK).send(user);
    })
    .catch((e) => res.status(hs.INTERNAL_SERVER_ERROR).send(e));
};

//! ÖDEV Video Üzerinden izleyip implemente edilecek.
// https://www.youtube.com/watch?v=pMi3PiITsMc
const resetPassword = async (req, res) => {
  try {
    const new_password = uuid.v4().split("-")[0] || `user-${new Date().getTime()}`;

    const updatedUser = await updateOne({ email: req.body.email }, { password: passwordToHash(new_password) });

    if (!updatedUser) {
      return res.status(StatusCodes.NOT_FOUND).json({ msg: `No such a user with ${req.body.email}` });
    }
    eventEmitter.emit("send_email", {
      to: updatedUser.email, // sender address
      subject: "Reset Password", // Subject line
      html: `<b>Reset password process started!</b><br/><b>password ${new_password}: </b>`, // html body
    });

    res.status(StatusCodes.OK).json({ msg: "Control your email " });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ msg: error.message });
  }
};

module.exports = {
  index,
  create,
  login,
  resetPassword,
};
