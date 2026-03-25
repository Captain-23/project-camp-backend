import {body} from "express-validator";


const userRegiterValidator = () =>{
    return [
        body("email")
            .trim()
            .notEmpty()
            .withMessage("Email is required")
            .isEmail()
            .withMessage("Email is invalid"),
        body("username")
            .trim()
            .notEmpty()
            .withMessage("Username is required")
            .isLowercase()
            .withMessage("Username must be in lowercase")
            .isLength({min: 3})
            .withMessage("Username must be 3 characters long"),
        body("password")
            .trim()
            .notEmpty()
            .withMessage("Password can't be empty"),
        body("fullName")
            .optional()
            .trim()
    ]
}


export{
    userRegiterValidator
}