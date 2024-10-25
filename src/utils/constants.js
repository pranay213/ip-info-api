require("dotenv").config();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { createTransport } = require("nodemailer");
const validator = require("validator");
const VerificationEmailModel = require("../db/models/verificationEmailModel");
const UserModel = require("../db/models/userModel");
const multer = require("multer");
const { v4: uniqueId } = require("uuid");
const path = require("path");

const MONGO_URL = `mongodb+srv://${process.env.USER_NAME}:${process.env.PASSWORD}@cluster8.lcc0un1.mongodb.net/e-commerce`;

const ALLOWED_ROLES = ["admin", "seller", "buyer"];

const REG_TYPES = ["sellerAdmin", "buyer"];

const generateOtp = () => {
  let otp = "";
  for (let i = 0; i < 4; i++) {
    const randomVal = Math.round(Math.random() * 9);
    otp += randomVal;
  }
  return otp;
};

const makeHashText = async (text) => {
  if (!text) {
    return;
  }
  let hashedText = "";
  try {
    const salt = parseInt(process.env.SALT_ROUNDS);
    const genSalt = await bcrypt.genSalt(salt);
    hashedText = await bcrypt.hash(text, genSalt);
  } catch (error) {
    console.log(error);
  }
  return hashedText;
};

const nodemailerTransport = createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.USER_NAME_SMTP,
    pass: process.env.PASSWORD_SMTP,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

const verifyOtpAndPassword = async (passwordOrOtp, enteredPassOrOtp) => {
  let result = false;
  try {
    result = await bcrypt.compare(enteredPassOrOtp?.trim(), passwordOrOtp);
  } catch (error) {
    console.log(error);
  }
  return result;
};

const generateJwtToken = (userDetails) => {
  return jwt.sign({ userDetails }, process.env.SECRET_KEY);
};

const sendMail = async (email, otp, name) => {
  await nodemailerTransport.sendMail({
    from: process.env.USER_NAME_SMTP,
    to: email,
    subject: "Verification of Your Email Account",
    html: `test`,
  });
};

const authorizeUser = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  if (authHeader) {
    const jwtToken = authHeader.split(" ")[1];
    jwt.verify(jwtToken, process.env.SECRET_KEY, async (err, decoded) => {
      if (err) {
        return res
          .status(401)
          .send({ status: false, message: "Unauthorized User" });
      }
      req.user = decoded;
      next();
    });
  } else {
    res.status(401).send({ status: false, message: "Unauthorized User" });
  }
};

const verificationMiddleWare = async (req, res, next) => {
  const { userDetails } = req.user;
  const findUser = await UserModel.findOne(userDetails?.id);
  if (!findUser) {
    return res.status(400).send({ status: false, message: "User Not Found" });
  }
  const checkUserIsVerified = findUser?.verified;
  if (!checkUserIsVerified) {
    return res
      .status(400)
      .send({ status: false, message: "User Is Invalid/Not Verified" });
  }
  next();
};

const authorizeAdmin = async (req, res, next) => {
  const { userDetails } = req.user;
  const checkUserTypeIsAdmin = userDetails?.role === ALLOWED_ROLES[0];
  if (!checkUserTypeIsAdmin) {
    return res
      .status(400)
      .send({ status: false, message: "This Access Limited To Admins Only" });
  }
  next();
};

const authorizeSeller = async (req, res, next) => {
  const { userDetails } = req.user;
  const checkUserTypeIsAdmin = userDetails?.role === ALLOWED_ROLES[1];
  if (!checkUserTypeIsAdmin) {
    return res
      .status(400)
      .send({ status: false, message: "This Access Limited To Admins Only" });
  }
  next();
};

const generateRandomNum = (length) => {
  return Math.ceil(Math.round(Math.random() * length)) - 1;
};

const generateRandomEmailandUserId = () => {
  const alphabates = "abcdefghijklmnopqrstuvwxyz";
  let randWord = "";
  for (let i = 0; i <= 5; i++) {
    const randomNum = generateRandomNum(alphabates.length);
    randWord += alphabates[randomNum];
  }

  return {
    email: "test" + randWord + generateRandomNum(99) + "@gmail.com",
    name: "test" + randWord,
  };
};

