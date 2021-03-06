const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const {UserInputError} = require("apollo-server");

const {validateRegisterInput, validateLoginInput} = require("../../utility/validators");
const {SECRET_KEY} = require("../../config");
const User = require("../../models/User");

function generateToken(user){
    return jwt.sign({
        //Will add payload to token
        id: user._id,
        email: user.email,
        username: user.username,

    }, SECRET_KEY, { expiresIn: "1h" }); //expires in 1 hour

}

module.exports = {
  Mutation: {
    //Add async await because bcrypt is an asynchronous function
    async login(_, {username, password}){
        const {valid, errors} = validateLoginInput(username, password);
        if(!valid){
            throw new UserInputError("Errors", {errors});
        }
        const user = await User.findOne({username});
        if(!user){
            errors.general = "User not found";
            throw new UserInputError("User not found", {errors});
        }
        const match = await bcrypt.compare(password, user.password);
        if(!match){
            errors.general = "Wrong credentials";
            throw new UserInputError("Wrong credentials", {errors});
        }
        const token = generateToken(user);
        return {
          ...user._doc,
          id: user._id,
          token,
        };
    },

    async register(
      _,
      { registerInput: { username, email, password, confirmPassword } },
      context,
      info
    ) {
      //args, context, info
      //TODO: VALIDATE USER DATA
      const {valid, errors} = validateRegisterInput(username, email, password, confirmPassword);
      if(!valid){
          throw new UserInputError("Errors",{ errors });
      }
      //TODO: Make sure user doesn't already exist
      const user = await User.findOne({ username });
      if (user) {
        throw new UserInputError("User already exists", {
          errors: { username: "This username is already taken" }
        });    
      }

      //TODO: Hash password and create auth token ***Install bcryptjs and jsonwebtoken***
      password = await bcrypt.hash(password, 12);

      const newUser = new User({
        email,
        username,
        password,
        createdAt: new Date().toISOString(),
      });

      const res = await newUser.save();

      const token = generateToken(res);
      return {
        ...res._doc,
        id: res._id,
        token
      }
    },
  },
};
