import Mailgen from "mailgen";

let mailGenerator = new Mailgen({
  theme: "salted",
  product: {
    name: "Task Manager", // Your product name
    link: "https://yourcompany.com",
    logo: "https://yourcompany.com/logo.png", // Optional logo
  },
});

const emailverificationContentGenerator = (userName, verificationLink) => {
  return {
    body: {
      name: userName,
      intro: "Welcome to our platform!",
      message: "Please click the button below to verify your email address.",
      action: {
        instructions: "Click the button below to verify your email address.",
        button: {
          color: "#2250bc", // Optional action button color
          text: "Verify Email",
          link: verificationLink,
        },
      },
    },

    outro: "If you did not create an account, no further action is required.",
  };
};

const forgotPasswordEmailContentGenerator = (userName, resetLink) => {
  return {
    body: {
      name: userName,
      intro: "You have requested to reset your password.",
      message: "Please click the button below to reset your password.",
      action: {
        instructions: "Click the button below to reset your password.",
        button: {
          color: "#bc6f22", // Optional action button color
          text: "Reset Password",
          link: resetLink,
        },
      },
    },
    outro:
      "If you did not request a password reset, no further action is required.",
  };
};


export {
    mailGenerator,
    emailverificationContentGenerator,
    forgotPasswordEmailContentGenerator,
}