const preCheckValidations = async ({
  email,
  password,
  confirm_password,
  name,
  role,
  res,
  user_id,
  reg_type,
}) => {
  let result = false;
  if (
    !email?.toString().trim() ||
    !password?.toString().trim() ||
    !confirm_password?.toString().trim() ||
    !name?.toString().trim() ||
    !role?.toString().trim() ||
    !user_id?.toString().trim()
  ) {
    return res
      .status(400)
      .send({ status: false, message: "Fields must not to be Empty" });
  }

  const checkRole = ALLOWED_ROLES.includes(role);
  if (!checkRole) {
    return res
      .status(400)
      .send({ status: false, message: "Role doesn't exist" });
  }

  if (reg_type === REG_TYPES[0] && role === ALLOWED_ROLES[2]) {
    return res.status(400).send({
      status: false,
      message: "Role Should Be Either seller (Or) admin only.",
    });
  }

  if (
    reg_type === REG_TYPES[1] &&
    (role === ALLOWED_ROLES[0] || role === ALLOWED_ROLES[1])
  ) {
    return res.status(400).send({
      status: false,
      message: "Role Should Be Etiher User (Or) Guest only.",
    });
  }

  if (!validator.isEmail(email)) {
    return res.status(400).send({ status: false, message: "Email is Invalid" });
  }

  const userOrExistsWithEmail = await UserModel.findOne({
    email,
  });

  const userOrExistsWithId = await UserModel.findOne({
    user_id,
  });

  if (userOrExistsWithEmail) {
    return res
      .status(400)
      .send({ status: false, message: "User Email Already Exists" });
  }

  if (userOrExistsWithId) {
    return res
      .status(400)
      .send({ status: false, message: "User Id Already Exists" });
  }

  if (password !== confirm_password) {
    return res.status(400).send({
      status: false,
      message: "Both Passwords should Match",
    });
  }

  if (!validator.isStrongPassword(password)) {
    return res.status(400).send({
      status: false,
      message:
        "Password Not Meet the criteria, it Must includes(password length 8 or more charaters, 1 uppercase letter, 1 special symbol)",
    });
  }

  result = true;
  return result;
};

const verifyOtp = async ({ res, user_id, otp }) => {
  try {
    if (!user_id || !otp?.toString().trim()) {
      return res.status(400).send({
        status: false,
        message: "Fields Should not be empty",
      });
    }
    const checkUserExist = await UserModel.findOne({
      _id: user_id,
    });

    if (!checkUserExist) {
      return res.status(404).send({
        status: false,
        message: "User Not Exists",
      });
    }

    if (checkUserExist?.verified) {
      return res.status(400).send({
        status: false,
        message: "User Already Verified",
      });
    }

    const findUserExistWithOtp = await VerificationEmailModel.findOne({
      user_id,
    });

    if (!findUserExistWithOtp) {
      return res.status(404).send({
        status: false,
        message: "OTP Expired, Make Another OTP Request",
      });
    }

    const result = await verifyOtpAndPassword(findUserExistWithOtp?.otp, otp);

    if (!result) {
      return res.status(400).send({
        status: false,
        message: "Otp is invalid",
      });
    }

    checkUserExist.verified = true;
    await VerificationEmailModel.findByIdAndDelete(findUserExistWithOtp?._id);

    const userDetails = await checkUserExist.save();

    const details = {
      name: userDetails?.name,
      user_id: userDetails?.user_id,
      role: userDetails?.role,
    };
    const token = await generateJwtToken(details);
    const sendDetails = {
      name: userDetails?.name,
      user_id: userDetails?.user_id,
      role: userDetails?.role,
      verified: userDetails?.verified,
      image: userDetails?.image,
      address: userDetails?.address,
      contact: {
        email: userDetails?.contact?.email,
        mobile_number: userDetails?.contact?.mobile_number,
      },
      jwtToken: token,
    };
    res.status(200).send({
      status: true,
      message: "User Verified Successfully",
      data: {
        userDetails: sendDetails,
      },
    });
  } catch (error) {
    res.status(400).send({ status: false, message: "Something Went Wrong" });
  }
};

const sendOtp = async ({ res, user_id }) => {
  try {
    if (!user_id) {
      return res.status(400).send({
        status: false,
        message: "Fields Should not be empty",
      });
    }

    const checkUserExist = await UserModel.findOne({
      _id: user_id,
    });

    if (!checkUserExist) {
      return res.status(400).send({
        status: false,
        message: "User Not Exists",
      });
    }

    if (checkUserExist?.verified) {
      return res.status(400).send({
        status: false,
        message: "User Already Verified",
      });
    }

    const findUserExistWithOtp = await VerificationEmailModel.findOne({
      user_id: checkUserExist?._id,
    });

    if (findUserExistWithOtp) {
      return res.status(400).send({
        status: false,
        message:
          "Please wait 5 mins to make another otp Request (Or) Check Ur Recent Otp on Mail",
      });
    }

    const otp = generateOtp();
    const hashedOtp = await makeHashText(otp);
    const verificationOtp = new VerificationEmailModel({
      user_id: checkUserExist?._id,
      otp: hashedOtp,
    });
    await verificationOtp.save();
    await sendMail(checkUserExist?.email, otp, checkUserExist?.name);

    const sendUserDetails = {
      id: checkUserExist?._id,
      name: checkUserExist?.name,
      verified: checkUserExist?.verified,
    };
    res.status(201).send({
      status: true,
      message: "OTP sent Successfully",
      data: {
        userDetails: sendUserDetails,
      },
    });
  } catch (error) {
    res.status(400).send({ status: false, message: "Something Went Wrong" });
  }
};

const loginUserFunction = async ({ res, password, email, type, reg_type }) => {
  try {
    const checkUserExist = await UserModel.findOne({ [type]: email });

    if (!checkUserExist) {
      return res.status(400).send({
        status: false,
        message: "User Not Found ! Please Register Your Account",
      });
    }

    if (
      reg_type === REG_TYPES[0] &&
      checkUserExist?.role === ALLOWED_ROLES[2]
    ) {
      return res.status(400).send({
        status: false,
        message: "User Not Found with Entered Email/User Id",
      });
    }

    if (
      reg_type === REG_TYPES[1] &&
      (checkUserExist?.role === ALLOWED_ROLES[0] ||
        checkUserExist?.role === ALLOWED_ROLES[1])
    ) {
      return res.status(400).send({
        status: false,
        message: "User Not Found with Entered Email/User Id",
      });
    }

    const checkPassword = await verifyOtpAndPassword(
      checkUserExist?.password,
      password
    );

    if (!checkPassword) {
      return res.status(400).send({ message: "Please Check Your Password" });
    }
    if (checkUserExist?.verified) {
      const details = {
        name: checkUserExist?.name,
        user_id: checkUserExist?.user_id,
        role: checkUserExist?.role,
      };
      const token = await generateJwtToken(details);
      const sendDetails = {
        name: checkUserExist?.name,
        user_id: checkUserExist?.user_id,
        role: checkUserExist?.role,
        verified: checkUserExist?.verified,
        image: checkUserExist?.image,
        address: checkUserExist?.address,
        contact: {
          email: checkUserExist?.contact?.email,
          mobile_number: checkUserExist?.contact?.mobile_number,
        },
        jwtToken: token,
      };
      res.status(200).send({
        status: true,
        message: "Login Successfully",
        data: {
          userDetails: sendDetails,
        },
      });
    } else {
      await sendOtp({
        res,
        user_id: checkUserExist?._id,
      });
    }
  } catch (error) {
    res.status(400).send({ status: false, message: "Something Went Wrong" });
  }
};

const filterActiveList = (list) => {
  return list?.filter((eachItem) => eachItem?.status === true);
};

const filterItemSendDetails = (item) => {
  return {
    id: item?._id,
    name: item?.name,
    status: item?.status,
    image: item?.image,
  };
};

const filterItemSendSubCategoriesDetails = (item) => {
  return {
    id: item?._id,
    name: item?.name,
    status: item?.status,
    image: item?.image,
    brands: item?.brands,
    category: item?.category,
  };
};

const filterUniqueListFn = ({ filter, filterValue, list, type }) => {
  let uniqueList = [];
  if (!filter || filter === filterValue) {
    list?.map((eachItem) => {
      if (!uniqueList.includes(eachItem?.[type])) {
        uniqueList.push(eachItem?.[type]);
      }
    });
  } else {
    const newList = filter?.split(",");
    uniqueList = newList;
  }
  return uniqueList;
};

const getFiltersListFromProducts = async (model) => {
  const allCategoriesList = await model.find().select({
    category: 1,
    _id: 0,
  });
  const allSubCategoriesList = await model.find().select({
    sub_category: 1,
    _id: 0,
  });
  const allBrandsList = await model.find().select({
    brand: 1,
    _id: 0,
  });
  return { allCategoriesList, allSubCategoriesList, allBrandsList };
};

const filterProductDetails = (item) => {
  return {
    product_id: item?.product_id,
    name: item?.name,
    price: item?.price,
    description: item?.description,
    features: item?.features,
    specifications: item?.specifications,
    images: item?.images,
    stock: item?.stock,
    seller: item?.seller,
    is_premium: item?.is_premium,
    product_published_date: item?.createdAt,
  };
};

//cloudinary
const CLOUDINARY_CONFIG = {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET_KEY,
};

//multer config disk storage
const STORAGE = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.resolve(__dirname, "../uploads");
    return cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    return cb(null, `${uniqueId()}${file.originalname}`);
  },
});

const checkImageUploadType = (properties) => (req, res, next) => {
  Object.assign(req, properties);
  next();
};

const IMAGE_UPLOAD_TYPES = {
  filter: "filter",
  user: "user",
};

const SORT_FILTER_OPTIONS = {
  relavance: "Relavance",
  popularity: "Popularity",
  price_low_to_high: "Price Low To High",
  price_high_to_low: "Price High To Low",
  newest_first: "Newest First",
  better_discount: "Better Discount",
};

module.exports = {
  MONGO_URL,
  generateOtp,
  makeHashText,
  verifyOtpAndPassword,
  generateJwtToken,
  sendMail,
  authorizeUser,
  generateRandomEmailandUserId,
  preCheckValidations,
  verifyOtp,
  sendOtp,
  loginUserFunction,
  REG_TYPES,
  authorizeAdmin,
  verificationMiddleWare,
  ALLOWED_ROLES,
  authorizeSeller,
  filterActiveList,
  filterItemSendDetails,
  STORAGE,
  CLOUDINARY_CONFIG,
  filterUniqueListFn,
  getFiltersListFromProducts,
  filterItemSendSubCategoriesDetails,
  filterProductDetails,
  checkImageUploadType,
  IMAGE_UPLOAD_TYPES,
  SORT_FILTER_OPTIONS,
};
